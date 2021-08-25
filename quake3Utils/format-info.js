var remoteCtrlChars = require('./remove-ctrl.js')

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
    content: '\n```BOT'+command.id+'\nbeep boop\n```\n',
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
      ]
    }]
}  
  return json
}
