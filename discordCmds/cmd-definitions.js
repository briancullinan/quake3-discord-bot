var {
  registerCommand, getCommands, deleteCommand
} = require('../discordApi')

// used by legacy poller and discord commands reconstructed into this format
var DISCORD_COMMANDS = {
  CHALLENGE: /^[!\\\/]?(<@[^:@\s]+>\s*chall?[ae]nge|chall?[ae]nge\s*<@[^:@\s]+>)\s*([^:@\s]*?)\s*([^:@\s]*?)/ig,
  CONNECT: /^[!\\\/]?(rcon)?conn?ect\s*([0-9\.a-z-_]+(:[0-9]+)*)$/ig,
  RCON: /^[!\\\/]?rcon(pass?wo?rd)?\s+([^"\s]+)\s*(.*)$/ig,
  DISCONNECT: /[!\\\/]?disconn?ect/ig,
  CONFIG: /^[!\\\/]?(\w*)(\.cfg|config|configure)/ig,
  LOAD: /^[!\\\/]?(load|map)\s*(\w*)/ig,
  COMMAND: /^[!\\\/]/ig,
  HELLO: /^[!\\\/](\w\s*){0,2}hello(\w\s*){0,2}/ig,
  UNKNOWN: /.*/ig,
}

// bot commands using new API, same names as above but lower-case
async function syncCommands() {
  var commandResult = (await getCommands())
  var commands = commandResult.map(command => command.name)
  if(commands.includes('hello-orbb'))
  await deleteCommand(commandResult.filter(c => c.name == 'hello-orbb')[0].id)
  if(!commands.includes('hello'))
  await registerCommand('hello', 'Check if Orbb is awake.')
  if(!commands.includes('challenge'))
  await registerCommand({
    'name': 'challenge',
    'description': 'Challenges another user to match, Orbb waits for the thumbs up.',
    'options': [
      {
        'name': 'opponent-id',
        'description': 'Name of the player you want to challenge for 1v1.',
        'required': true,
        'type': 6
      },
      {
        'name': 'map',
        'description': 'Name of the map to start on the server.',
        'required': true,
        'type': 3
      }
    ]
  })
  if(!commands.includes('connect'))
  await registerCommand({
    'name': 'connect',
    'description': 'RCon Connect to a Quake 3 server for remote administration over Discord.',
    'options': [
      {
        'name': 'server-address',
        'description': 'The IP address or domain name of the server to connect to including port.',
        'required': true,
        'type': 3
      }
    ]
  })
  if(!commands.includes('rcon'))
  await registerCommand({
    'name': 'rcon',
    'description': 'Set the password for future RCon commands, or send an rcon command to the connected server.',
    'options': [
      {
        'name': 'rcon-password',
        'description': 'Password to use with future RCon commands.',
        'required': true,
        'type': 3
      },
      {
        'name': 'rcon-command',
        'description': 'Send the following RCon command to the server.',
        'required': false,
        'type': 3
      }
    ]
  })
  if(!commands.includes('config'))
  await registerCommand({
    'name': 'config',
    'description': 'Execute a config file on the remote Quake 3 server after using /connect command.',
    'options': [
      {
        'name': 'config-name',
        'description': 'Name of the config script to execute',
        'required': true,
        'type': 3
      }
      // TODO: not required and list available config scripts through engine
    ]
  })
  if(!commands.includes('map'))
  await registerCommand({
    'name': 'map',
    'description': 'Starts a server with the specified map and sends you a personal message when the server is ready.',
    'options': [
      {
        'name': 'map-name',
        'description': 'Name of the map to run the server.',
        'required': true,
        'type': 3
      }
    ]
  })
  return await getCommands()
}


module.exports = {
  syncCommands,
  DISCORD_COMMANDS
}
  
