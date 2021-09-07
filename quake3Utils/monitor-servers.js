var {getInfo, getStatus} = require('../quake3Api')
var getServerChannel = require('./map-server.js')
var {updateChannelThread} = require('./update-channel.js')
var {mergeMaster} = require('../quake3Api/parse-packet.js')
var formatPlayerList = require('./format-players.js')
var removeCtrlChars = require('./remove-ctrl.js')
var monitors = {}

async function monitorServer(address = 'q3msk.ru', port = 27977) {
  await getInfo(address, port)
  var status = await getStatus(address, port)

  // merge server info in case theres something we need for sorting the channel
  //  like the "game" key which only shows up in infoResponse
  var server = mergeMaster({
    domain: address,
    port: port
  })

  // automatically update server status
  if(!monitors[server.ip + ':' + server.port]) {
    monitors[server.ip + ':' + server.port] = setInterval(() => {
      Promise.resolve(monitorServer(address, port))
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

  var json = formatPlayerList(server)
  var channel = await getServerChannel(server)

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
        console.log('Thread error', e.response.data.message)
      else
        console.log('Thread error', e)
    }
    server.channelId = thread.id
  }
  return thread
}

module.exports = monitorServer
