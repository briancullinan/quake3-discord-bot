var {
  DEFAULT_GUILD, DEFAULT_CHANNEL, MESSAGE_TIME,
  MESSAGES_START, 
} = require('../discordApi/default-config.js')
var {request} = require('../discordApi/authorize.js')

async function userChannels(userId = '@me') {
  return await request({
    method: 'GET',
    url: `channels/${userId}`
  })
}

async function guildChannels(guildId = DEFAULT_GUILD) {
  return await request({
    method: 'GET',
    url: `guilds/${guildId}/channels`
  })
}

async function channelMessagesB(channelId = DEFAULT_CHANNEL, messageTime = MESSAGE_TIME) {
  var params = {
    limit: 100,
    after: messageTime.toString()
  };
  var messages = await request({
    method: 'GET',
    url: `channels/${channelId}/messages`,
    params
  })
  if(messages.length == 100) {
    messages = messages.concat(await channelMessagesB(channelId, BigInt(messages[0].id) + BigInt(1)))
  }
  return messages
}

async function channelMessages(channelId = DEFAULT_CHANNEL, messageTime = MESSAGE_TIME) {
  var params = {
    limit: 100,
    after: (BigInt(Date.now() - MESSAGES_START - messageTime) << BigInt(22)).toString()
  };
  var messages = await request({
    method: 'GET',
    url: `channels/${channelId}/messages`,
    params
  })
  if(messages.length == 100) {
    messages = messages.concat(await channelMessagesB(channelId, BigInt(messages[0].id) + BigInt(1)))
  }
  return messages
}

async function deleteChannel(channelId) {
  return await request({
    method: 'DELETE',
    url: `channels/${channelId}`
  })
}

module.exports = {
  userChannels,
  guildChannels,
  channelMessages,
  deleteChannel
}
