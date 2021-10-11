var {readInteractions, respondCommand} = require('../discordCmds')
var readAllCommands = require('../discordPoll/poll-channels.js')
var {authorizeGateway} = require('../discordApi')
var {MESSAGE_TIME} = require('../discordApi/default-config.js')
var {privateChannels} = require('../discordApi/gateway.js')
var DEFAULT_CHANNEL = process.env.DEFAULT_CHANNEL || 'general'
var stillRunning = false
var commandResponder
var excluded = []

async function respondChannel(specificChannel) {
  var channels = []
  var threads = []

  if(specificChannel == '@me') {
    // only read channel if it was updated within the last hour
    var userChannels = Object
      .keys(privateChannels)
      .filter(k => privateChannels[k] > now - MESSAGE_TIME)
      .map(k => ({id: k}))
    channels.push.apply(channels, userChannels)
    specificChannel = ''
  } else {
    var guilds = await userGuilds()
    console.log(`Reading ${guilds.length} guilds`)
    for(var i = 0; i < guilds.length; i++) {
      channels.push.apply(channels, await guildChannels(guilds[i].id))
    }
    //console.log(channels)
    for(var k = 0; k < channels.length; k++) {
      if(channels[k].type != 0)
        continue
      
      if(excluded.includes(channels[k].id))
        continue

      try {
        threads.push.apply(threads, await activeThreads(channels[k].id))
      } catch (e) {
        if(e.code == '403') {
          excluded.push(channels[k].id)
        }
      }
    }
    console.log(threads)
    channels.push.apply(channels, threads)
  }
  
  console.log(`Reading ${channels.length} channels`)
  for(var i = 0; i < channels.length; i++) {
    if(channels[i].type != 0)
      continue
    
    if(excluded.includes(channels[i].id))
      continue

    if(!specificChannel
      || channels[i].id == specificChannel
      || (typeof specificChannel == 'string'
      && (specificChannel.length === 0
       || (channels[i].name
         && channels[i].name.match(new RegExp(specificChannel, 'ig'))
      )))) {
      console.log(`Reading ${channels[i].name}`)
      var commands = await readAllCommands(
        channels[i],
        specificChannel == '@me',
        threads.filter(t => t.id == channels[i].id).length > 0
      )
      Promise.resolve(respondCommand(commands))
    }
  }
}


async function startResponder() {
  if(stillRunning) {
    console.log('Still running...')
    return
  }
  await authorizeGateway()
  stillRunning = true
  try {
    //var commands = await readAllCommands(DEFAULT_CHANNEL)
    //await respondCommand(commands)
    await respondChannel()
    await respondChannel('@me')
    var commands = await readInteractions()
    Promise.resolve(respondCommand(commands))
  } catch (e) {
    console.log('Command responder error', e)
  }
  stillRunning = false
  if(!commandResponder)
    commandResponder = setInterval(startResponder, 1000)
}

module.exports = startResponder
