var {getInfo, getStatus, getUser} = require('../quake3Api')
var getServerChannel = require('./map-server.js')
var {updateChannelThread} = require('./update-channel.js')
var {mergeMaster} = require('../quake3Api/parse-packet.js')
var formatPlayerList = require('./format-players.js')
var removeCtrlChars = require('./remove-ctrl.js')
var monitors = {}
var UPDATE_INTERVAL = 30 * 1000

async function monitorServer(address = 'q3msk.ru', port = 27977) {
  // merge server info in case theres something we need for sorting the channel
  //  like the "game" key which only shows up in infoResponse
  var mapname, serverId
  var server = mergeMaster({
    domain: address,
    port: port
  })
  if(server && server.mapname)
    mapname = server.mapname
  if(server && server.channel)
    serverId = server.channel.serverId

  await getInfo(address, port)
  var status = await getStatus(address, port)

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

  var threadName = removeCtrlChars(server.sv_hostname || server.hostname)
      .trim()
      .replace(/[^0-9a-z\-\s]/ig, '')
      .replace(/\s\s+/ig, ' ')
      .replace(/\s\s+/ig, ' ')
      .trim()
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
    console.log(server.players)
    try {
      thread = await updateChannelThread(
        threadName,
        channel,
        json,
        mapname != server.mapname 
          || (server.channel && serverId != server.channel.serverId))
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
