var {
  createMessage, triggerTyping, updateInteraction
} = require('../discordApi')
var gamedig = require('gamedig')
var {
  sendRcon, nextResponse,
  getServers, SV_EVENT
} = require('../quake3Api')
var parseConfigStr = require('../quake3Utils/parse-configstr.js')
var removeCtrlChars = require('../quake3Utils/remove-ctrl.js')

async function getStatus(ip, port) {
  return gamedig.query({
    type: 'quake3',
    host: ip,
    port: port
  }).then((state) => {
    return state
  }).catch((error) => {
    console.log('Server is offline', error)
  })
}

async function captureAllStats() {
  var masters = await getServers('master.ioquake3.org', void 0, false)
  //var status = await getStatus(masters[1].ip, masters[1].port)
  var status = await getStatus('45.32.237.139', 27960)
  console.log(status.bots)
}


async function getChats(channelId) {
  var match = (/^(.*?):*([0-9]+)*$/ig).exec()
  await sendRcon('127.0.0.1', 27960, '', 'recentPassword')
  var response = await nextResponse()

  if(!response) return

  var maxTime = 0
  var parsed = response.map(function (r) {
    return JSON.parse(r.content)
  })
  var chats = parsed.filter(function (r) {
    if(r.timestamp > maxTime)
      maxTime = r.timestamp
    return r.type == SV_EVENT.CLIENTSAY
  })
  
  var call = parsed.filter(function (r) {
    return r.type == SV_EVENT.CALLADMIN
  })
  
  var status = parsed.filter(function (r) {
    return r.type == SV_EVENT.GETSTATUS
  })
  var server = {}
  if(status.length) {
    Object.assign(server, parseConfigStr(status[0].value))
  }

  var info = parsed.filter(function (r) {
    return r.type == SV_EVENT.SERVERINFO
  })
  if(info.length) {
    Object.assign(server, parseConfigStr(info[0].value))
  }
  
  var match = parsed.filter(function (r) {
    return r.type == SV_EVENT.MATCHEND
  })
  if(match.length) {
    // TODO: save to SQL database
    console.log(match[match.length-1])
  }

  //console.log(await getGuildRoles('752561748611039362'))
  if(call.length) {
    await triggerTyping(channelId)        
  }
  for(var i = 0; i < call.length; i++) {
    try {
      //console.log('Say: ' + call[i].value)
      await createMessage({
        embed: {
          title: removeCtrlChars(server.hostname || server.sv_hostname || server.gamename),
          description: server.ip + ':' + server.port,
          color: 0xdda60f,
          fields: [
            {
                name: call[i].value,
                value: `<@&752605581029802155> [Connect](https://quake.games/?connect%20${'127.0.0.1:27960'})`,
                inline: false
            },
          ]
        },
        allowed_mentions: {
          parse: ['users', 'roles'],
          users: [],
          roles: []
        }
      }, channelId)
      //await createMessage(`@admin ${call[i].value}`, channelId)
    } catch (e) {
      console.log(e)
    }
  }
}

module.exports = getChats
