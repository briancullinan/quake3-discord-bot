var {DEFAULT_CHANNEL} = require('./default-config.js')
var {request} = require('./authorize.js')


async function createMessage(message, channelId = DEFAULT_CHANNEL) {
  var params = typeof message == 'string' ? ({
    'content': message
  }) : message
  return await request({
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    url: `channels/${channelId}/messages`,
    data: JSON.stringify(params)
  })
}

async function updateMessage(message, messageId, channelId = DEFAULT_CHANNEL) {
  var params = typeof message == 'string' ? ({
    'content': message
  }) : message
  return await request({
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'PATCH',
    url: `channels/${channelId}/messages/${messageId}`,
    data: JSON.stringify(params)
  })
}

async function getPins(channelId = DEFAULT_CHANNEL) {
  return await request({
    method: 'GET',
    url: `channels/${channelId}/pins`
  })
}

async function pinMessage(messageId, channelId = DEFAULT_CHANNEL) {
  return await request({
    method: 'PUT',
    url: `channels/${channelId}/pins/${messageId}`
  })
}

async function unpinMessage(messageId, channelId = DEFAULT_CHANNEL) {
  return await request({
    method: 'DELETE',
    url: `channels/${channelId}/pins/${messageId}`
  })
}
