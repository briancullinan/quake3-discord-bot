var discordApi = require('../discordApi')

async function testMessage()
{
  await discordApi.createMessage('beep boop')
  discordApi.closeGateway()
}

module.exports = testMessage
