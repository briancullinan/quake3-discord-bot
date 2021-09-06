/***

This is basically organized the same way as the Quake 3 client code

***/
var {inherits} = require('util')
var {EventEmitter} = require('events')
var {readBits} = require('../quake3Utils/huffman.js')
var {
  SwapLong, SwapShort, NETCHAN_GENCHECKSUM, ReadString
} = require('../quake3Utils/maths.js')
var {
  entityStateFields, GENTITYNUM_BITS, MAX_POWERUPS,
} = require('./entity-fields.js')
var parseConfigStr = require('../quake3Utils/parse-configstr.js')
function SE() {}
inherits(SE, EventEmitter)
var serverMessageEvent = new SE

var MAX_RELIABLE_COMMANDS = 64
var	MAX_MODELS = 256		// these are sent over the net as 8 bits
var	MAX_SOUNDS = 256		// so they cannot be blindly increased
var	MAX_CLIENTS = 64
var MAX_LOCATIONS = 64
var MAX_GENTITIES = (1<<GENTITYNUM_BITS)

var MAX_PACKETLEN = 1400
var FRAGMENT_SIZE = (MAX_PACKETLEN - 100)
var MAX_MSGLEN = 16384
var FLOAT_INT_BITS = 13
var FLOAT_INT_BIAS = (1<<(FLOAT_INT_BITS-1))

var	CS_SERVERINFO = 0 // an info string with all the serverinfo cvars
var CS_SYSTEMINFO = 1 // an info string for server system to client system configuration (timescale, etc)
var CS_MUSIC = 2
var CS_MESSAGE = 3		// from the map worldspawn's message field
var CS_MOTD = 	4		  // g_motd string for server message of the day
var CS_WARMUP = 5		  // server time when the match will be restarted
var CS_SCORES1 = 6
var CS_SCORES2 = 7
var CS_VOTE_TIME = 8
var CS_VOTE_STRING = 9
var CS_VOTE_YES = 10
var CS_VOTE_NO = 11

var CS_TEAMVOTE_TIME = 12
var CS_TEAMVOTE_STRING = 14
var CS_TEAMVOTE_YES = 16
var CS_TEAMVOTE_NO = 18

var CS_GAME_VERSION = 20
var CS_LEVEL_START_TIME = 21		// so the timer only shows the current level
var CS_INTERMISSION = 22		// when 1, fraglimit/timelimit has been hit and intermission will start in a second or two
var CS_FLAGSTATUS = 23		// string indicating flag status in CTF
var CS_SHADERSTATE = 24
var CS_BOTINFO = 25

var CS_ITEMS = 27		// string of 0's and 1's that tell which items are present
var	CS_MODELS = 32

var	CS_SOUNDS = (CS_MODELS+MAX_MODELS)
var	CS_PLAYERS = (CS_SOUNDS+MAX_SOUNDS)
var CS_LOCATIONS = (CS_PLAYERS+MAX_CLIENTS)
var CS_PARTICLES = (CS_LOCATIONS+MAX_LOCATIONS)

var CS_MAX = (CS_PARTICLES+MAX_LOCATIONS)

function netchanProcess(message, channel) {
  var read = 0
  var sequence = SwapLong(read, message)
  read += 32
  var fragment = (sequence >>> 31) === 1
  if(fragment) {
    sequence &= ~(1 << 31)
  }
  if(false) { // from client to server
    /*qport=*/ read += 16
  }

  var valid = false
  if(!channel.compat) {
    var checksum = SwapLong(read, message)
    read += 32
    valid = NETCHAN_GENCHECKSUM(channel.challenge, sequence) === checksum
  }
  if(!valid) {
      console.log('Invalid message received', sequence, channel.challenge)
      return false
  }
  
  var fragmentStart = 0
  var fragmentLength = 0
  if(fragment) {
    fragmentStart = SwapShort(read, message)
    read += 16
    fragmentLength = SwapShort(read, message)
    read += 16
  }
  
  if ( sequence <= channel.serverSequence ) {
      console.log('Out of order packet', sequence, channel.incomingSequence)
      return false
  }
  
  //channel.dropped = sequence - (channel.incomingSequence+1)
  
  if(fragment) {
    console.log('fragment message')
    // fragment and only return on final message
    if(!channel.fragmentBuffer) channel.fragmentBuffer = Buffer.from([])
    if(sequence != channel.fragmentSequence) {
      channel.fragmentSequence = sequence
      channel.fragmentLength = 0
      channel.fragmentBuffer = Buffer.from([])
    }

    if ( fragmentStart != channel.fragmentLength ) {
      return false
    }

    channel.fragmentBuffer = Buffer.concat([
      Buffer.from(channel.fragmentBuffer),
      Buffer.from(message.subarray(read>>3, (read>>3) + fragmentLength))
    ])
    channel.fragmentLength += fragmentLength

    if ( fragmentLength == FRAGMENT_SIZE ) {
      return false
    }

    if ( channel.fragmentLength > MAX_MSGLEN ) {
      return false
    }

    return true
  }

  channel.serverSequence = sequence
  // finished parsing header
  return read
}

