var {DEFAULT_CHANNEL, DEFAULT_USERNAME} = require('../discordApi/default-config.js')
var {
  authorizeGateway, authorizeUrl, closeGateway, request
} = require('../discordApi/authorize.js')

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
  } = require('../discordApi/channels.js'),
  ... {
    userGuilds, userConnections, getGuildRoles
  } = require('../discordApi/guilds.js'),
  ... {
    createMessage, updateMessage,
    getPins, pinMessage, unpinMessage
  } = require('../discordApi/messages.js'),
  ... {
    registerCommand, getCommands, deleteCommand,
    interactionResponse, updateInteraction, updateCommand
  } = require('../discordApi/commands.js'),
  ... {
    createThread, archivedThreads, activeThreads,
    addThreadMember,
  } = require('../discordApi/threads.js'),
  ... {
    getUser
  } = require('../discordApi/users.js'),
}
