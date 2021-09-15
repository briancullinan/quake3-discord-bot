var {getServer} = require('../quake3Api')
var getServerChannel = require('../discordPoll/map-server.js')
var {updateChannelThread} = require('../discordPoll/update-channel.js')
var formatPlayerList = require('../quake3Utils/format-players.js')
var getThreadName = require('../quake3Utils/thread-name.js')

async function monitorServer(threadName, discordChannel, server) {
  if(!discordChannel) {
    console.log('No channel to create thread on.')
  } else {
    var humans = server.players.filter(p => p.ping > 0 
    && (typeof server.channel == 'undefined'
    // TODO: don't know why this is incorrect 
      || p.i != server.channel.clientNum)
      && (p.name || p.n) != 'Orbb')
    if(humans.length == 0) {
      console.log('Skipping ' + server.ip + ' because no humans.')
      return
    } else {
      //console.log('client num', server.channel ? server.channel.clientNum : '', server.players)
      try {
        var json = formatPlayerList(server)
        await updateChannelThread(
          threadName,
          discordChannel,
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
  }
}

module.exports = monitorServer
