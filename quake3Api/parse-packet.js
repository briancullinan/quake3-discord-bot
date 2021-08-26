var connectionlessPacket = require('./parse-connectionless.js')
var parseServerMessage = require('./parse-server.js')

var masters = []

function mergeMaster(master) {
  var found = false
  masters.forEach((ma, i) => {
    if(ma['ip'] == master['ip'] && ma['port'] == master['port']) {
      found = true
      Object.assign(masters[i], master)
      Object.assign(master, masters[i])
      return false
    }
  })
  if(!found)
    masters.push(master)
  return master
}

async function packetEvent(m, rinfo) {
  if(m[0] == 255 && m[1] == 255 && m[2] == 255 && m[3] == 255) {
    m = m.slice(4, m.length)
    var data = connectionlessPacket()
    mergeMaster(Object.assign(data, {
      ip: rinfo.address,
      port: rinfo.port
    }))
  } else {
    var master = mergeMaster({
      ip: rinfo.address,
      port: rinfo.port
    })
    if(!master.connected) {
      console.log("Sequenced packet without connection")
      return
    }
    var read = netchanProcess(m, channel)
    if(read === false) return // fragment message, do nothing more
    m = m.slice(read, m.length)
    master.channel = master.channel || {}
    var commandNumber = master.channel.commandSequence
    var channel = parseServerMessage(m, master.channel)
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
  }
}

module.exports = {
  packetEvent,
  mergeMaster
}
