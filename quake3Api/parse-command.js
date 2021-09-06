var {readBits} = require('../quake3Utils/huffman.js')
var {ReadString} = require('../quake3Utils/maths.js')
var parseConfigStr = require('../quake3Utils/parse-configstr.js')
var {
  MAX_RELIABLE_COMMANDS, CS_PLAYERS, MAX_CLIENTS
} = require('./config-strings.js')

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

function parsePlayerScores(command, channel, server) {
  var segs = command.split(' ').slice(1)
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
    parsePlayerScores(channel.serverCommands[index], channel, server)
  }
  return read
}

module.exports = {
  parseCommandString,
  systemInfoChanged,
  configStringsChanged,
}
