var {
  getInfo,
  getChallenge,
  sendConnect,
  nextGamestate, sendReliable, nextChat,
  sendPureChecksums, nextSnapshot,
} = importer.import('quake 3 server commands')
var discordApi = importer.import('discord api')
var removeCtrlChars = importer.import('remove ctrl characters')


async function spectateServer(address = 'localhost', port = 27960) {
  var challenge = new ArrayBuffer(4)
  for(var c = 0; c < 4; c++) {
      challenge[c] = Math.round(Math.random() * 255)
  }
  var info = await getInfo(address, port)
  if(!info)
    return
  var challenge = await getChallenge(address, port, new Uint32Array(challenge)[0], info.gamename || info.game)
  await sendConnect(address, port, {
    challenge: challenge,
    name: 'Orbb-Bot',
    protocol: 71,
  })
  var gamestate = await nextGamestate(address, port)
  console.log('gamestate', server.sv_hostname || server.hostname)
  if(!gamestate.channel)
    return
  if(gamestate.isPure) {
    // TODO: send valid "cp" checksums to pure servers
    await sendPureChecksums(address, port, gamestate)
  }
  await nextSnapshot(address, port)
  await sendReliable(address, port, 'team s')

  // await print commands
  info.chatListener = setInterval(async () => {
    if(!info.chatWaiting) {
      info.chatWaiting = true
      var message = await nextChat(address, port)
      info.chatWaiting = false
      // forward print commands to discord
      if(message) {
        message = removeCtrlChars((/"([^"]*?)"/).exec(message)[1])
        discordApi.createMessage(message, info.channelId)
      }
    }
  }, 100)
}

module.exports = spectateServer
