var {
  getInfo, getChallenge, sendConnect,
  nextResponse, sendReliable, sendPureChecksums,
} = require('../quake3Api')
var {DEFAULT_USERNAME} = require('../discordApi')
var getThreadName = require('../quake3Utils/thread-name.js')
var {mergeMaster} = require('../quake3Api/parse-packet.js')
var getServerChannel = require('../discordPoll/map-server.js')
var checkServerCommands = require('../discordPoll/check-commands.js')
var relayChat = require('../discordPoll/chat-relay.js')

async function spectateServer(address = 'localhost', port = 27960) {
  var server = getServer(address, port)
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
  var teamChanged = Date.now()
  
  await sendReliable(address, port, 'team s')
  server.scoreTimeout = setInterval(() => {
    Promise.resolve(sendReliable(address, port, 'score'))
  }, 10000)

  var threadName = getThreadName(server)
  var discordChannel = await getServerChannel(server)

  var commandNumber = server.channel.commandSequence
  // await print commands
  server.chatListener = setInterval(() => {
    checkServerCommands(commandNumber, threadName, discordChannel, server)
    commandNumber = server.channel.commandSequence
  }, 100)
  
  if(discordChannel) {
    server.relayListener = setInterval(() => {
      Promise.resolve(relayChat(threadName, discordChannel, server))
    }, 3000)
  }
}

module.exports = spectateServer
