var {
  getInfo, getChallenge, sendConnect,
  nextResponse, sendReliable, sendPureChecksums,
} = require('../quake3Api')
var {DEFAULT_USERNAME} = require('../discordApi')
var removeCtrlChars = require('./remove-ctrl.js')
var {mergeMaster} = require('../quake3Api/parse-packet.js')
var {MAX_RELIABLE_COMMANDS} = require('../quake3Api/config-strings.js')
var getServerChannel = require('./map-server.js')
var {updateThread} = require('./update-channel.js')
var saveMatch = require('./match-db.js')

async function spectateServer(address = 'localhost', port = 27960) {
  var challenge = new ArrayBuffer(4)
  for(var c = 0; c < 4; c++) {
      challenge[c] = Math.round(Math.random() * 255)
  }
  var info = await getInfo(address, port)
  if(!info)
    return
  var challengeResponse = await getChallenge(address, port, new Uint32Array(challenge)[0], info.gamename || info.game)
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
    protocol: challengeResponse.channel.compat ? 68 : 71,
    model: 'orbb',
    cl_recentPassword: 'pass',
    client: 'Q3 1.32e',
    snaps: 20,
    cl_guid: 'C4F0CF703C5CBB24F1A2725C1BC801FB',
    cg_predictItems: '1',
    cl_anonymous: '0',
    
  })
  var server = mergeMaster({
    domain: address,
    port: port
  })
  if(!server.channel)
    return
  await nextResponse('svc_gamestate', address, port, true /* isChannel */)
  Object.assign(server, server.channel.serverInfo, server.channel.systemInfo)

  if(server.channel.isPure) {
    // TODO: send valid "cp" checksums to pure servers
    await sendPureChecksums(address, port, server.channel)
  }
  await nextResponse('svc_snapshot', address, port, true /* isChannel */)
  await sendReliable(address, port, 'team s')

  var threadName = 'Pickup for '
    + removeCtrlChars(server.sv_hostname || server.hostname)
      .trim()
      .replace(/[^0-9a-z\-]/ig, '-')
  var discordChannel = await getServerChannel(server)

  var commandNumber = server.channel.commandSequence
  // await print commands
  server.chatListener = setInterval(async () => {
    if(!server.chatWaiting) {
      server.chatWaiting = true
      var channel = await nextResponse(
        'svc_serverCommand', address, port, true /* isChannel */)
      server.chatWaiting = false
      if(!channel) return

      // forward print commands to discord
      if(commandNumber < channel.commandSequence) {
        for(var j = commandNumber + 1; j <= channel.commandSequence; j++) {
          var index = j & (MAX_RELIABLE_COMMANDS-1)
          var message = channel.serverCommands[index] + ''
          if(message.match(/^chat /i) /* || (message).match(/^print /i) */) {
            console.log(server.ip + ':' + server.port + ' ---> ', message)
            message = removeCtrlChars((/"([^"]*?)"/).exec(message)[1])
            updateThread(threadName, discordChannel, message)
          } else if (message.match(/^cs [0-9]+ /i)
            || message.match(/^scores /i)) {
            saveMatch(server)
          } else {
            console.log('Unrecognized', message)
          }
        }
        commandNumber = channel.commandSequence
      }
    }
  }, 20)
  server.scoreTimeout = setInterval(() => {
    Promise.resolve(sendReliable(address, port, 'score'))
  }, 10000)
}

module.exports = spectateServer
