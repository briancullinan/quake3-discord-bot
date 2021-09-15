var {
  getInfo, getChallenge, sendConnect,
  nextResponse, sendReliable, sendPureChecksums,
} = require('../quake3Api')
var {DEFAULT_USERNAME} = require('../discordApi')
var getThreadName = require('../quake3Utils/thread-name.js')
var {getServer} = require('../quake3Api')
var getServerChannel = require('../discordPoll/map-server.js')
var checkServerCommands = require('../discordPoll/check-commands.js')
var relayChat = require('../discordPoll/chat-relay.js')
var monitorServer = require('../discordPoll/monitor-servers.js')
var servers = []
var SCORE_FREQUENCY = 15 * 1000
var COMMAND_FREQUENCY = 1000
var RELAY_FREQUENCY = 3 * 1000
var MONITOR_FREQUENCY = 30 * 1000
var subInterval = setInterval(subscribeUpdates, 100)

function subscribeUpdates() {
  var now = Date.now()
  for(var i = 0; i < servers.length; i++) {
    /*
    if(now - servers[i].lastScore > SCORE_FREQUENCY) {
      Promise.resolve(sendReliable(servers[i].ip, servers[i].port, 'score'))
      servers[i].lastScore = now
    }
    if(now - servers[i].lastCommand > COMMAND_FREQUENCY) {
      checkServerCommands(
        servers[i].previousCommandNum || 0,
        servers[i].threadName,
        servers[i].discordChannel, servers[i])
      servers[i].previousCommandNum = servers[i].channel.commandSequence
      servers[i].lastCommand = now
    }
    if(now - servers[i].lastRelay > RELAY_FREQUENCY) {
      Promise.resolve(relayChat(servers[i].threadName, servers[i].discordChannel, servers[i]))
      servers[i].lastRelay = now
    }
    */
    if(now - servers[i].lastMonitor > MONITOR_FREQUENCY) {
      Promise.resolve(monitorServer(servers[i].threadName, servers[i].discordChannel, servers[i]))
      servers[i].lastMonitor = now
    }
  }
}

async function spectateServer(address = 'localhost', port = 27960) {
  var server = await getServer(address, port)
  if(!server)
    return
  var challengeResponse = await getChallenge(address, port)
  if(!server.channel) {
    console.log('Could not connect.')
    return
  }
  var channel = await sendConnect(address, port, {
    challenge: challengeResponse.challenge,
    name: DEFAULT_USERNAME,
    protocol: server.channel.compat ? 68 : 71,
    model: 'orbb',
    cl_recentPassword: 'pass',
    client: 'Q3 1.32e',
    snaps: 20,
    cl_guid: 'C4F0CF703C5CBB24F1A2725C1BC801FB',
    cg_predictItems: '1',
    cl_anonymous: '0',
    
  })
  if(!channel) {
    console.log('Could not connect.')
    return
  }
  await nextResponse('svc_gamestate', address, port, true /* isChannel */)
  Object.assign(server, server.channel.serverInfo, server.channel.systemInfo)

  if(server.channel.isPure) {
    // TODO: send valid "cp" checksums to pure servers
    await sendPureChecksums(address, port, server.channel)
  }
  await nextResponse('svc_snapshot', address, port, true /* isChannel */)
  server.teamChanged = Date.now()
  await sendReliable(address, port, 'team s')
  await nextResponse('svc_snapshot', address, port, true /* isChannel */)

  server.threadName = getThreadName(server)
  server.discordChannel = await getServerChannel(server)
  server.lastScore 
    = server.lastCommand 
    = server.lastRelay 
    = server.lastMonitor
    = 0
  servers.push(server)
}

module.exports = spectateServer
