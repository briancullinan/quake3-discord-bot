var {getServer} = require('../quake3Api')
var getServerChannel = require('../discordPoll/map-server.js')
var {updateChannelThread} = require('../discordPoll/update-channel.js')
var formatPlayerList = require('../quake3Utils/format-players.js')
var getThreadName = require('../quake3Utils/thread-name.js')
var monitors = {}
var UPDATE_INTERVAL = 30 * 1000

async function monitorServer(address = 'q3msk.ru', port = 27977) {
  // merge server info in case theres something we need for sorting the channel
  //  like the "game" key which only shows up in infoResponse
  var server = getServer(address, port)

  // automatically update server status
  if(!monitors[server.ip + ':' + server.port]) {
    monitors[server.ip + ':' + server.port] = setInterval(() => {
      Promise.resolve(monitorServer(address, port))
    }, UPDATE_INTERVAL)
  }

  if(!server || !mapname) {
    console.log('Server not found.')
    return    
  }

  var threadName = getThreadName(server)
  var json = formatPlayerList(server)
  var channel = await getServerChannel(server)

  var thread
  if(!channel) {
    console.log('No channel to create thread on.')
  } else if(server.players.filter(p => p.ping > 0 
    && (typeof server.channel == 'undefined' 
      || p.i != server.channel.clientNum)).length == 0) {
    console.log('Skipping ' + address + ' because no humans.')
    return
  } else {
    console.log('client num', server.channel ? server.channel.clientNum : '', server.players)
    try {
      thread = await updateChannelThread(
        threadName,
        channel,
        json,
        server.previousMap != server.mapname 
          || (server.channel && server.previousId != server.channel.serverId))
      server.previousMap = server.mapname
      if(server.channel)
        server.previousId = server.channel.serverId
    } catch (e) {
      if(e.response && e.response.data)
        console.log('Thread error', e.response.data.message, e)
      else
        console.log('Thread error', e)
    }
  }
  return thread
}

module.exports = monitorServer
