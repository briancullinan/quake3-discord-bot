var {DEFAULT_GUILD} = require('../discordApi/default-config.js')
var {request} = require('../discordApi/authorize.js')


async function userGuilds(userId = '@me') {
  return await request({
    method: 'GET',
    url: `users/${userId}/guilds`
  })
}

async function getGuildRoles(guildId = DEFAULT_GUILD) {
  return await request({
    method: 'GET',
    url: `guilds/${guildId}/roles`
  })
}

async function userConnections(userId = '@me') {
  return await request({
    method: 'GET',
    url: `users/${userId}/connections`
  })
}

module.exports = {
  userGuilds,
  getGuildRoles,
  userConnections
}
