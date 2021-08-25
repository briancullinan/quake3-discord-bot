var ip6addr = require('ip6addr')
var challengeCommand = importer.import('challenge discord command')
var discordApi = importer.import('discord api')
var {
  getInfo, sendRcon, nextInfoResponse,
  nextPrintResponse
} = importer.import('quake 3 server commands')
var formatQuake3Response = importer.import('format quake 3 response')
var removeCtrlChars = importer.import('remove ctrl characters')


async function respondCommand(specificChannel) {
  await authorizeGateway()
  var commands = await readAllCommands(specificChannel)
  for(var i = 0; i < commands.length; i++) {
    if(commands[i].commands.includes('CHALLENGE'))
      await challengeCommand(commands[i])
    else if(commands[i].commands.includes('CONFIG')) 
      await configCommand(commands[i])
    else if(commands[i].commands.includes('CONNECT'))
      await connectCommand(commands[i])
    else if(commands[i].commands.includes('RCON'))
      await rconCommand(commands[i])
    else if(commands[i].commands.includes('HELLO'))
      await chatCommand(commands[i])
    else if(commands[i].private) {
      console.log('Unknown command', commands[i])
      //await unknownCommand(commands[i])
    }
  }
}


module.exports = {
  discordCommands,
  challengeCommand,
  configCommand,
  connectCommand,
  rconCommand,
  chatCommand,
}
