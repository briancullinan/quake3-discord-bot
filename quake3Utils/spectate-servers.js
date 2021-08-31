var {
  getInfo, getChallenge, sendConnect,
  nextResponse, sendReliable, sendPureChecksums,
} = require('../quake3Api')
var {createMessage} = require('../discordApi')
var removeCtrlChars = require('./remove-ctrl.js')


async function spectateServer(address = 'localhost', port = 27960) {
  var challenge = new ArrayBuffer(4)
  for(var c = 0; c < 4; c++) {
      challenge[c] = Math.round(Math.random() * 255)
  }
  var info = await getInfo(address, port)
  if(!info)
    return
  var challengeResponse = await getChallenge(address, port, new Uint32Array(challenge)[0], info.gamename || info.game)
  var channel = await sendConnect(address, port, {
    challenge: challengeResponse.challenge,
    name: 'Orbb-Bot',
    protocol: 71,
  })
  var gamestate = await nextResponse(
    'svc_gamestate', address, port, true /* isChannel */)
  //console.log('gamestate', server.sv_hostname || server.hostname)
  if(!gamestate.channel)
    return
  if(gamestate.isPure) {
    // TODO: send valid "cp" checksums to pure servers
    await sendPureChecksums(address, port, gamestate)
  }
  await nextResponse('svc_snapshot', address, port, true /* isChannel */)
  await sendReliable(address, port, 'team s')

  // await print commands
  info.chatListener = setInterval(async () => {
    if(!info.chatWaiting) {
      info.chatWaiting = true
      var message = await nextResponse(
        'svc_serverCommand', address, port, true /* isChannel */)
      info.chatWaiting = false
      // forward print commands to discord
      if(message) {
        message = removeCtrlChars((/"([^"]*?)"/).exec(message)[1])
        createMessage(message, info.channelId)
      }
    }
  }, 100)
}

module.exports = spectateServer
