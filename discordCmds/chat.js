
async function chatCommand(command) {
  if(command.interaction)
    await discordApi.updateInteraction(`Hello.` + '\n```BOT'+command.id+'\nbeep boop\n```\n', command.id, command.token)
  else
    await discordApi.createMessage(`Hello.` + '\n```BOT'+command.id+'\nbeep boop\n```\n', command.channel_id)
  return
}
