async function parseServerMessage() {
  master.channel = master.channel || {}
  var commandNumber = master.channel.commandSequence
  var channel = decodeClientMessage(m, master.channel)
  if(channel === false) {
    return
  }

  //console.log(channel)
  if (channel.messageType == 2) { // svc_gamestate
    nextResponse.nextGamestate = 
    master.nextResponse.nextGamestate = channel
  } else if (channel.messageType == 7) { // svc_snapshot
    nextResponse.nextSnapshot = 
    master.nextResponse.nextSnapshot = channel
  } else if (channel.messageType > 0) {
  }
  if(commandNumber < channel.commandSequence) {
    for(var j = commandNumber + 1; j <= channel.commandSequence; j++) {
      var index = j & (MAX_RELIABLE_COMMANDS-1)
      if((channel.serverCommands[index] + '').match(/^chat /i)) {
        nextResponse.nextChat = 
        master.nextResponse.nextChat = channel.serverCommands[index] + ''
      }
      console.log('serverCommand:', j, channel.serverCommands[index])
    }
  }

  // always respond with input event
  // response to snapshots automatically and not waiting,
  //   so new messages can be received
  sendSequence(rinfo.address, rinfo.port, channel)
  nextResponse.nextChannel = 
  master.nextResponse.nextChannel = channel
}
