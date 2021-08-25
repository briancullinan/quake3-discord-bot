var {DEFAULT_APPLICATION} = require('./default-config.js')
var {request} = require('./authorize.js')


async function registerCommand(cmd, desc, guildId = null) {
  // TODO: guild specific commands
  //url = "https://discord.com/api/v8/applications/<my_application_id>/guilds/<guild_id>/commands"
  var json
  if(typeof cmd == 'object') {
    json = cmd
  } else {
    json = {
      'name': cmd,
      'description': desc,
      'options': []
    }
  }
  return await request({
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    url: `applications/${DEFAULT_APPLICATION}/commands`,
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
    url: `applications/${DEFAULT_APPLICATION}/commands`
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


async function deleteCommand(commandId) {
  return await request({
    method: 'DELETE',
    url: `applications/${DEFAULT_APPLICATION}/commands/${commandId}`
  })
}
