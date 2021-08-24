var path = require('path')
var fs = require('fs')
var zlib = require('zlib')
var dgram = require('dgram')
var udpClient = dgram.createSocket('udp4')
udpClient.on('message', updateInfo)

var importer = require('../Core')
var mdfour = importer.import('md4 checksum')
var {
    getServersResponse, statusResponse, infoResponse
} = importer.import('quake 3 server responses')
var lookupDNS = importer.import('dns lookup')
var {
    compressMessage,
    writeBits
} = importer.import('huffman decode')
var decodeClientMessage = importer.import('decode client message')


var MAX_TIMEOUT = process.env.DEFAULT_TIMEOUT || 10000
var MAX_RELIABLE_COMMANDS = 64
var DEFAULT_MASTER = process.env.DEFAULT_MASTER || '207.246.91.235' || '192.168.0.4'
var DEFAULT_PASS = process.env.DEFAULT_PASS || 'password123!'

var masters = []
var nextResponse = {
    nextInfo: null,
    nextStatus: null,
    nextServer: null,
    nextPrint: null,
}

function mergeMaster(master) {
    var found = false
    masters.forEach((ma, i) => {
        if(ma['ip'] == master['ip'] && ma['port'] == master['port']) {
            found = true
            Object.assign(masters[i], master)
            Object.assign(master, masters[i])
            return false
        }
    })
    if(!found)
        masters.push(master)
    return master
}

async function updateInfo(m, rinfo) {
    var master = mergeMaster({
        ip: rinfo.address,
        port: rinfo.port
    })
    if(m[0] == 255 && m[1] == 255 && m[2] == 255 && m[3] == 255)
        m = m.slice(4, m.length)
    else {
        if(master.connected) {
            master.channel = master.channel || {}
            var commandNumber = master.channel.commandSequence
            var channel = await decodeClientMessage(m, master.channel)
            if(channel === false) {
                return
            }
            //console.log(channel)
            if (channel.messageType == 2) { // svc_gamestate
                nextResponse.nextGamestate = 
                master.nextResponse.nextGamestate = channel
            } else if (channel.messageType == 7) { // svc_snapshot
                nextResponse.nextSnapshot = 
                master.nextResponse.nextSnapshot = channel
            } else if (channel.messageType > 0) {
            }
            if(commandNumber < channel.commandSequence) {
                for(var j = commandNumber + 1; j <= channel.commandSequence; j++) {
                    var index = j & (MAX_RELIABLE_COMMANDS-1)
                    if((channel.serverCommands[index] + '').match(/^chat /i)) {
                        nextResponse.nextChat = 
                        master.nextResponse.nextChat = channel.serverCommands[index] + ''
                    }
                    console.log('serverCommand:', j, channel.serverCommands[index])
                }
            }
            // always respond with input event
            // response to snapshots automatically and not waiting,
            //   so new messages can be received
            sendSequence(rinfo.address, rinfo.port, channel)
            nextResponse.nextChannel = 
            master.nextResponse.nextChannel = channel
            return
        }
    }
        
    if(m.slice(0, 'getserversResponse'.length).toString('utf-8').toLowerCase() == 'getserversresponse'
      || m.slice(0, 'getserversExtResponse'.length).toString('utf-8').toLowerCase() == 'getserversextresponse') {
        var masters = getServersResponse(m)
        for(var m in masters) {
            nextResponse.nextServer = 
            master.nextResponse.nextServer = mergeMaster(masters[m])
            await getStatus(masters[m].ip, masters[m].port)
        }
    } else if (m.slice(0, 'statusResponse'.length).toString('utf-8').toLowerCase() == 'statusresponse') {
        var status = mergeMaster(Object.assign(statusResponse(m), {
            ip: rinfo.address,
            port: rinfo.port
        }))
        nextResponse.nextStatus = 
        master.nextResponse.nextStatus = status
    } else if (m.slice(0, 'infoResponse'.length).toString('utf-8').toLowerCase() == 'inforesponse') {
        var info = mergeMaster(Object.assign(infoResponse(m), {
            ip: rinfo.address,
            port: rinfo.port
        }))
        nextResponse.nextInfo = 
        master.nextResponse.nextInfo = info
    } else if (m.slice(0, 'print'.length).toString('utf-8') == 'print') {
        var print = mergeMaster(Object.assign({
            content: m.slice('print'.length).toString('utf-8')
        }, {
            ip: rinfo.address,
            port: rinfo.port
        }))
        nextResponse.nextPrint = 
        master.nextResponse.nextPrint = print
    } else if (m.slice(0, 'challengeResponse'.length).toString('utf-8').toLowerCase() == 'challengeresponse') {
        var challenge = mergeMaster(Object.assign({
            challenge: m.slice('challengeResponse'.length).toString('utf-8').trim().split(/\s+/ig)[0]
        }, {
            ip: rinfo.address,
            port: rinfo.port
        }))
        nextResponse.nextChallenge = 
        master.nextResponse.nextChallenge = challenge
    } else if (m.slice(0, 'connectResponse'.length).toString('utf-8').toLowerCase() == 'connectresponse') {
        var challenge = mergeMaster(Object.assign({
            // begin netchan compression
            connected: true,
            channel: {
                compat: false,
                incomingSequence: 0,
                fragmentSequence: 0,
                serverSequence: 0,
                outgoingSequence: 0,
                reliableSequence: 0,
                reliableCommands: [],
                challenge: m.slice('connectResponse'.length).toString('utf-8').trim().split(/\s+/ig)[0]
            }
        }, {
            ip: rinfo.address,
            port: rinfo.port
        }))
        nextResponse.nextConnect = 
        master.nextResponse.nextConnect = challenge
    } else {
        console.log('unknown message:', m.toString('utf-8'))
    }
    nextResponse.nextAny = 
    master.nextResponse.nextAny = {
        content: m.toString('utf-8')
    }
    Object.assign(nextResponse.nextAny, {
        ip: rinfo.address,
        port: rinfo.port
    })
    if(!nextResponse.nextAll) {
        nextResponse.nextAll = []
    }
    if(!master.nextResponse.nextAll) {
        master.nextResponse.nextAll = []
    }
    nextResponse.nextAll.push(nextResponse.nextAny)
    master.nextResponse.nextAll.push(nextResponse.nextAny)
}

