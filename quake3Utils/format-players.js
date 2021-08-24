var impoter = require('../Core')
var removeCtrlChars = importer.import('remove ctrl characters')

function formatPlayerList(server) {
    var threadName = 'Pickup for ' + removeCtrlChars(server.sv_hostname || server.hostname).replace(/[^0-9a-z-]/ig, '-')
    var redTeam = (server.Players_Red || '').trim()
        .split(/\s+/ig).filter(n => n)
        .map(i => parseInt(i))
    var blueTeam = (server.Players_Blue || '').trim()
        .split(/\s+/ig).filter(n => n)
        .map(i => parseInt(i))
    server.players.forEach(p => {
        if(redTeam.includes(p.i))
            p.team = 'red'
        else if (blueTeam.includes(p.i))
            p.team = 'blue'
        else
            p.team = 'other'
    })
    server.players.sort((a, b) => {
        return a.team - b.team
    })
    var json
    if(redTeam.length > 0 || blueTeam.length > 0) {
        json = {
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
                        value: server.players.length + '/' + server.sv_maxclients,
                        inline: false
                    },
                    {
                        name: 'Player',
                        value: ':red_circle: Red Team\n```http\n' 
                            + server.players.filter(p => p.team == 'red').map((p, i) => (p.i) + ') ' 
                            + removeCtrlChars(p.name)).join('\n') + '\u0020\n```\n'
                            + ':blue_circle: Blue Team\n```http\n' 
                            + server.players.filter(p => p.team == 'blue').map((p, i) => (p.i) + ') ' 
                            + removeCtrlChars(p.name)).join('\n') + '\u0020\n```\n'
                            + 'Other\n```http\n' 
                            + server.players.filter(p => p.team == 'other').map((p, i) => (p.i) + ') ' 
                            + removeCtrlChars(p.name)).join('\n') + '\u0020\n```\n',
                        inline: true
                    },
                    {
                        name: 'Score',
                        value: '\u0020\n-\n```yaml\n' + server.players.filter(p => p.team == 'red').map(p => p.score).join('\n') + '\u0020\n```'
                            + '\u0020\n-\n```yaml\n' + server.players.filter(p => p.team == 'blue').map(p => p.score).join('\n') + '\u0020\n```'
                            + '\u0020\n-\n```yaml\n' + server.players.filter(p => p.team == 'other').map(p => p.score).join('\n') + '\u0020\n```',
                        inline: true
                    },
                    {
                        name: 'Ping',
                        value: '\u0020\n-\n```fix\n' + server.players.filter(p => p.team == 'red').map(p => p.ping).join('\n') + '\u0020\n```'
                            + '\u0020\n-\n```fix\n' + server.players.filter(p => p.team == 'blue').map(p => p.ping).join('\n') + '\u0020\n```'
                            + '\u0020\n-\n```fix\n' + server.players.filter(p => p.team == 'other').map(p => p.ping).join('\n') + '\u0020\n```',
                        inline: true
                    }
                ]
            }]
        }        
    } else {
        json = {
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
                        value: server.players.length + '/' + server.sv_maxclients,
                        inline: false
                    },
                    {
                        name: 'Player',
                        value: '```http\n' + server.players.map((p, i) => (p.i) + ') ' 
                            + removeCtrlChars(p.name)).join('\n') + '\u0020\n```',
                        inline: true
                    },
                    {
                        name: 'Score',
                        value: '```yaml\n' + server.players.map(p => p.score).join('\n') + '\u0020\n```',
                        inline: true
                    },
                    {
                        name: 'Ping',
                        value: '```fix\n' + server.players.map(p => p.ping).join('\n') + '\u0020\n```',
                        inline: true
                    }
                ]
            }]
        }
    }

    return json
}

module.exports = formatPlayerList
