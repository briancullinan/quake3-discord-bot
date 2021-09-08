var path = require('path')
var fs = require('fs')
var removeCtrlChars = require('./remove-ctrl.js')
var hashString = require('../utilities/simple-hash.js')
var MATCH_DIR = process.env.LVLWORLD || path.join(process.env.HOME || process.env.HOMEPATH 
  || process.env.USERPROFILE || os.tmpdir(), '/quake3-discord-bot/quake3Matches')
var lastMatchLoad = 0
var MATCH_INTERVAL = 9 * 1000
var matches = []

function loadMatches() {
  var now = (new Date()).getTime()
  if(now - lastMatchLoad > MATCH_INTERVAL) {
    lastMatchLoad = now
    matches = fs.readdirSync(MATCH_DIR)
  }
}

function checkMatchTimestamp(mapname, hash, serverId) {
  loadMatches()
  var now = (new Date()).getTime()
  // try to find a match within 60 seconds matching one of hash and serverId
  var times = matches.filter(m => {
    if(m[0] == '.') return false
    var segs = m.split(/[\-\.]|\.json/ig)
    //console.log(hash, '!=', segs[segs.length-3], serverId, '!=', segs[segs.length-2])
    if(hash == segs[segs.length-3] && serverId == segs[segs.length-2]) {
      var match = require(path.join(MATCH_DIR, m))
      //console.log(match)
      if(match.mapname == mapname
        && (now - parseInt(segs[0]) < MATCH_INTERVAL
          || match.channel.serverInfo.timelimit == 0
          || now - parseInt(segs[0]) < (match.channel.serverInfo.timelimit * 60 + 1) * 1000)) {
        return true
      }
    }
    return false
  })
  return times[0]
}

function saveMatch(server) {
  var title = removeCtrlChars(server.sv_hostname || server.hostname || server.gamename || server.game || '')
  var hash = hashString(server.ip + ':' + server.port)
  if(hash < 0) {
    hash = -hash
  }
  // the goal of the filename is to allow administrators to easily parse
  //   server basics with their eyes or with a script
  // * the serverId changes every match so it will likely be unique
  // * the hash might stay the same between matches so they can be pieced back 
  //   together
  // * the unix timestamp at the front is probably unique and used to prevent 
  //   matches being saved too often, so it's important in case map changes 
  //   before timelimit is hit, due to voting or score limit
  // * the title for a server could change, the IP could change and keep the 
  //   same title, so including them might allow admins to piece ranks back 
  //   together
  // timestamp-0.0.0.0-27960-server name-00000000-serverId
  var file = (new Date()).getTime() + '-' + server.ip
    + '-' + server.port + '-' + title.replace(/[^a-z0-9]/ig, '') + '-' + hash
    + '-' + server.channel.serverId
  var existingMatch = checkMatchTimestamp(server.mapname, hash, server.channel.serverId)
  // TODO: add fields?
  var obj = JSON.stringify({
    sv_hostname: server.sv_hostname,
    hostname: server.hostname,
    gamename: server.gamename,
    game: server.game,
    ip: server.ip,
    port: server.port,
    players: server.players,
    mapname: server.mapname,
    channel: {
      serverId: server.channel.serverId,
      serverInfo: {
        timelimit: server.channel.serverInfo.timelimit,
        fraglimit: server.channel.serverInfo.fraglimit,
        capturelimit: server.channel.serverInfo.capturelimit,
        gamename: server.channel.serverInfo.gamename,
      }
    }
  }, null, 2)
  if(existingMatch) {
    // update existing match file
    fs.writeFileSync(path.join(MATCH_DIR, existingMatch), obj)
  } else {
    fs.writeFileSync(path.join(MATCH_DIR, file + '.json'), obj)
  }
  lastMatchLoad = 0
}

module.exports = saveMatch
