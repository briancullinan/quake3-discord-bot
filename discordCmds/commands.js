var ip6addr = require('ip6addr')
var importer = require('../Core')
var challengeCommand = importer.import('challenge discord command')
var discordApi = importer.import('discord api')
var {
    getInfo, sendRcon, nextInfoResponse,
    nextPrintResponse
} = importer.import('quake 3 server commands')
var formatQuake3Response = importer.import('format quake 3 response')
var removeCtrlChars = importer.import('remove ctrl characters')

var personality = [
    'Yeehaw!',
    'Balls to wall!',
    'Do it to it!',
    'Got it!',
    'Let\'s play!',
    'Roger that!',
    'I read you!',
    'Buenos Dias!'
]

var lose = [
    'Error. Error.',
    'Oops.',
    'Boo hoo!',
    'Phooey!',
    'Au revoir, mon amis.',
    '#*&^@#!!',
]

var discordCommands = {
    CHALLENGE: /^[!\\\/]?(<@[^:@\s]+>\s*chall?[ae]nge|chall?[ae]nge\s*<@[^:@\s]+>)\s*([^:@\s]*?)\s*([^:@\s]*?)/ig,
    CONNECT: /^[!\\\/]?(rcon)?conn?ect\s*([0-9\.a-z-_]+(:[0-9]+)*)$/ig,
    RCON: /^[!\\\/]?rcon(pass?wo?rd)?\s+([^"\s]+)\s*(.*)$/ig,
    DISCONNECT: /[!\\\/]?disconn?ect/ig,
    CONFIG: /^[!\\\/]?(\w*)(\.cfg|config|configure)/ig,
    LOAD: /^[!\\\/]?(load|map)\s*(\w*)/ig,
    COMMAND: /^[!\\\/]/ig,
    HELLO: /^[!\\\/](\w\s*){0,2}hello(\w\s*){0,2}/ig,
    UNKNOWN: /.*/ig,
}

async function configCommand(command) {
    if(!command.attachments && !command.embed) return
    var user = command.author.username
    var options = discordCommands.CONFIG.exec(command.content)
    var options2 = command.attachments
        .map(a => discordCommands.CONFIG.exec(a.filename))
        .filter(a => a)[0]
    var name = options ? options[1] : options2 ? options2[1] : ''
        .replace(options[2], '')
        .replace(options2[2], '')
        .replace(new RegExp(user, 'ig'), '')
        .replace(/[^0-9-_a-z]/ig, '-')
    if(name.length === 0) {
        await discordApi.createMessage(`Couldn't compute filename.` + '\n```BOT'+command.id+'\nbeep boop\n```\n', command.channel_id)
        return
    }
    var file = 'player-' + user + '-' + name + '.cfg'
    await discordApi.triggerTyping(command.channel_id)
    // TODO: remote post
    //await remoteGet(command.attachments[0].url, file, '/home/freonjs/baseq3-cc/conf/')
    await discordApi.createMessage(`exec conf/player-${user}-${name}` + '\n```BOT'+command.id+'\nbeep boop\n```\n', command.channel_id)
}

var userLogins = {}
// username: {address, password, lastUsed, }
async function connectCommand(command) {
    // TODO: record last address and password given
    var user = command.author.username
    var options = discordCommands.CONNECT.exec(command.content)
    if(typeof userLogins[user] == 'undefined')
        userLogins[user] = {}
    userLogins[user] = {
        address: options[2] || userLogins[user].address || 'quakeIIIarena.com',
        password: userLogins[user].password || 'password123!'
    }
    // TODO: try to connect to server and respond with a getinfo print out
    await discordApi.triggerTyping(command.channel_id)
    var match = (/^(.*?):*([0-9]+)*$/ig).exec(userLogins[user].address)
    await getInfo(match[1], parseInt(match[2]) || 27960)
    var info = await nextInfoResponse()
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
    
    if(command.interaction)
        await discordApi.updateInteraction(json, command.id, command.token)    
    else
        await discordApi.createMessage(json, command.channel_id)    
}

async function rconCommand(command) {
    var user = command.author.username
    var options = discordCommands.RCON.exec(command.content)
    if(typeof userLogins[user] == 'undefined')
        userLogins[user] = {}
    userLogins[user] = {
        address: userLogins[user].address || 'quakeIIIarena.com',
        password: options[2] || userLogins[user].password || 'password123!'
    }
    await discordApi.triggerTyping(command.channel_id)
    var match = (/^(.*?):*([0-9]+)*$/ig).exec(userLogins[user].address)
    await sendRcon(match[1], parseInt(match[2]) || 27960,
             options[3] && options[3].length > 0
                 ? options[3]
                 : 'cmdlist',
             userLogins[user].password)
    var response = await nextPrintResponse()
    response = formatQuake3Response(response.content, command, response)
    if(typeof response == 'string')
        response += '\n```BOT'+command.id+'\nbeep boop\n```\n'
    else if(typeof response == 'object')
        response.content = '\n```BOT'+command.id+'\nbeep boop\n```\n'
    if(command.interaction)
        await discordApi.updateInteraction(response, command.id, command.token)    
    else
        await discordApi.createMessage(response, command.channel_id)    
}

async function chatCommand(command) {
    if(command.interaction)
        await discordApi.updateInteraction(`Hello.` + '\n```BOT'+command.id+'\nbeep boop\n```\n', command.id, command.token)
    else
        await discordApi.createMessage(`Hello.` + '\n```BOT'+command.id+'\nbeep boop\n```\n', command.channel_id)
    return
}

module.exports = {
    discordCommands,
    challengeCommand,
    configCommand,
    connectCommand,
    rconCommand,
    chatCommand,
}
