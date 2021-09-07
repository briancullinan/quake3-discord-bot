var {inherits} = require('util')
var {EventEmitter} = require('events')
var statusResponse = require('./parse-status.js')
var parseConfigStr = require('../quake3Utils/parse-configstr.js')
var parseMasters = require('../quake3Utils/parse-masters.js')
var {recentEvent} = require('./parse-event.js')
function CE() {}
inherits(CE, EventEmitter)
var connectionlessEvent = new CE

function getServersResponse(message, buffer) {
  var servers = parseMasters(buffer)
  return {
    getserversResponse: true,
    servers: servers
  }
}

function printResponse(message) {
  return {
    content: message
  }
}

function challengeResponse(message) {
  var segs = message.split(/\s+/ig)
  return {
    challenge: segs[0],
    channel: {
      compat: segs[2] && parseInt(segs[2]) < 71
    },
  }
}

function connectResponse(message, _, server) {
  return {
    // begin netchan compression
    connected: true,
    channel: {
      compat: server.challengeResponse && server.challengeResponse.channel.compat,
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

function connectionlessPacket(message, server) {
  console.log(message.toString('utf-8'))
  var connectionlessResponses = [
    {name: 'getserversResponse', fn: getServersResponse},
    {name: 'getserversExtResponse', fn: getServersResponse},
    {name: 'statusResponse', fn: statusResponse},
    {name: 'infoResponse', fn: parseConfigStr},
    {name: 'print', fn: printResponse},
    {name: 'challengeResponse', fn: challengeResponse},
    {name: 'connectResponse', fn: connectResponse},
    {name: 'recentEvent', fn: recentEvent},
  ]
  for(var i = 0; i < connectionlessResponses.length; i++) {
    var name = connectionlessResponses[i].name
    if(message.slice(0, name.length).toString('utf-8').toLowerCase() == name.toLowerCase()) {
      var buffer = message.slice(name.length)
      var message = buffer.toString('utf-8').trim()
      var data = connectionlessResponses[i].fn(message, buffer, server)
      if(typeof data == 'object')
        data[name] = data
      connectionlessEvent.emit(name, data)
      return data
    }
  }
  console.log('Unknown message:', message.toString('utf-8'))
}

module.exports = {
  connectionlessPacket,
  connectionlessEvent
}
