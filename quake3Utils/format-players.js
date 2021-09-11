var removeCtrlChars = require('./remove-ctrl.js')
var {mapSearch} = require('../utilities/map-search.js')

function formatPlayerList(server) {
    var redTeam = (server.Players_Red || '').trim()
        .split(/\s+/ig).filter(n => n)
        .map(i => parseInt(i))
    var blueTeam = (server.Players_Blue || '').trim()
        .split(/\s+/ig).filter(n => n)
        .map(i => parseInt(i))
    var players = server.players
      .filter(p => p.name)
    players.forEach(p => {
        if(redTeam.includes(p.i))
            p.team = 'red'
        else if (blueTeam.includes(p.i))
            p.team = 'blue'
        else
            p.team = 'other'
    })
    players.sort((a, b) => {
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
                        value: players.length + '/' + server.sv_maxclients,
                        inline: false
                    },
                    {
                        name: 'Player',
                        value: ':red_circle: Red Team\n```http\n' 
                            + players.filter(p => p.team == 'red').map((p, i) => (p.i) + ') ' 
                            + removeCtrlChars(p.name)).join('\n') + '\u0020\n```\n'
                            + ':blue_circle: Blue Team\n```http\n' 
                            + players.filter(p => p.team == 'blue').map((p, i) => (p.i) + ') ' 
                            + removeCtrlChars(p.name)).join('\n') + '\u0020\n```\n'
                            + 'Other\n```http\n' 
                            + players.filter(p => p.team == 'other').map((p, i) => (p.i) + ') ' 
                            + removeCtrlChars(p.name)).join('\n') + '\u0020\n```\n',
                        inline: true
                    },
                    {
                        name: 'Score',
                        value: '\u0020\n-\n```yaml\n' + players.filter(p => p.team == 'red').map(p => p.score).join('\n') + '\u0020\n```'
                            + '\u0020\n-\n```yaml\n' + players.filter(p => p.team == 'blue').map(p => p.score).join('\n') + '\u0020\n```'
                            + '\u0020\n-\n```yaml\n' + players.filter(p => p.team == 'other').map(p => p.score).join('\n') + '\u0020\n```',
                        inline: true
                    },
                    {
                        name: 'Ping',
                        value: '\u0020\n-\n```fix\n' + players.filter(p => p.team == 'red').map(p => p.ping).join('\n') + '\u0020\n```'
                            + '\u0020\n-\n```fix\n' + players.filter(p => p.team == 'blue').map(p => p.ping).join('\n') + '\u0020\n```'
                            + '\u0020\n-\n```fix\n' + players.filter(p => p.team == 'other').map(p => p.ping).join('\n') + '\u0020\n```',
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
                        value: players.length + '/' + server.sv_maxclients,
                        inline: false
                    },
                    {
                        name: 'Player',
                        value: '```http\n' + players.map((p, i) => (p.i) + ') ' 
                            + removeCtrlChars(p.name)).join('\n') + '\u0020\n```',
                        inline: true
                    },
                    {
                        name: 'Score',
                        value: '```yaml\n' + players.map(p => p.score).join('\n') + '\u0020\n```',
                        inline: true
                    },
                    {
                        name: 'Ping',
                        value: '```fix\n' + players.map(p => p.ping).join('\n') + '\u0020\n```',
                        inline: true
                    }
                ]
            }]
        }
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

module.exports = formatPlayerList
