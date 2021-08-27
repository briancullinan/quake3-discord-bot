var {getInfo, getStatus} = require('../quake3Api')
var {
  guildChannels, archivedThreads, getPins,
  activeThreads, createThread, createMessage,
  pinMessage, unpinMessage, udpClose
} = require('../discordApi')
var formatPlayerList = require('./format-players.js')
var removeCtrlChars = require('./remove-ctrl.js')
var DEFAULT_USERNAME = 'Orbb'

async function getServerChannel(server) {
  // get a list of channels to pair gametype up with
  var channels = await guildChannels()
  var channel
  // sort ffa/ctf/freeZe
  if(!channel && (server.server_freezetag == '1'
    || server.gamename.toLowerCase() == 'freon'
    || (typeof server.xp_version != 'undefined'
      && server.g_gametype == '8'))) {
    channel = channels.filter(c => c.name.toLowerCase() == 'freeze-tag')[0]
  }
  if(!channel && server.gamename.toLowerCase() == 'defrag') {
    channel = channels.filter(c => c.name.toLowerCase() == 'defrag')[0]
  }
  if(!channel && server.g_gametype == '4') {
    channel = channels.filter(c => c.name.toLowerCase() == 'capture-the-flag')[0]
  }
  if(!channel && server.g_gametype == '3') {
    channel = channels.filter(c => c.name.toLowerCase() == 'team-deathmatch')[0]
  }
  if(!channel && typeof server.xp_version != 'undefined'
    && server.g_gametype == '7') {
    channel = channels.filter(c => c.name.toLowerCase() == 'clan-arena')[0]
  }
  if(!channel && typeof server.xp_version != 'undefined'
    && server.g_gametype == '1') {
    channel = channels.filter(c => c.name.toLowerCase() == '1on1-duel')[0]
  }
  if(!channel) {
    channel = channels.filter(c => c.name.toLowerCase() == 'general')[0]
  }
  return channel
}

async function updateChannelThread(threadName, channel, json) {
  // find old threads to reactivate
  var archived = (await archivedThreads(channel.id)).threads 
    .filter(t => t.name == threadName)

  var thread
  var removeOld
  if(archived.length > 0) {
    thread = archived[0]
    removeOld = (await getPins(thread.id))
      .filter(p => p.author.username == DEFAULT_USERNAME)
  } else {
    // thread is already active
    var active = (await activeThreads(channel.id)).threads
      .filter(t => t.name == threadName)
    if(active.length > 0) {
      // find and update previous "whos online" message, pins?
      thread = active[0]
      var pins = (await getPins(thread.id))
        .filter(p => p.author.username == DEFAULT_USERNAME)
      if(pins.length > 0) {
        await updateMessage(json, pins[0].id, thread.id)
        return thread
      }
    } else {
      thread = await createThread(threadName, channel.id)
    }
  }
  // create new "whos online message"
  var message = await createMessage(json, thread.id)
  await pinMessage(message.id, thread.id)
  if(removeOld && removeOld.length > 0) {
    await unpinMessage(removeOld[0].id, thread.id)
  }
  return thread
}

async function monitorServer(address = 'q3msk.ru', port = 27977) {
  await getInfo(address, port)
  var server = await getStatus(address, port)
  var threadName = 'Pickup for ' + removeCtrlChars(server.sv_hostname || server.hostname).replace(/[^0-9a-z-]/ig, '-')
  var json = formatPlayerList(server)
  if(!server || server.monitorRunning) {
    console.log('Server not found.')
    return    
  }

  server.monitorRunning = true

  var serverMonitor = async () => {
    var channel = await getServerChannel(server)
    var thread
    if(!channel) {
      console.log('No channel to create thread on.')
    } else {
      thread = await updateChannelThread(threadName, channel, json)
      server.channelId = thread.id
    }
    return thread
  }
  server.monitorRunning = setInterval(() => {
    Promise.resolve(serverMonitor())
  }, 60 * 1000)
  return await serverMonitor()
}

module.exports = monitorServer
