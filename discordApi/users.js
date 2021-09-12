var {request} = require('../discordApi/authorize.js')

async function getUser(userId = '@me') {
  return await request({
    method: 'GET',
    url: `/users/${userId}`
  })
}

module.exports = {
  getUser,
}
