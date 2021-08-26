var dgram = require('dgram')
var udpClient = dgram.createSocket('udp4')
var {packetEvent} = require('./parse-packet.js')
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
  await sendConnectionless(`getchallenge ${challenge} ${gamename}`, address, port)
}

async function sendConnect(address, port = 27960, info) {
  if(typeof info.qport == 'undefined')
    info['qport'] = udpClient.address().port
  var connectInfo = typeof info == 'string' 
    ? info 
    : Object.keys(info).map(k => '\\' + k + '\\' + info[k]).join('')
  var compressedInfo = await compressMessage(`"${compressedInfo}"`)
  await sendConnectionless(`connect ${compressedInfo}`, address, port)
}

async function sendRcon(address, port = 27960, command, password = DEFAULT_PASS) {
  await sendConnectionless(`rcon "${password}" ${command}`, address, port)
}

async function getStatus(address, port = 27960) {
  await sendConnectionless('getstatus', address, port)
}

async function getInfo(address, port = 27960) {
  await sendConnectionless('getinfo xxx', address, port)
}

async function getServers(master = DEFAULT_MASTER, port = 27950, wait = true) {
  await sendConnectionless('getservers 68 empty', master, port)
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
