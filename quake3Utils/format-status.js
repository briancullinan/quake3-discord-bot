var removeCtrlChars = require('./remove-ctrl.js')
var {mapSearch} = require('../utilities/map-search.js')

function formatQuake3Response(response, command, server) {
  // try to detect format from response
  var map = (/map:\s(.+)$/igm).exec(response)
  var status = response.match(/name/ig) && response.match(/ping/ig)
  var div = (/^[\-\s]+$/igm).exec(response)
  var players = importer.regexToArray(/^\s*([0-9]+)\s+([0-9]+)\s+([0-9]+)\s+([^\s]+)\s+([^\s]+)\s+.*?$/igm, response, false)
  if(map && status && div) {
    server.mapname = map[1]
    var json = {
      embeds: [{
        title: removeCtrlChars(server.sv_hostname || server.hostname || server.gamename || server.game || ''),
        description: server.ip + ':' + server.port,
        color: 0xdda60f,
        fields: [
          {
            name: 'Map',
            value: server.mapname,
            inline: false
          },
          {
            name: 'Players',
            value: server.clients + '/' + server.sv_maxclients,
            inline: false
          },
          {
            name: 'Player',
            value: '```http\n' + players.map((p, i) => i + ') ' + removeCtrlChars(p[4])).join('\n') + '```',
            inline: true
          },
          {
            name: 'Score',
            value: '```yaml\n' + players.map(p => p[2]).join('\n') + '```',
            inline: true
          },
          {
            name: 'Ping',
            value: '```fix\n' + players.map(p => p[3]).join('\n') + '```',
            inline: true
          }
        ]
      }]
    }
  
    var lvlWorld = mapSearch(server.mapname)[0]
    if(lvlWorld)
    Object.assign(json.embeds[0], {
      image: {
        url: `https://lvlworld.com/levels/${lvlWorld.item.zip}/${lvlWorld.item.zip}320x240.jpg`,
        height: 240,
        width: 320
      }
    })

    return json
  }
  return '\n```\n' + response + '\n```\n'
}

module.exports = formatQuake3Response