function readDeltaEntity(read, message, channel, number) {
  // check for a remove
  read = readBits(message, read[0], 1)
  if(read[1] == 1) { // remove
    delete channel.entities[number]
    return read
  }
  
  // check for no delta
  read = readBits(message, read[0], 1)
  if(read[1] == 0) { // no delta
    if(typeof channel.entities[number] == 'undefined')
      channel.entities[number] = 0
    return read
  }
  
  
  read = readBits(message, read[0], 8)
  var lc = read[1]

  for(var j = 0; j < lc; j++) {
    read = readBits(message, read[0], 1)
    if(read[1] == 0) // no change
      continue

    // fields bits
    if(entityStateFields[j] == 0) {
      read = readBits(message, read[0], 1)
      if(read[1] == 0) {
        channel.entities[number] = 0
      } else {
        read = readBits(message, read[0], 1)
        if(read[1] == 0) {
          read = readBits(message, read[0], FLOAT_INT_BITS)
          channel.entities[number] = read[1] - FLOAT_INT_BIAS
        } else {
          read = readBits(message, read[0], 32)
          channel.entities[number] = read[1]
        }
      }
    } else {
      read = readBits(message, read[0], 1)
      if(read[1] == 0) {
        channel.entities[number] = 0
      } else {
        read = readBits(message, read[0], entityStateFields[j])
        channel.entities[number] = read[1]
      }
    }
  }
  return read
}

function readDeltaPlayerstate() {
  /*

  read = readBits(message, read[0], 1)
  if(read[1] == 1) {

      // parse stats
      read = readBits(message, read[0], 1)
      if(read[1] == 1) {
          bits = MSG_ReadBits (msg, MAX_STATS);

          for (i=0 ; i<MAX_STATS ; i++) {
              if (bits & (1<<i) ) {
                  to->stats[i] = MSG_ReadShort(msg);
              }
          }
      }
  }

  if ( MSG_ReadBits( msg, 1 ) ) {
      LOG("PS_STATS");
  }

  // parse persistant stats
  if ( MSG_ReadBits( msg, 1 ) ) {
      LOG("PS_PERSISTANT");
      bits = MSG_ReadBits (msg, MAX_PERSISTANT);
      for (i=0 ; i<MAX_PERSISTANT ; i++) {
          if (bits & (1<<i) ) {
              to->persistant[i] = MSG_ReadShort(msg);
          }
      }
  }

  // parse ammo
  if ( MSG_ReadBits( msg, 1 ) ) {
      LOG("PS_AMMO");
      bits = MSG_ReadBits (msg, MAX_WEAPONS);
      for (i=0 ; i<MAX_WEAPONS ; i++) {
          if (bits & (1<<i) ) {
              to->ammo[i] = MSG_ReadShort(msg);
          }
      }
  }

    // parse powerups
  if ( MSG_ReadBits( msg, 1 ) ) {
      LOG("PS_POWERUPS");
      bits = MSG_ReadBits (msg, MAX_POWERUPS);
      for (i=0 ; i<MAX_POWERUPS ; i++) {
          if (bits & (1<<i) ) {
              to->powerups[i] = MSG_ReadLong(msg);
          }
      }
  }
  */
}

