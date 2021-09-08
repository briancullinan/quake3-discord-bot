var dgram = require('dgram')
var udpClient = dgram.createSocket('udp4')
var {mergeMaster, packetEvent} = require('./parse-packet.js')
var nextResponse = require('./response-event.js')
var {connectionlessEvent} = require('./parse-connectionless.js')
var lookupDNS = require('../utilities/dns.js')
udpClient.on('message', packetEvent)
var {compressMessage} = require('../quake3Utils/huffman.js')

var DEFAULT_MASTER = process.env.DEFAULT_MASTER || '207.246.91.235'
var DEFAULT_PASS = process.env.DEFAULT_PASS || 'password123!'
var MAX_TIMEOUT = process.env.DEFAULT_TIMEOUT || 10000

function udpClose() {
  udpClient.close()
}

async function sendConnectionless(buffer, address, port) {
  var dstIP = await lookupDNS(address)
  if(typeof buffer == 'string') {
    buffer = Buffer.from(buffer.split('').map(c => c.charCodeAt(0)))
  }
  var msgBuff = Buffer.concat([
    Buffer.from('\xFF\xFF\xFF\xFF'.split('').map(c => c.charCodeAt(0))),
    Buffer.from(buffer)
  ])
  udpClient.send(msgBuff, 0, msgBuff.length, port, dstIP)
}

async function getChallenge(address, port = 27960, challenge, gamename) {
  for(var i = 0; i < 3; i++) {
    console.log(`Challenging ${i+1} (${challenge} ${gamename})...`)
    await sendConnectionless(`getchallenge ${challenge} ${gamename}`, address, port)
    var challengeResponse = await nextResponse('challengeResponse', address, port, false, 2 * 1000)
    if(challengeResponse) {
      break
    }
  }
  return challengeResponse
}

async function sendConnect(address, port = 27960, info) {
  if(typeof info.qport == 'undefined')
    info['qport'] = udpClient.address().port
  var connectInfo = typeof info == 'string' 
    ? info 
    : Object.keys(info).map(k => '\\' + k + '\\' + info[k]).join('')
  console.log('Connecting', address + ':' + port, connectInfo)
  var compressedInfo = await compressMessage(`"${connectInfo}"`)
  await sendConnectionless(Buffer.concat([
    Buffer.from('connect '.split('').map(c => c.charCodeAt(0))),
    Buffer.from(compressedInfo)
  ]), address, port)
  return await nextResponse('connectResponse', address, port)
}

async function sendRcon(address, port = 27960, command, password = DEFAULT_PASS) {
  await sendConnectionless(`rcon "${password}" ${command}`, address, port)
  return await nextResponse('printResponse', address, port)
}

async function getStatus(address, port = 27960) {
  await sendConnectionless('getstatus', address, port)
  return await nextResponse('statusResponse', address, port)
}

async function getInfo(address, port = 27960) {
  await sendConnectionless('getinfo xxx', address, port)
  return await nextResponse('infoResponse', address, port)
}

async function getServers(master = DEFAULT_MASTER, port = 27950, wait = true) {
  await sendConnectionless('getservers 68 empty', master, port)
  var response = await nextResponse('getserversResponse', master, port)
  var servers = response.servers
  if(!servers || !servers.length)
    return []
  for(var m in servers) {
    Promise.resolve(getStatus(servers[m].ip, servers[m].port))
  }
  if(wait) {
    await new Promise(resolve => {
      var waitForResponses = setTimeout(resolve, MAX_TIMEOUT)
      var responseCount = 0
      var countResponses
      countResponses = () => {
        responseCount++
        if(responseCount == servers.length) {
          clearTimeout(waitForResponses)
          connectionlessEvent.off('statusResponse', countResponses)
          resolve() // return immediately instead
        }
      }
      connectionlessEvent.on('statusResponse', countResponses)
    })
  } else {
    // can't use getInfo() because it depends on at least 1 statusResponse
    await nextResponse('statusResponse')
  }
  for(var m in servers) {
    servers[m] = mergeMaster({
      ip: servers[m].ip, 
      port: servers[m].port
    })
  }
  return servers
}

module.exports = {
  sendConnectionless,
  getChallenge,
  sendConnect,
  sendRcon,
  getStatus,
  getInfo,
  getServers,
  udpClient,
  udpClose
}
