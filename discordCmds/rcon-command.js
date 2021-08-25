
var userLogins = {}
// username: {address, password, lastUsed, }


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
