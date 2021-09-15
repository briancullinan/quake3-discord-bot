var {
  getChallenge, sendConnect, sendRcon, 
  getStatus, getInfo, getServers, udpClose
} = require('../quake3Api/send-connectionless.js')
var {mergeMaster} = require('../quake3Api/parse-packet.js')

async function getServer(address, port) {
  var server = mergeMaster({
    domain: address,
    port: port
  })
  await getInfo(address, port)
  await getStatus(address, port)
  return server
}


module.exports = {
  getServer,
  getChallenge, sendConnect, sendRcon, 
  getStatus, getInfo, getServers, udpClose,
  ... {
    sendPureChecksums
  } = require('../quake3Api/send-checksums.js'),
  ... {
    sendSequence, sendReliable
  } = require('../quake3Api/send-sequence.js'),
  nextResponse: require('../quake3Api/response-event.js'),
  ... {
    SV_EVENT
  } = require('../quake3Api/parse-event.js'),
}
