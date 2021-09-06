var {
  SwapLong, SwapShort, NETCHAN_GENCHECKSUM
} = require('../quake3Utils/maths.js')
var MAX_PACKETLEN = 1400
var FRAGMENT_SIZE = (MAX_PACKETLEN - 100)
var MAX_MSGLEN = 16384

function netchanProcess(message, channel) {
  var read = 0
  var sequence = SwapLong(read, message)
  read += 32
  var fragment = (sequence >>> 31) === 1
  if(fragment) {
    sequence &= ~(1 << 31)
  }
  if(false) { // from client to server
    /*qport=*/ read += 16
  }

  var valid = false
  if(!channel.compat) {
    var checksum = SwapLong(read, message)
    read += 32
    valid = NETCHAN_GENCHECKSUM(channel.challenge, sequence) === checksum
  }
  if(!valid) {
      console.log('Invalid message received', sequence, channel.challenge)
      return false
  }
  
  var fragmentStart = 0
  var fragmentLength = 0
  if(fragment) {
    fragmentStart = SwapShort(read, message)
    read += 16
    fragmentLength = SwapShort(read, message)
    read += 16
  }
  
  if ( sequence <= channel.serverSequence ) {
      console.log('Out of order packet', sequence, channel.incomingSequence)
      return false
  }
  
  //channel.dropped = sequence - (channel.incomingSequence+1)
  
  if(fragment) {
    console.log('fragment message')
    // fragment and only return on final message
    if(!channel.fragmentBuffer) channel.fragmentBuffer = Buffer.from([])
    if(sequence != channel.fragmentSequence) {
      channel.fragmentSequence = sequence
      channel.fragmentLength = 0
      channel.fragmentBuffer = Buffer.from([])
    }

    if ( fragmentStart != channel.fragmentLength ) {
      return false
    }

    channel.fragmentBuffer = Buffer.concat([
      Buffer.from(channel.fragmentBuffer),
      Buffer.from(message.subarray(read>>3, (read>>3) + fragmentLength))
    ])
    channel.fragmentLength += fragmentLength

    if ( fragmentLength == FRAGMENT_SIZE ) {
      return false
    }

    if ( channel.fragmentLength > MAX_MSGLEN ) {
      return false
    }

    return true
  }

  channel.serverSequence = sequence
  // finished parsing header
  return read
}

module.exports = netchanProcess
