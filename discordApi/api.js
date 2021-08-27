var {DEFAULT_CHANNEL} = require('./default-config.js')
var {
  authorizeUrl, closeGateway, request
} = require('./authorize.js')

async function triggerTyping(channelId = DEFAULT_CHANNEL) {
  return await request({
    method: 'POST',
    url: `channels/${channelId}/typing`
  })
}

module.exports = {
  authorizeUrl,
  closeGateway,
  triggerTyping,
  ... {
    userChannels, guildChannels, channelMessages
  } = require('./channels.js'),
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
