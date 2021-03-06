var {
  createMessage, triggerTyping, updateInteraction
} = require('../discordApi')
var {DISCORD_COMMANDS} = require('../discordCmds/cmd-definitions.js')
var challengeCommand = require('../discordCmds/challenge.js')
var connectCommand = require('../discordCmds/connect.js')
var configCommand = require('../discordCmds/config.js')
var rconCommand = require('../discordCmds/rcon.js')
var chatCommand = require('../discordCmds/chat.js')
var searchCommand = require('../discordCmds/search.js')
var readInteractions = require('../discordCmds/interactions.js')

async function replyCommand(response, command) {
  if(typeof response == 'string')
    response += '\n```BOT' + command.id 
      + (command.launching ? 'L' : '') + '\nbeep boop\n```\n'
  else if(typeof response == 'object') {
    if(!response.content)
      response.content = ''
    response.content += '\n```BOT' + command.id 
      + (command.launching ? 'L' : '') + '\nbeep boop\n```\n'
  }
  
  if(command.interaction)
    await updateInteraction(response, command.id, command.token)
  else
    await createMessage(response, command.channel_id)
}

async function respondCommand(commands) {
  var response
  for(var i = 0; i < commands.length; i++) {
    if(commands[i].commands.includes('CHALLENGE'))
      response = await challengeCommand(replyCommand, commands[i])
    else if(commands[i].commands.includes('CONFIG')) 
      response = await configCommand(commands[i])
    else if(commands[i].commands.includes('CONNECT'))
      response = await connectCommand(commands[i])
    else if(commands[i].commands.includes('RCON'))
      response = await rconCommand(commands[i])
    else if(commands[i].commands.includes('HELLO'))
      response = await chatCommand(commands[i])
    else if(commands[i].commands.includes('SEARCH'))
      response = await searchCommand(commands[i])
    else if(commands[i].commands.includes('RELAY'))
      continue // response = await relayCommand(commands[i])
    else if(commands[i].private) {
      console.log('Unknown command', commands[i])
      //await unknownCommand(commands[i])
      continue
    }
    
    if(response)
      await replyCommand(response, commands[i])
  }
}


module.exports = {
  DISCORD_COMMANDS,
  challengeCommand,
  configCommand,
  connectCommand,
  rconCommand,
  chatCommand,
  respondCommand,
  readInteractions,
}
