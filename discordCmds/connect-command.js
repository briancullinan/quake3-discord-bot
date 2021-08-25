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
  var json = formatInfoResponse(info)
  
  if(command.interaction)
    await discordApi.updateInteraction(json, command.id, command.token)    
  else
    await discordApi.createMessage(json, command.channel_id)    
}
