var {createMessage, closeGateway} = require('../discordApi')

async function testMessage()
{
  await createMessage('beep boop')
  closeGateway()
}

module.exports = testMessage
