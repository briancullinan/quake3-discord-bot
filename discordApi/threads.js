var {DEFAULT_CHANNEL} = require('../discordApi/default-config.js')
var {request} = require('../discordApi/authorize.js')

async function createThread(name, channelId = DEFAULT_CHANNEL) {
  var json = {
    'name': name,
    'type': 11,
    'auto_archive_duration': 60
  }
  return await request({
    headers: {
      'Content-Type': 'application/json'
    },
    method: 'POST',
    url: `channels/${channelId}/threads`,
    data: JSON.stringify(json)
  })
}

async function archivedThreads(channelId = DEFAULT_CHANNEL) {
  return await request({
    method: 'GET',
    url: `channels/${channelId}/threads/archived/public`
  })
}

async function activeThreads(channelId = DEFAULT_CHANNEL) {
  return await request({
    method: 'GET',
    url: `channels/${channelId}/threads/active`
  })
}

async function addThreadMember(memberId, channelId) {
  return await request({
    method: 'PUT',
    url: `/channels/${channelId}/thread-members/${memberId}`
  })
}

module.exports = {
  createThread,
  archivedThreads,
  activeThreads,
  addThreadMember,
}
