var {
  getInfo, getChallenge, sendConnect,
  nextResponse, sendReliable, sendPureChecksums,
} = require('../quake3Api')
var {DEFAULT_USERNAME} = require('../discordApi')
var getThreadName = require('./thread-name.js')
var {mergeMaster} = require('../quake3Api/parse-packet.js')
var getServerChannel = require('./map-server.js')
var checkServerCommands = require('./check-commands.js')
var relayChat = require('./chat-relay.js')

async function spectateServer(address = 'localhost', port = 27960) {
  var challenge = []
  for(var c = 0; c < 4; c++) {
      challenge[c] = Math.round(Math.random() * 255)
  }
  var unsigned = new Uint32Array(Uint8Array.from(challenge).buffer)
  var info = await getInfo(address, port)
  if(!info)
    return
  var challengeResponse = await getChallenge(
    address, port, 
    unsigned[0].toString(), 
    info.gamename || 'Quake3Arena'
  )
  var server = mergeMaster({
    domain: address,
    port: port
  })
  if(!server.channel) {
    console.log('Could not connect.')
    return
  }
  //server.channel.compat = true
  /*
  \cg_predictItems\1\cl_anonymous\0\cl_execOverflow\200\cl_execTimeout\2000
  \cl_guid\C4F0CF703C5CBB24F1A2725C1BC801FB\cl_paused\0\color1\4\color2\5
  \handicap\100\headmodel\sarge\model\sarge\name\UnnamedPlayer\rate\25000
  \sex\male\snaps\20\team_headmodel\sarge\team_model\sarge\protocol\68
  \qport\51590\challenge\-1167726640\client\Q3 1.32e
  */
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
