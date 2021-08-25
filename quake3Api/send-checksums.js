var mdfour = require('../utilities/mdfour.js')

function NETCHAN_GENCHECKSUM(challenge, sequence) {
  return (challenge) ^ ((sequence) * (challenge))
}

var pak8pk3 = [0,695294960,269430381,2656948387,485997170,1095318617]

async function sendPureChecksums(address, port, channel) {
  // TODO: calculate different checksums for other games QVMs
  var checksum = pak8pk3[0] = channel.checksumFeed
  var headers = new Uint8Array(Uint32Array.from(pak8pk3).buffer)
  var digest = new Uint32Array(4)
  mdfour(digest, headers, headers.length)
  var unsigned = new Uint32Array(1)
  unsigned[0] = digest[0] ^ digest[1] ^ digest[2] ^ digest[3]
  checksum ^= unsigned[0]
  checksum ^= 1
  sendReliable(address, port, 
    'cp ' + channel.serverId 
    + ' '   + unsigned[0]
    + ' '   + unsigned[0]
    + ' @ ' + unsigned[0]
    + ' '   + checksum)
}

module.exports {
  sendPureChecksums,
  NETCHAN_GENCHECKSUM
}
