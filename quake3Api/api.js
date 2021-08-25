var dgram = require('dgram')
var udpClient = dgram.createSocket('udp4')
udpClient.on('message', updateInfo)

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

async function updateInfo(m, rinfo) {
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
    if(master.connected) {
      var read = netchanProcess(m, channel)
      if(read === false) return // fragment message, do nothing more
      m = m.slice(read, m.length)
      parseServerMessage(m, master.channel)
    } else {
      console.log("Sequenced packet without connection")
    }
  }
}

module.exports = {
  udpClient,
  /*
  getServers,
  getInfo,
  getStatus,
  getChallenge,
  sendRcon,
  sendConnect,
  sendSequence,
  sendReliable,
  sendPureChecksums,

  

  nextInfoResponse,
  nextStatusResponse,
  nextServerResponse,
  nextPrintResponse,
  nextChallengeResponse,
  nextConnectResponse,
  nextChannelMessage,
  nextGamestate,
  nextAnyResponse,
  nextSnapshot,
  nextChat,
  nextAllResponses,
  */
}
