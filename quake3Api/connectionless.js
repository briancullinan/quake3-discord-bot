var statusResponse = require('./status-response.js')
var parseConfigStr = require('../quake3Utils/parse-configstr.js')
var parseMasters = require('../quake3Utils/parse-masters.js')

function getServersResponse(message) {
  var servers = parseMasters(message)
  for(var m in servers) {
    getStatus(servers[m].ip, servers[m].port)
  }
  return {
    servers: servers
  }
}

function printResponse(message) {
  return {
    content: message
  }
}

function challengeResponse(message) {
  return {
    challenge: message.split(/\s+/ig)[0]
  }
}

function connectResponse(message) {
  return {
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
      challenge: message.split(/\s+/ig)[0]
    }
  }
}

function connectionlessPacket(message) {
  var connectionlessResponses = [
    {name: 'getserversResponse', fn: getServersResponse},
    {name: 'getserversExtResponse', fn: getServersResponse},
    {name: 'statusResponse', fn: statusResponse},
    {name: 'infoResponse', fn: parseConfigStr},
    {name: 'print', fn: printResponse},
    {name: 'challengeResponse', fn: challengeResponse},
    {name: 'connectResponse', fn: connectResponse},
  ]
  for(var i = 0; i < connectionlessResponses.length; i++) {
    var name = connectionlessResponses[i]
    if(message.slice(0, name.length).toString('utf-8').toLowerCase() == name) {
      message = message.slice(name.length).toString('utf-8').trim()
      var data = connectionlessResponses.fn(message)
      return data
    }
  }
  console.log('Unknown message:', message.toString('utf-8'))
}