async function getNextResponse(key, address, port = 27960) {
    var timeout = 0
    var server
    if(address) {
        var dstIP = await lookupDNS(address)
        server = mergeMaster({
            ip: dstIP,
            port: port
        })
        if(!server.nextResponse) {
            server.nextResponse = {}
        }
        server.nextResponse.nextAll = []
        server.nextResponse[key] = null
    }
    nextResponse.nextAll = []
    nextResponse[key] = null
    return new Promise(resolve => {
        var waiter
        waiter = setInterval(() => {
            timeout += 20
            if((!address && nextResponse[key] != null)
               || (address && server.nextResponse[key] != null)
               || timeout >= MAX_TIMEOUT) {
                clearInterval(waiter)
                resolve(nextResponse[key])
            }
        }, 20)
    })
}

async function nextInfoResponse(address, port = 27960) {
    return await getNextResponse('nextInfo', address, port)
}

async function nextServerResponse(address, port = 27960) {
    return await getNextResponse('nextServer', address, port)
}

async function nextStatusResponse(address, port = 27960) {
    return await getNextResponse('nextStatus', address, port)
}

async function nextPrintResponse(address, port = 27960) {
    return await getNextResponse('nextPrint', address, port)
}

async function nextChallengeResponse(address, port = 27960) {
    return await getNextResponse('nextChallenge', address, port)
}

async function nextChannelMessage(address, port = 27960) {
    return await getNextResponse('nextChannel', address, port)
}

async function nextGamestate(address, port = 27960) {
    return await getNextResponse('nextGamestate', address, port)
}

