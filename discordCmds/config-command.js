
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
