var {readBits} = require('../quake3Utils/huffman.js')
var {ReadString} = require('../quake3Utils/maths.js')
var parseConfigStr = require('../quake3Utils/parse-configstr.js')
var {
  MAX_RELIABLE_COMMANDS, CS_PLAYERS, MAX_CLIENTS
} = require('./config-strings.js')

function configStringsChanged(channel, server) {
  // parse player info out of config strings
  //console.log(channel.configStrings.slice(CS_PLAYERS, CS_PLAYERS + MAX_CLIENTS))
  if(typeof server.players == 'undefined')
    server.players = []
  for(var i = CS_PLAYERS; i < CS_PLAYERS + MAX_CLIENTS; i++) {
    if(!channel.configStrings[i]) {
      delete server.players[i-CS_PLAYERS]
      continue
    }
    var player = server.players[i-CS_PLAYERS] || {}
    Object.assign(player, parseConfigStr('\\' + channel.configStrings[i]))
    server.players[i-CS_PLAYERS] = player
  }
}

function systemInfoChanged(channel) {
  channel.serverId = channel.systemInfo['sv_serverid']
  channel.isPure = channel.systemInfo['sv_pure'] == '1'
}

function parsePlayerScores(command, channel, server) {
  console.log(command)
  var segs = command.split(' ').slice(4)
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
  if(typeof server.players == 'undefined')
    server.players = []
  if(server.gamename.toLowerCase() == 'defrag') {
    for(var i = 0; i < segs.length / 4; i++) {
      var gameI = parseInt(segs[(i * 4) + 0])
      var player = server.players[gameI] || {}
      Object.assign(player, {
        'i': gameI,
        'rank': parseInt(segs[(i * 4) + 0]),
        'score': parseInt(segs[(i * 4) + 1]),
        'ping': parseInt(segs[(i * 4) + 2]),
      })
      server.players[gameI] = player
    }
    return
  }
  for(var i = 0; i < segs.length / 14; i++) {
    var gameI = parseInt(segs[(i * 14) + 0])
    var player = server.players[gameI] || {}
    Object.assign(player, {
      'i': gameI,
      'rank': parseInt(segs[(i * 14) + 0]),
      'score': parseInt(segs[(i * 14) + 1]),
      'ping': parseInt(segs[(i * 14) + 2]),
    })
    server.players[gameI] = player
  }
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
    var i = (/^cs ([0-9]+) /ig).exec(channel.serverCommands[index])[1]
    var value = (/^cs [0-9]+ (.*)/ig).exec(channel.serverCommands[index])[1]
    value = value.trim().replace(/^"|"$/ig, '')
    channel.configStrings[i] = value
    configStringsChanged(channel, server)
  }
  if(channel.serverCommands[index].match(/^cs 1 /ig)) {
    channel.systemInfo = parseConfigStr((/"(.*)"/ig).exec(channel.serverCommands[index])[1])
    systemInfoChanged(channel)
  }
  if(channel.serverCommands[index].match(/^scores /ig)) {
    parsePlayerScores(channel.serverCommands[index], channel, server)
  }
  return read
}

module.exports = {
  parseCommandString,
  systemInfoChanged,
  configStringsChanged,
}
