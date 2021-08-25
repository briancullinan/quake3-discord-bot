var {
  DEFAULT_GUILD, DEFAULT_CHANNEL, MESSAGE_TIME
} = require('./default-config.js')
var {request} = require('./authorize.js')

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

async function channelMessages(channelId = DEFAULT_CHANNEL) {
  var params = {
    limit: 100,
    after: (BigInt(Date.now() - 1420070400000 - MESSAGE_TIME) << BigInt(22)).toString()
  };
  return await request({
    method: 'GET',
    url: `channels/${channelId}/messages`,
    params
  })
}

module.exports = {
  userChannels,
  guildChannels,
  channelMessages
}