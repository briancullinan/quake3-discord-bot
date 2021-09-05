var path = require('path')
var fs = require('fs')
var hashString = require('../utilities/simple-hash.js')
var MATCH_DIR = process.env.LVLWORLD || path.join(process.env.HOME || process.env.HOMEPATH 
  || process.env.USERPROFILE || os.tmpdir(), '/quake3-discord-bot/quake3Matches')
var lastMatchLoad = 0
var MATCH_INTERVAL = 60 * 1000
var matches = []

function loadMatches() {
  var now = (new Date()).getTime()
  if(now - lastMatchLoad > MATCH_INTERVAL
  {
    lastMatchLoad = now
    matches = fs.readDirSync(MATCH_DIR)
  }
}

function checkMatchTimestamp(mapname, hash, serverId) {
  loadMatches()
  var now = (new Date()).getTime()
  // try to find a match within 60 seconds matching one of hash and serverId
  var times = matches
    .filter(m => {
      var segs = m.split(/[\-\.]/ig)
      if(now - parseInt(segs[0]) < MATCH_INTERVAL) {
        if(hash == segs[segs.length-2] && serverId == hash[segs.length-1]) {
          var match = require(path.join(MATCH_DIR, m))
          if(match.mapname == mapname) {
            return true
          }
        }
      }
      return false
    })
  return times[0]
}

function saveMatch(server) {
  var title = removeCtrlChars(server.sv_hostname || server.hostname || server.gamename || server.game || '')
  var hash = hashString(server.ip + ':' + server.port + '-' + title)
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
  var file = (new Date()).getTime() + '-' + server.ip + ':' + server.port 
     + '-' + title + '-' + hash + '-' + server.channel.serverId
  var existingMatch = heckMatchTimestamp(server.mapname, hash, server.channel.serverId)
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
      serverId: server.channel.serverId
    }
  }, null, 2)
  if(existingMatch) {
    // update existing match file
    fs.writeFileSync(path.join(MATCH_DIR, existingMatch), obj)
  } else {
    fs.writeFileSync(path.join(MATCH_DIR, file), obj)
  }
}

module.exports = saveMatch
