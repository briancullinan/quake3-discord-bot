var {
  getChallenge, sendConnect, sendRcon, 
  getStatus, getInfo, getServers, udpClose
} = require('./send-connectionless.js')

module.exports = {
  getChallenge, sendConnect, sendRcon, 
  getStatus, getInfo, getServers, udpClose
  ... {sendPureChecksums} = require('./send-checksums.js'),
  ... {sendSequence, sendReliable} = require('./send-sequence.js'),

  /*
  nextInfoResponse,
  nextStatusResponse,
  nextPrintResponse,
  nextChallengeResponse,
  nextConnectResponse,
  nextGamestate,
  nextSnapshot,
  nextChat,
  nextAllResponses,
  */
}
