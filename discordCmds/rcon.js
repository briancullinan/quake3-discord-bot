var {DISCORD_COMMANDS} = require('./cmd-definitions.js')
var {triggerTyping} = require('../discordApi')
var {sendRcon} = require('../quake3Api')
var formatQuake3Response = require('../quake3Utils/format-status.js')
var userLogins = {}
// username: {address, password, lastUsed, }

async function rconCommand(command) {
  var user = command.author.username
  var options = DISCORD_COMMANDS.RCON.exec(command.content)
  if(typeof userLogins[user] == 'undefined')
    userLogins[user] = {}
  userLogins[user] = {
    address: userLogins[user].address || 'quakeIIIarena.com',
    password: options[2] || userLogins[user].password || 'password123!'
  }
  await triggerTyping(command.channel_id)
  var match = (/^(.*?):*([0-9]+)*$/ig).exec(userLogins[user].address)

  var response = await sendRcon(match[1], parseInt(match[2]) || 27960,
    options[3] && options[3].length > 0
      ? options[3]
      : 'cmdlist',
    userLogins[user].password)
  response = formatQuake3Response(response.content, command, response)
  return response
}

module.exports = rconCommand
