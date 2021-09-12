var {sendReliable} = require('../quake3Api')
var {updateThread} = require('../discordPoll/update-channel.js')
var removeCtrlChars = require('../quake3Utils/remove-ctrl.js')
var readAllCommands = require('../discordPoll/poll-channels.js')


async function relayChat(threadName, discordChannel, server) {
  var discordThread = await updateThread(threadName, discordChannel)
  var commands = (await readAllCommands(discordThread, false, true))
    .filter(c => c.commands.includes('RELAY') && c.content)
  for(var i = 0; i < commands.length; i++) {
    Promise.resolve(sendReliable(server.ip, server.port, 
      'say ' + commands[i].author.username + ': ' + commands[i].content))
  }
}

module.exports = relayChat
