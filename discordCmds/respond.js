var importer = require('../Core')
var discordApi = importer.import('discord api')
var {authorizeGateway, privateChannels, interactions} = importer.import('authorize discord')
var {
    discordCommands,
    challengeCommand,
    configCommand,
    connectCommand,
    rconCommand,
    chatCommand,
} = importer.import('discord commands')

var DEFAULT_USERNAME = 'Orbb'

function interpretCommand(message) {
    return Object.keys(discordCommands)
       .filter(k => message.content.match(discordCommands[k])
              || (message.attachments && message.attachments.filter(a => a.filename.match(discordCommands[k])).length > 0)
              || (message.embeds && message.embeds.filter(e => (e.title && e.title.match(discordCommands[k]))
                                                          || (e.description && e.description.match(discordCommands[k]))).length > 0))
}

async function readAllCommands(specificChannel) {
    // matching format  @megamind  challenge freon dm17 , :thumbsup:   :thumbsdown: .
    var private = false
    var messages = []
    var responses = []
    var channels = []
    var commands = []
    var launches = []
    
    if(specificChannel == '@me') {
        // only read channel if it was updated within the last hour
        var userChannels = Object
            .keys(privateChannels)
            .filter(k => privateChannels[k] > Date.now() - 1000 * 60 * 60)
            .map(k => ({id: k}))
        channels.push.apply(channels, userChannels)
        specificChannel = ''
        private = true
    } else {
        var guilds = await discordApi.userGuilds()
        console.log(`Reading ${guilds.length} guilds`)
        for(var i = 0; i < guilds.length; i++) {
            channels.push.apply(channels, await discordApi.guildChannels(guilds[i].id))
        }
    }
    
    console.log(`Reading ${channels.length} channels`)
    for(var i = 0; i < channels.length; i++) {
        if(!specificChannel
           || channels[i].id == specificChannel
           || (typeof specificChannel == 'string'
              && (specificChannel.length === 0
                 || (channels[i].name
                     && channels[i].name.match(new RegExp(specificChannel, 'ig'))
                    )
                 )
              )
          ) {
            console.log(`Reading ${channels[i].name}`)
            messages.push.apply(messages, await discordApi.channelMessages(channels[i].id))
        }
    }
    
    // find commands in channel history
    console.log(`Reading ${messages.length} messages`)
    for(var j = 0; j < messages.length; j++) {
        var applicableCommands = interpretCommand(messages[j])
        if(applicableCommands.length > 0
          && messages[j].author.username != DEFAULT_USERNAME) {
            messages[j].commands = applicableCommands
            messages[j].private = private
            commands.push(messages[j])
            if((messages[j].reactions || [])
                .filter(a => a.emoji.name == '\u{1F44D}').length > 0) {
                launches.push(messages[j])
            }
        }
        if(messages[j].content.match(/```BOT/ig)) {
            responses.push(messages[j])
            if((messages[j].reactions || [])
                .filter(a => a.emoji.name == '\u{1F44D}').length > 0) {
                var l = messages.filter(m => messages[j].content.match('```BOT'+m.id))[0]
                if(!l) continue
                l.launching = true
                l.reactions = l.reactions || []
                l.reactions.push.apply(l.reactions, messages[j].reactions)
                if(l) launches.push(l)
            }
        }
    }
        
    // find all commands in interactions
    var interactionsCount = Object.keys(interactions)
        .reduce((sum, i) => {return sum + interactions[i].length}, 0)
    console.log(`Reading ${Object.keys(interactions).length} channels with ${interactionsCount} interactions`)
    Object.keys(interactions).forEach(i => {
        for(var c in interactions[i]) {
            interactions[i][c].commands = [interactions[i][c].data.name.toUpperCase()]
            interactions[i][c].author = interactions[i][c].member.user
            interactions[i][c].content = interactions[i][c].data.name + ' '
                + (interactions[i][c].data.options || []).map(o => o.value).join(' ')
            interactions[i][c].interaction = true
            commands.push(interactions[i][c])
        }
        interactions[i] = []
    })


    // exclude commands that already got a response
    return commands
        .filter(c => responses.filter(r => r.content.match(new RegExp('```BOT'+c.id))).length === 0)
        .concat(launches)
        .filter(c => responses.filter(r => r.content.match(new RegExp('```BOT'+c.id+'L'))).length === 0)
        .filter((c, i, arr) => arr.indexOf(c) === i)
}

async function respondCommand(specificChannel) {
    await authorizeGateway()
    var commands = await readAllCommands(specificChannel)
    for(var i = 0; i < commands.length; i++) {
        if(commands[i].commands.includes('CHALLENGE'))
            await challengeCommand(commands[i])
        else if(commands[i].commands.includes('CONFIG')) 
            await configCommand(commands[i])
        else if(commands[i].commands.includes('CONNECT'))
            await connectCommand(commands[i])
        else if(commands[i].commands.includes('RCON'))
            await rconCommand(commands[i])
        else if(commands[i].commands.includes('HELLO'))
            await chatCommand(commands[i])
        else if(commands[i].private) {
            console.log('Unknown command', commands[i])
            //await unknownCommand(commands[i])
        }
    }
}

module.exports = respondCommand
