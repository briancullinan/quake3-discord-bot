var {DEFAULT_APPLICATION} = require('../discordApi/default-config.js')
var {request} = require('../discordApi/authorize.js')


async function registerCommand(cmd, desc, guildId = null) {
  // TODO: guild specific commands
  //url = "https://discord.com/api/v8/applications/<my_application_id>/guilds/<guild_id>/commands"
  var json
  if(typeof cmd == 'object') {
    json = cmd
  } else {
    json = {
      'name': cmd,
      'description': desc
    }
  }
  console.log('Registering command ', json.name)
  return await request({
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    url: guildId
      ? `applications/${DEFAULT_APPLICATION}/guilds/${guildId}/commands`
      : `applications/${DEFAULT_APPLICATION}/commands`,
    data: JSON.stringify(json)
  })
}

async function interactionResponse(interactionId, interactionToken) {
  var json = {
    'type': 5
  }
  return await request({
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    url: `interactions/${interactionId}/${interactionToken}/callback`,
    data: JSON.stringify(json)
  })
}

async function getCommands(guildId = null) {
  return await request({
    method: 'GET',
    url: guildId
      ? `applications/${DEFAULT_APPLICATION}/guilds/${guildId}/commands`
      : `applications/${DEFAULT_APPLICATION}/commands`
  })
}

async function getCommand(commandId, guildId = null) {
  return await request({
    method: 'GET',
    url: guildId
      ? `applications/${DEFAULT_APPLICATION}/guilds/${guildId}/commands/${commandId}`
      : `applications/${DEFAULT_APPLICATION}/commands/${commandId}`
  })
}

async function updateInteraction(message, interactionId, interactionToken) {
  var json = typeof message == 'string' ? ({
      'content': message
    }) : message
  return await request({
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'PATCH',
    url: `webhooks/${DEFAULT_APPLICATION}/${interactionToken}/messages/@original`,
    data: JSON.stringify(json)
  })
}

async function updateCommand(cmd, desc, commandId, guildId = null) {
  if(typeof cmd == 'object') {
    json = cmd
  } else {
    json = {
      'name': cmd,
      'description': desc
    }
  }
  console.log('Updating command ', json.name)
  return await request({
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    url: guildId
      ? `applications/${DEFAULT_APPLICATION}/guilds/${guildId}/commands/${commandId}`
      : `applications/${DEFAULT_APPLICATION}/commands/${commandId}`,
    data: JSON.stringify(json)
  })
}

async function deleteCommand(commandId, guildId = null) {
  console.log('Deleting command ', commandId)
  return await request({
    method: 'DELETE',
    url: guildId 
      ? `applications/${DEFAULT_APPLICATION}/guilds/${guildId}/commands/${commandId}`
      : `applications/${DEFAULT_APPLICATION}/commands/${commandId}`
  })
}

module.exports = {
  registerCommand,
  interactionResponse,
  getCommands,
  getCommand,
  updateInteraction,
  deleteCommand,
  updateCommand,
}
