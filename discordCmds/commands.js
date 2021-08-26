var challengeCommand = require('./challenge.js')

async function respondCommand(specificChannel) {
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
