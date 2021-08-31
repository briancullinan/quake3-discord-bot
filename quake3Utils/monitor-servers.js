var {getInfo, getStatus} = require('../quake3Api')
var {
  guildChannels, archivedThreads, getPins,
  activeThreads, createThread, createMessage,
  pinMessage, unpinMessage, udpClose
} = require('../discordApi')
var {mergeMaster} = require('../quake3Api/parse-packet.js')
var formatPlayerList = require('./format-players.js')
var removeCtrlChars = require('./remove-ctrl.js')
var DEFAULT_USERNAME = 'Orbb'
var channelsLastUpdated = 0
var channelsUpdating = false
var channels
var monitors = {}

async function getServerChannel(server) {
  // get a list of channels to pair gametype up with
  if(channelsUpdating) {
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  if((new Date).getTime() - channelsLastUpdated > 10 * 1000
    || !channels) {
    channelsUpdating = true
    channelsLastUpdated = (new Date).getTime()
    channels = await guildChannels()
    channelsLastUpdated = (new Date).getTime()
    //console.log(channels)
    channelsUpdating = false
  }
  var channel
  // sort ffa/ctf/freeZe
  if(!channel && (server.server_freezetag == '1'
    || (server.game || server.gamename || '').toLowerCase() == 'freon'
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
        try {
          console.log('Updating ', threadName)
          await updateMessage(json, pins[0].id, thread.id)
          return thread
        } catch (e) {
          if(e.code == '400' 
            && ((e.response.data || {}).message || '').includes('archived')) {
            console.log(e.response.data.message)
            return // do nothing because it will run again in 1 minute
          }
        }
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
  var status = await getStatus(address, port)

  // merge server info in case theres something we need for sorting the channel
  //  like the "game" key which only shows up in infoResponse
  var server = mergeMaster({
    domain: address,
    port: port
  })
  //console.log(server)

  if(!monitors[server.ip + ':' + server.port]) {
    monitors[server.ip + ':' + server.port] = setInterval(() => {
      Promise.resolve(monitorServer.bind(null, address, port)())
    }, 60 * 1000)
  }

  if(!server || !server.mapname) {
    console.log('Server not found.')
    return    
  }

  var threadName = 'Pickup for '
    + removeCtrlChars(server.sv_hostname || server.hostname)
      .trim()
      .replace(/[^0-9a-z\-]/ig, '-')
  //console.log(threadName)

  var json = formatPlayerList(server)
  var channel = await getServerChannel(server)
  //console.log(channel)

  var thread
  if(!channel) {
    console.log('No channel to create thread on.')
  } else if(server.players.filter(p => p.ping > 0).length == 0) {
    console.log('Skipping ' + address + ' because no humans.')
    return
  } else {
    try {
      thread = await updateChannelThread(threadName, channel, json)
    } catch (e) {
      if(e.response && e.response.data)
        console.log(e.response.data.message)
      else
        console.log(e)
    }
    server.channelId = thread.id
  }
  return thread
}

module.exports = monitorServer
