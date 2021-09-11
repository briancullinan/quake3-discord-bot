var {
  userGuilds, guildChannels, channelMessages,
  DEFAULT_USERNAME,
} = require('../discordApi')
var {DISCORD_COMMANDS} = require('../discordCmds')
var {MESSAGE_TIME} = require('../discordApi/default-config.js')
var messageIds = {}

function interpretCommand(message) {
  return Object.keys(DISCORD_COMMANDS)
    .filter(k => message.content.match(DISCORD_COMMANDS[k])
      || (message.attachments 
        && message.attachments
          .filter(a => a.filename.match(DISCORD_COMMANDS[k])).length > 0)
      || (message.embeds 
        && message.embeds
          .filter(e => (e.title && e.title.match(DISCORD_COMMANDS[k]))
            || (e.description && e.description.match(DISCORD_COMMANDS[k]))).length > 0))
}

async function readAllCommands(channel, private = false, thread = false) {
  // matching format  @megamind  challenge freon dm17 , :thumbsup:   :thumbsdown: .
  var messages  = []
  var responses = []
  var commands  = []
  var launches  = []
  var now       = Date.now()

  Object.keys(messageIds)
    .filter(t => now - t > MESSAGE_TIME * 2)
    .forEach(t => delete messageIds[t])

  var messages = await channelMessages(channel.id)

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
        var l = messages.filter(m => messages[j].content
          .match('```BOT'+m.id))[0]
        if(!l) continue
        l.launching = true
        l.reactions = l.reactions || []
        l.reactions.push.apply(l.reactions, messages[j].reactions)
        if(l) launches.push(l)
      }
    }

    if(messages[j].author.username != DEFAULT_USERNAME
      && thread && applicableCommands.length == 0
      && !Object.values(messageIds).flat().includes(messages[j].id)
    ) {
      messages[j].thread = true
      messages[j].commands = ['RELAY']
      messages[j].thread = thread
      commands.push(messages[j])
    }
  }

  // save the ids in memory for extra safety
  messageIds[now] = messages.map(m => m.id)

  // exclude commands that already got a response
  return commands
    .filter(c => responses.filter(r => r.content.match(new RegExp('```BOT'+c.id))).length === 0)
    .concat(launches)
    .filter(c => responses.filter(r => r.content.match(new RegExp('```BOT'+c.id+'L'))).length === 0)
    .filter((c, i, arr) => arr.indexOf(c) === i)
}

module.exports = readAllCommands
