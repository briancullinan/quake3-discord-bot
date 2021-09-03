var {triggerTyping} = require('../discordApi')
var {DISCORD_COMMANDS} = require('./cmd-definitions.js')

async function connectCommand(command) {
  // TODO: record last address and password given
  var user = command.author.username
  var options = DISCORD_COMMANDS.CONNECT.exec(command.content)
  if(typeof userLogins[user] == 'undefined')
    userLogins[user] = {}
  userLogins[user] = {
    address: options[2] || userLogins[user].address || 'quakeIIIarena.com',
    password: userLogins[user].password || 'password123!'
  }
  // TODO: try to connect to server and respond with a getinfo print out
  await triggerTyping(command.channel_id)
  var match = (/^(.*?):*([0-9]+)*$/ig).exec(userLogins[user].address)
  var info = await getInfo(match[1], parseInt(match[2]) || 27960)
  var json = formatInfoResponse(info)
  return json
}

module.exports = connectCommand
