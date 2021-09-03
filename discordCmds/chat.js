var {
  createMessage, triggerTyping, updateInteraction
} = require('../discordApi')

async function chatCommand(command) {
  // TODO: check for Orbb mention?
  //if(!command.private && (!command.mentions || command.mentions.length === 0))
  //  return
  if(command.interaction)
    await updateInteraction(`Hello.` + '\n```BOT'+command.id+'\nbeep boop\n```\n', command.id, command.token)
  else
    await createMessage(`Hello.` + '\n```BOT'+command.id+'\nbeep boop\n```\n', command.channel_id)
  return
}

module.exports = chatCommand
