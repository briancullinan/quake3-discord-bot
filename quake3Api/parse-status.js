var parseConfigStr = require('../quake3Utils/parse-configstr.js')

function statusResponse(m) {
  var status = parseConfigStr(m)
  var players = m.toString('utf-8').trim()
    .split(/\n/ig).slice(1) // first line is config string
    .reduce((obj, c, i, arr) => {
      if(c.trim().length == 0)
        return obj
      var player = {
        'i': (i + 1),
        'name': (/[0-9]+\s+[0-9]+\s+"(.*)"/ig).exec(c)[1],
        'score': (/([0-9]+)\s+/ig).exec(c)[1],
        'ping': (/[0-9]+\s+([0-9]+)\s+/ig).exec(c)[1],
      }
      player.isBot = player.ping == 0
      obj.push(player)
      return obj
    }, [])
  return Object.assign(status, {players})
}

module.exports = statusResponse
