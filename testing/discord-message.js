var discordApi = importer.import('discord api')
var {authorizeGateway} = importer.import('authorize discord')

async function testMessage()
{
    var discordSocket = await authorizeGateway()
    await discordApi.createMessage('beep boop', '752568660819837019')
    discordSocket.close()
}

module.exports = testMessage
