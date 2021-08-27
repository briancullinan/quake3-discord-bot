var {
  getChallenge, sendConnect, sendRcon, 
  getStatus, getInfo, getServers, udpClose
} = require('./send-connectionless.js')

module.exports = {
  getChallenge, sendConnect, sendRcon, 
  getStatus, getInfo, getServers, udpClose,
  ... {sendPureChecksums} = require('./send-checksums.js'),
  ... {sendSequence, sendReliable} = require('./send-sequence.js'),

  /*
  nextGamestate,
  nextSnapshot,
  nextChat,
  nextAllResponses,
  */
}
