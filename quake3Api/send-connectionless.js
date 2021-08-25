var DEFAULT_MASTER = process.env.DEFAULT_MASTER || '207.246.91.235'
var DEFAULT_PASS = process.env.DEFAULT_PASS || 'password123!'

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

async function getServers(master = DEFAULT_MASTER, port = 27950, wait = true) {
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