async function nextConnectResponse(address, port = 27960) {
    return await getNextResponse('nextConnect', address, port)
}

async function nextSnapshot(address, port = 27960) {
    return await getNextResponse('nextSnapshot', address, port)
}

async function nextChat(address, port = 27960) {
    return await getNextResponse('nextChat', address, port)
}

async function nextAnyResponse(address, port = 27960) {
    return await getNextResponse('nextAny', address, port)
}

async function nextAllResponses(address, port = 27960) {
    return await getNextResponse('nextAll', address, port)
}

async function getChallenge(address, port = 27960, challenge, gamename) {
    var dstIP = await lookupDNS(address)
    var msgBuff = new Buffer.from(`\xFF\xFF\xFF\xFFgetchallenge ${challenge} ${gamename}`.split('').map(c => c.charCodeAt(0)))
    udpClient.send(msgBuff, 0, msgBuff.length, port, dstIP)
}

async function sendConnect(address, port = 27960, info) {
    var connectInfo = typeof info == 'string' 
        ? info 
        : Object.keys(info).map(k => '\\' + k + '\\' + info[k]).join('')
    var dstIP = await lookupDNS(address)
    var compressedInfo = await compressMessage(`\xFF\xFF\xFF\xFFconnect "${connectInfo}"`)
    var msgBuff = new Buffer.from(compressedInfo)
    udpClient.send(msgBuff, 0, msgBuff.length, port, dstIP)
}


function NETCHAN_GENCHECKSUM(challenge, sequence) {
    return (challenge) ^ ((sequence) * (challenge))
}

var pak8pk3 = [0,695294960,269430381,2656948387,485997170,1095318617]

async function sendSequence(address, port, channel) {
    var msg
    //console.log('seq', channel.serverSequence, channel.commandSequence)
    msg = writeBits([]    , 0     , channel.serverId || 0, 32)
    msg = writeBits(msg[1], msg[0], channel.serverId ? (channel.serverSequence || 0) : 0, 32)
    msg = writeBits(msg[1], msg[0], channel.serverId ? (channel.commandSequence || 0) : 0, 32)
    
    // write any unacknowledged clientCommands
    for ( var i = channel.reliableAcknowledge + 1 ; i <= channel.reliableSequence ; i++ ) {
		msg = writeBits(msg[1], msg[0], 4, 8) // clc_clientCommand
		msg = writeBits(msg[1], msg[0], i, 32)
        var command = channel.reliableCommands[ i & (MAX_RELIABLE_COMMANDS-1) ]
        for ( var c = 0 ; c < command.length; c++ ) {
            // get rid of 0x80+ and '%' chars, because old clients don't like them
            var v
            if ( command[c] & 0x80 || command[c] == '%' )
                v = '.'.charCodeAt(0);
            else
                v = command[c].charCodeAt(0);
            msg = writeBits(msg[1], msg[0], v, 8)
        }
        msg = writeBits(msg[1], msg[0], 0, 8)
	}

    // empty movement
    msg = writeBits(msg[1], msg[0], 3, 8) // clc_moveNoDelta
    // write the command count
    msg = writeBits(msg[1], msg[0], 1, 8)
    // write delta user cmd key
    msg = writeBits(msg[1], msg[0], 1, 1)
    // TODO: spectate and record player locations
    msg = writeBits(msg[1], msg[0], 0, 1) // no change

    var dstIP = await lookupDNS(address)
    var qport = udpClient.address().port
    var checksum = NETCHAN_GENCHECKSUM(channel.challenge, channel.outgoingSequence)
    var msgBuff = Buffer.concat([new Buffer.from([
        (channel.outgoingSequence >> 0) & 0xFF,
        (channel.outgoingSequence >> 8) & 0xFF,
        (channel.outgoingSequence >> 16) & 0xFF,
        (channel.outgoingSequence >> 24) & 0xFF,
        (qport >> 0) & 0xFF,
        (qport >> 8) & 0xFF,
        (checksum >> 0) & 0xFF,
        (checksum >> 8) & 0xFF,
        (checksum >> 16) & 0xFF,
        (checksum >> 24) & 0xFF,
    ]), msg[1]])
    channel.outgoingSequence++
    //console.log(qport, channel.commandSequence)
    udpClient.send(msgBuff, 0, msgBuff.length, port, dstIP)
}

