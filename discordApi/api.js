var {DEFAULT_CHANNEL} = require('./default-config.js')

async function triggerTyping(channelId = DEFAULT_CHANNEL) {
  return await request({
    method: 'POST',
    url: `channels/${channelId}/typing`
  })
}

module.exports = {
  triggerTyping,
  ... {
    userChannels, guildChannels, channelMessages
  } = require('./channels.js'),
  ... {
    authorizeUrl, closeGateway
  } = require('./authorize.js'),
  ... {
    userGuilds, userConnections, getGuildRoles
  } = require('./guilds.js'),
  ... {
    createMessage, updateMessage,
    getPins, pinMessage, unpinMessage
  } = require('./messages.js'),
  ... {
    registerCommand, getCommands, deleteCommand,
    interactionResponse, updateInteraction
  } = require('./commands.js'),
  ... {
    createThread, archivedThreads, activeThreads
  } = require('./threads.js')
}
