var {
  registerCommand, getCommands, deleteCommand, updateCommand
} = require('../discordApi')

// used by legacy poller and discord commands reconstructed into this format
var DISCORD_COMMANDS = {
  CHALLENGE: /^[!\\\/]?(<@[^:@\s]+>\s*chall?[ae]nge|chall?[ae]nge\s*<@[^:@\s]+>)\s+([^:@\s]*?)\s*([^:@\s]*?)/ig,
  CONNECT: /^[!\\\/]?(rcon)?conn?ect\s+([0-9\.a-z-_]+(:[0-9]+)*)$/ig,
  RCON: /^[!\\\/]?rcon(pass?wo?rd)?\s+([^"\s]+)\s*(.*)$/ig,
  DISCONNECT: /[!\\\/]?disconn?ect/ig,
  CONFIG: /^[!\\\/]?(\w*)(\.cfg|config|configure)/ig,
  LOAD: /^[!\\\/]?(load|map)\s+(\w*)/ig,
  COMMAND: /^[!\\\/]/ig,
  SEARCH: /^[!\\\/]?search\s+(\w*)/ig,
  AUTHOR: /^[!\\\/]?author\s+(\w*)/ig,
  SERVERS: /^[!\\\/]?servers\s+(\w*)/ig,
  GAME: /^[!\\\/]?gametype\s+(\w*)/ig,
  RANK: /^[!\\\/]?rank\s+(\w*)/ig,
  RANKINGS: /^[!\\\/]?rankings\s+(\w*)/ig,
  STATS: /^[!\\\/]?stats?\s+(\w*)/ig,
  HELLO: /^[!\\\/]?(\w\s*){0,2}hello(\w\s*){0,2}/ig,
  UNKNOWN: /.*/ig,
}

var ALL_COMMANDS = [
  'hello',
  'challenge',
  'connect',
  'rcon',
  'config',
  'map',
  'servers',
  'search',
  'author',
  'gametype',
  'stats',
  'rank',
  'rankings',
]

// bot commands using new API, same names as above but lower-case
async function syncCommands(guildId = null) {
  var cmd, cmdDef
  var commandResult = await getCommands(guildId)
  var commands = commandResult.map(command => command.name)

  if(!commands.includes('hello')) {
    await registerCommand('hello', 'Check if Orbb is awake.', guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'hello')[0]
    await updateCommand(cmd.name, cmd.description, cmd.id, guildId)
  }
  
  cmdDef = {
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
  }
  if(!commands.includes('challenge')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'challenge')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
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
  }
  if(!commands.includes('connect')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'connect')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
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
  }
  if(!commands.includes('rcon')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'rcon')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
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
  }
  if(!commands.includes('config')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'config')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
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
  }
  if(!commands.includes('map')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'map')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
    'name': 'servers',
    'description': 'Show a list of available Quake 3 servers to join.',
    'options': [
      {
        'name': 'empty',
        'description': 'Show empty servers. (Default: true)',
        'required': false,
        'type': 5
      },
      {
        'name': 'game',
        'description': 'Filter by game name. (Default: All)',
        'required': false,
        'type': 3
      },
      {
        'name': 'full',
        'description': 'Show empty servers. (Default: true)',
        'required': false,
        'type': 5
      },
    ]
  }
  if(!commands.includes('servers')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'servers')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
    'name': 'search',
    'description': 'Search for a map on lvlworld.com.',
    'options': [
      {
        'name': 'terms',
        'description': 'Text to look for in the map name.',
        'required': true,
        'type': 3
      }
    ]
  }
  if(!commands.includes('search')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'search')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
    'name': 'author',
    'description': 'Search for a map on lvlworld.com by author only.',
    'options': [
      {
        'name': 'terms',
        'description': 'Text to look for in the author name.',
        'required': true,
        'type': 3
      }
    ]
  }
  if(!commands.includes('author')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'author')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
    'name': 'gametype',
    'description': 'Search for a map on lvlworld.com by gametype.',
    'options': [
      {
        'name': 'terms',
        'description': 'Text to look for in the gametype, try tourney or 2 player.',
        'required': true,
        'type': 3
      }
    ]
  }
  if(!commands.includes('gametype')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'gametype')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
    'name': 'stats',
    'description': 'Display stats for the specified user.',
    'options': [
      {
        'name': 'player',
        'description': 'Name or Discord of the player.',
        'required': true,
        'type': 3
      }
    ]
  }
  if(!commands.includes('stats')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'stats')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
    'name': 'rank',
    'description': 'Display rank for the specified user.',
    'options': [
      {
        'name': 'player',
        'description': 'Name or Discord of the player.',
        'required': true,
        'type': 3
      }
    ]
  }
  if(!commands.includes('rank')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'rank')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  cmdDef = {
    'name': 'rankings',
    'description': 'Display global ranking information.',
    'options': [
      {
        'name': 'server',
        'description': 'IP or domain of the server for specific rankings.',
        'required': false,
        'type': 3
      }
    ]
  }
  if(!commands.includes('rankings')) {
    await registerCommand(cmdDef, null, guildId)
  } else {
    cmd = commandResult.filter(c => c.name == 'rankings')[0]
    await updateCommand(cmdDef, null, cmd.id, guildId)
  }

  var toRemove = commandResult.filter(c => !ALL_COMMANDS.includes(c.name))
  for(var i = 0; i < toRemove.length; i++) {
    await deleteCommand(toRemove[i].id, guildId)
  }

  return await getCommands()
}


async function deleteCommands(guildId) {
  var toRemove = await getCommands(guildId)
  for(var i = 0; i < toRemove.length; i++) {
    await deleteCommand(toRemove[i].id, guildId)
  }
}


module.exports = {
  syncCommands,
  deleteCommands,
  DISCORD_COMMANDS
}
  
