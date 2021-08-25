var discordApi = importer.import('discord api')
var serverApi = importer.import('quake 3 server commands')

var CHALLENGE = /(@[^:@\s]+\s*chall?[ae]nge|chall?[ae]nge\s*@[^:@\s]+)\s*([^:@\s]*?)\s*([^:@\s]*?)/ig
var DEFAULT_HOST = process.env.DEFAULT_HOST || 'http://quakeiiiarena.com/play/'
var MODS = typeof process.env.DEFAULT_MODS == 'string'
  ? JSON.parse(process.env.DEFAULT_MODS)
  : [
    'baseq3',
    'freon'
  ]

async function challengeCommand(command) {
  if(!command.private && (!command.mentions || command.mentions.length === 0))
    return
  var options = CHALLENGE.exec(command.content)
  var launch = (options ? options[2] : '') || ''
  var map = (options ? options[3] : '') || ''
  var message = 'I read you'
  var instruction = ''
  if(!MODS.includes(launch) && map.length === 0) {
    map = launch
    launch = ''
  }
  if(map.length === 0) {
    map = 'q3dm17'
  }
  if(launch.length == 0) {
    instruction += ', assuming baseq3 on map ' + map
  } else if(command.launching) {
    instruction += ' ' + launch + ' on map ' + map
  }
  if(!command.launching && !command.content.match(/:thumbsup:/ig)) {
    message = 'Waiting for reaction'
    instruction += ', react with :thumbsup: to launch'
  }
  if(command.launching) {
    message = 'Launching'
    await discordApi.createMessage(message + instruction + '\n```BOT'+command.id+'L\nbeep boop\n```\n', command.channel_id)
    await discordApi.triggerTyping(command.channel_id)
    var masters = await serverApi.getServers(void 0, void 0, false)
    if(masters.length === 0) {
        await discordApi.createMessage(`Boo hoo, no servers available. :cry:` 
            + '\n```BOT'+command.id+'L\nbeep boop\n```\n', command.channel_id)
        return
    }
    await serverApi.sendRcon(masters[0].ip, masters[0].port, '\exec ' + launch + '.cfg')
    await serverApi.sendRcon(masters[0].ip, masters[0].port, '\map ' + map)
    await new Promise(resolve => setTimeout(resolve, 1000))
    await discordApi.createMessage(`Match is ready ${DEFAULT_HOST}?connect%20${masters[0].ip}:${masters[0].port} (${masters[0].ip}:${masters[0].port})`
                                   + '\n```BOT'+command.id+'L\nbeep boop\n```\n', command.channel_id)
  } else if (instruction.length > 0) {
    await discordApi.createMessage(message + instruction + '\n```BOT'+command.id+'\nbeep boop\n```\n', command.channel_id)
  }
}

module.exports = challengeCommand
