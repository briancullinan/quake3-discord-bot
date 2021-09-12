var remoteCtrlChars = require('../quake3Utils/remove-ctrl.js')
var {mapSearch} = require('../utilities/map-search.js')

function formatInfoResponse(info) {
  var filteredKeys = Object.keys(info)
    .filter(k => k != 'challenge'
      && k != 'hostname'
      && k != 'sv_hostname'
      && k != 'mapname'
      && k != 'clients'
      && k != 'g_humanplayers'
      && k != 'sv_maxclients'
      && k != 'ip'
      && k != 'port')
    .map(k => removeCtrlChars(k))
  var filteredValues = filteredKeys
    .map(k => removeCtrlChars(info[k]))
  var json = {
    embeds: [{
      title: removeCtrlChars(info.sv_hostname || info.hostname || info.gamename || info.game || ''),
      description: info.ip + ':' + info.port,
      color: 0xdda60f,
      fields: [
        {
          name: 'Map',
          value: info.mapname,
          inline: false
        },
        {
          name: 'Players',
          value: info.clients + ' (' + (info.g_humanplayers || '?') + ' humans)' + '/' + info.sv_maxclients,
          inline: false
        },
        {
          name: 'Key',
          value: '```http\n' + filteredKeys.join('\n') + '```',
          inline: true
        },
        {
          name: 'Value',
          value: '```yaml\n' + filteredValues.join('\n') + '```',
          inline: true
        }
      ],
    }]
  }

  var lvlWorld = mapSearch(info.mapname)[0]
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