function parseGamestate(read, message, channel, server) {
  console.log('parse gamestate')
  read = readBits(message, read[0], 32)
  channel.commandSequence = read[1]
  while(true) {
    read = readBits(message, read[0], 8)
    if(read[1] == 8)  // svc_EOF
      break

    switch(read[1]) {
      default: 
        console.log('Bad command byte')
      break
      case 3: // svc_configstring
        read = readBits(message, read[0], 16)
        var csI = read[1]
        read = ReadString(read, message, true /* big */)
        if(typeof channel.configStrings == 'undefined')
          channel.configStrings = []
        channel.configStrings[csI] = read[1]
      break
      case 4: // svc_baseline
        if(typeof channel.entities == 'undefined')
          channel.entities = []
        read = readBits(message, read[0], GENTITYNUM_BITS)
        var newnum = read[1]
        read = readDeltaEntity(read, message, channel, newnum)
      break
    }
  }

  read = readBits(message, read[0], 32)
  channel.clientNum = read[1]

  read = readBits(message, read[0], 32)
  channel.checksumFeed = read[1]

  // parse server info
  channel.serverInfo = parseConfigStr(channel.configStrings[CS_SERVERINFO])

  // parse system info
  channel.systemInfo = parseConfigStr(channel.configStrings[CS_SYSTEMINFO])
  systemInfoChanged(channel)
  configStringsChanged(channel, server)

  return read
}

function configStringsChanged(channel, server) {
  // parse player info out of config strings
  if(typeof server.players == 'undefined')
    server.players = []
  for(var i = CS_PLAYERS; i < CS_PLAYERS + MAX_CLIENTS; i++) {
    if(!channel.configStrings[i]) continue
    var player = server.players[i-CS_PLAYERS] || {}
    Object.assign(player, parseConfigStr('\\' + channel.configStrings[i]))
    server.players[i-CS_PLAYERS] = player
  }
}

function systemInfoChanged(channel) {
  channel.serverId = channel.systemInfo['sv_serverid']
  channel.isPure = channel.systemInfo['sv_pure'] == '1'
}

function parseCommandString(read, message, channel, server) {
  if(typeof channel.serverCommands == 'undefined')
      channel.serverCommands = []
  read = readBits(message, read[0], 32)
  var seq = read[1]
  channel.commandSequence = seq
  var index = seq & (MAX_RELIABLE_COMMANDS-1)
  read = ReadString(read, message)
  channel.serverCommands[index] = read[1]
  if(channel.serverCommands[index].match(/^map_restart /ig)) {
    channel.serverId = 0
  }
  if(channel.serverCommands[index].match(/^cs [0-9]+ /ig)) {
    console.log(channel.serverCommands[index])
    var i = (/^cs ([0-9]+) /ig).exec(channel.serverCommands[index])[1]
    var value = (/"(.*)"/ig).exec(channel.serverCommands[index])[1]
    channel.configStrings[i] = value
    configStringsChanged(channel, server)
  }
  if(channel.serverCommands[index].match(/^cs 1 /ig)) {
    channel.systemInfo = parseConfigStr((/"(.*)"/ig).exec(channel.serverCommands[index])[1])
    systemInfoChanged(channel)
  }
  if(channel.serverCommands[index].match(/^scores /ig)) {
    var segs = channel.serverCommands[index]
      .split(' ').slice(1)
    /*
    level.sortedClients[i],
		cl->ps.persistant[PERS_SCORE],
		ping,
		(level.time - cl->pers.enterTime)/60000,
		scoreFlags,
		g_entities[level.sortedClients[i]].s.powerups,
		accuracy, 
		cl->ps.persistant[PERS_IMPRESSIVE_COUNT],
		cl->ps.persistant[PERS_EXCELLENT_COUNT],
		cl->ps.persistant[PERS_GAUNTLET_FRAG_COUNT], 
		cl->ps.persistant[PERS_DEFEND_COUNT], 
		cl->ps.persistant[PERS_ASSIST_COUNT], 
		perfect,
		cl->ps.persistant[PERS_CAPTURES]);
    */
    console.log(channel.serverCommands[index])
    if(typeof server.players == 'undefined')
      server.players = []
    for(var i = 0; i < segs.length / 17; i++) {
      var gameI = parseInt(segs[(i * 17) + 0])
      var player = server.players[gameI - 1] || {}
      Object.assign(player, {
        'i': gameI,
        'score': parseInt(segs[(i * 17) + 4]),
        'ping': parseInt(segs[(i * 17) + 5]),
      })
      server.players[gameI - 1] = player
    }
    //console.log(segs)
  }
  return read
}

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
  netchanProcess,
  MAX_RELIABLE_COMMANDS,
}
