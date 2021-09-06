/***

This is basically organized the same way as the Quake 3 client code

***/
var {inherits} = require('util')
var {EventEmitter} = require('events')
var {readBits} = require('../quake3Utils/huffman.js')
var {MAX_RELIABLE_COMMANDS} = require('./config-strings.js')
var parseGamestate = require('./parse-gamestate.js')
var {parseCommandString} = require('./parse-command.js')
function SE() {}
inherits(SE, EventEmitter)
var serverMessageEvent = new SE

function parseServerMessage(message, channel, server) {
  // get the reliable sequence acknowledge number
  var read = readBits(message, 0, 32)
  channel.reliableAcknowledge = read[1]
  if ( channel.reliableAcknowledge < channel.reliableSequence - MAX_RELIABLE_COMMANDS ) {
  	channel.reliableAcknowledge = channel.reliableSequence
  }

  // parse the message
  while(true) {
    read = readBits(message, read[0], 8)
    var cmd = read[1]

    if ( cmd == 8 ) { // svc_EOF
        break;
    }

    channel.messageType = cmd
    var eventName
    switch(cmd) {
      default:
        console.log('Illegible server message', cmd)
      break
      case 0: // svc_bad
        eventName = 'svc_bad'
      break
      case 1: // svc_nop
        eventName = 'svc_nop'
      break
      case 2: // svc_gamestate
        read = parseGamestate(read, message, channel, server)
        eventName = 'svc_gamestate'
      break
      case 3: // svc_configstring
        eventName = 'svc_configstring'
      break
      case 4: // svc_baseline
        eventName = 'svc_baseline'
      break
      case 5: // svc_serverCommand
        read = parseCommandString(read, message, channel, server)
        eventName = 'svc_serverCommand'
      break
      case 6: // svc_download
        eventName = 'svc_download'
      break
      case 7: // svc_snapshot
        // begin sending input messages so we can receive a gamestate
        //   all this does is echo the ACK number back to the server
        // TODO: properly parse snapshot and read XYZ locations
        eventName = 'svc_snapshot'
        channel[eventName] = channel
        serverMessageEvent.emit(eventName, channel)
        return
      break
      case 9: // svc_voipSpeex
      break
      case 10: // svc_voipOpus
      break
      case 16: // svc_multiview
        eventName = 'svc_multiview'
      break
      case 17: // svc_zcmd
        eventName = 'svc_zcmd'
      break
    }
    //console.log(channel)
    channel[eventName] = channel
    serverMessageEvent.emit(eventName, channel)
  }
  return channel
}

module.exports = {
  parseServerMessage,
  serverMessageEvent,
}
