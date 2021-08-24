var importer = require('../Core')
var gamedig = require('gamedig')
var serverApi = importer.import('quake 3 server commands')
var { sendRcon, nextAllResponses, udpClient } = importer.import('quake 3 server commands')
var discordApi = importer.import('discord api')
var {authorizeGateway} = importer.import('authorize discord')
var {parseConfigStr} = importer.import('quake 3 server responses')
var removeCtrlChars = importer.import('remove ctrl characters')

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
    var masters = await serverApi.listMasters('master.ioquake3.org', void 0, false)
    //var status = await getStatus(masters[1].ip, masters[1].port)
    var status = await getStatus('45.32.237.139', 27960)
    console.log(status.bots)
}

//typedef enum {
var SV_EVENT = {
	MAPCHANGE: 0,
    CLIENTSAY: 1,
    MATCHEND: 2,
    CALLADMIN: 3,
    CLIENTDIED: 4,
    CLIENTWEAPON: 5,
    CLIENTRESPAWN: 6,
    CLIENTAWARD: 7,
    GETSTATUS: 8,
    SERVERINFO: 9,
    CONNECTED: 10,
    DISCONNECT: 11,
}
//} recentEvent_t;


async function getChats(channelId) {
    var match = (/^(.*?):*([0-9]+)*$/ig).exec()
    await sendRcon('127.0.0.1', 27960, '', 'recentPassword')
    var response = await nextAllResponses()

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

    var discordSocket = await authorizeGateway()
    //console.log(await discordApi.getGuildRoles('752561748611039362'))
    if(call.length) {
        await discordApi.triggerTyping(channelId)        
    }
    for(var i = 0; i < call.length; i++) {
        try {
            //console.log('Say: ' + call[i].value)
            await discordApi.createMessage({
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
            //await discordApi.createMessage(`@admin ${call[i].value}`, channelId)
        } catch (e) {
            console.log(e)
        }
    }
}

module.exports = getChats
