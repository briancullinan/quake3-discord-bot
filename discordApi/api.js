var {DEFAULT_CHANNEL, DEFAULT_USERNAME} = require('./default-config.js')
var {
  authorizeGateway, authorizeUrl, closeGateway, request
} = require('./authorize.js')

async function triggerTyping(channelId = DEFAULT_CHANNEL) {
  return await request({
    method: 'POST',
    url: `channels/${channelId}/typing`
  })
}

module.exports = {
  DEFAULT_USERNAME,
  authorizeGateway,
  authorizeUrl,
  closeGateway,
  triggerTyping,
  ... {
    userChannels, guildChannels, channelMessages, deleteChannel
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
    interactionResponse, updateInteraction, updateCommand
  } = require('./commands.js'),
  ... {
    createThread, archivedThreads, activeThreads,
    addThreadMember,
  } = require('./threads.js'),
  ... {getUser} = require('./users.js'),
}