async function sendReliable(address, port, cmd) {
    var dstIP = await lookupDNS(address)
    var server = mergeMaster({
        ip: dstIP,
        port: port
    })
    if(typeof server.channel != 'undefined') {
        console.log('clientCommand: ', cmd)
        var channel = server.channel
    	channel.reliableSequence++
        var index = channel.reliableSequence & ( MAX_RELIABLE_COMMANDS - 1 )
        channel.reliableCommands[index] = cmd
        await sendSequence(address, port, channel)
    } else
        console.log('Not connected')
}

async function sendPureChecksums(address, port, channel) {
    // TODO: calculate different checksums for other games QVMs
    var checksum = pak8pk3[0] = channel.checksumFeed
    var headers = new Uint8Array(Uint32Array.from(pak8pk3).buffer)
    var digest = new Uint32Array(4)
    mdfour(digest, headers, headers.length)
    var unsigned = new Uint32Array(1)
    unsigned[0] = digest[0] ^ digest[1] ^ digest[2] ^ digest[3]
    checksum ^= unsigned[0]
    checksum ^= 1
    sendReliable(address, port, 'cp ' + channel.serverId 
                 + ' '   + unsigned[0]
                 + ' '   + unsigned[0]
                 + ' @ ' + unsigned[0]
                 + ' '   + checksum)
}

async function sendRcon(address, port = 27960, command, password = DEFAULT_PASS) {
    var dstIP = await lookupDNS(address)
    var msgBuff = new Buffer.from(`\xFF\xFF\xFF\xFFrcon "${password}" ${command}`.split('').map(c => c.charCodeAt(0)))
    udpClient.send(msgBuff, 0, msgBuff.length, port, dstIP)
}

async function getStatus(address, port = 27960) {
    var dstIP = await lookupDNS(address)
    var msgBuff = new Buffer.from('\xFF\xFF\xFF\xFFgetstatus'.split('').map(c => c.charCodeAt(0)))
    udpClient.send(msgBuff, 0, msgBuff.length, port, dstIP)
}

async function getInfo(address, port = 27960) {
    var dstIP = await lookupDNS(address)
    var msgBuff = new Buffer.from('\xFF\xFF\xFF\xFFgetinfo xxx'.split('').map(c => c.charCodeAt(0)))
    udpClient.send(msgBuff, 0, msgBuff.length, port, dstIP)
}

async function listMasters(master = DEFAULT_MASTER, port = 27950, wait = true) {
    var dstIP = await lookupDNS(master)
    var msgBuff = new Buffer.from('\xFF\xFF\xFF\xFFgetservers 68 empty'.split('').map(c => c.charCodeAt(0)))
    udpClient.send(msgBuff, 0, msgBuff.length, port, dstIP)
    if(wait) {
        await new Promise(resolve => setTimeout(resolve, MAX_TIMEOUT))
    } else {
        var timeout = 0
        var timer
        // can't use nextInfoResponse() because it depends on at least 1 statusResponse
        await nextStatusResponse()
    }
    return masters
}

module.exports = {
    listMasters,
    getInfo,
    getStatus,
    getChallenge,
    sendRcon,
    sendConnect,
    sendSequence,
    sendReliable,
    sendPureChecksums,
    udpClient,
    nextInfoResponse,
    nextStatusResponse,
    nextServerResponse,
    nextPrintResponse,
    nextChallengeResponse,
    nextConnectResponse,
    nextChannelMessage,
    nextGamestate,
    nextAnyResponse,
    nextSnapshot,
    nextChat,
    nextAllResponses,
}
