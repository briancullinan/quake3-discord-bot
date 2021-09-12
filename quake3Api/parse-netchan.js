var {
  SwapLong, SwapShort, NETCHAN_GENCHECKSUM
} = require('../quake3Utils/maths.js')
var {readBits} = require('../quake3Utils/huffman.js')
var {MAX_RELIABLE_COMMANDS} = require('../quake3Api/config-strings.js')
var MAX_PACKETLEN = 1400
var FRAGMENT_SIZE = (MAX_PACKETLEN - 100)
var MAX_MSGLEN = 16384
var CL_DECODE_START = 4 // not 4 becuse we trim off sequence

function netchanDecode(message, channel) {
  //var buffer = bufferToArrayBuffer(message)
  //var messageView = new Uint32Array(buffer)
  var read = readBits(message, 0, 32)
  var reliableAcknowledge = read[1]

  var cmdI = reliableAcknowledge & (MAX_RELIABLE_COMMANDS-1)
  var string = channel.reliableCommands[ cmdI ] || ''
  var index = 0;
  // xor the client challenge with the netchan sequence number (need something that changes every message)
  var key = (channel.challenge ^ channel.serverSequence) & 0xFF
  for (var i = CL_DECODE_START; i < message.length; i++) {
    // modify the key with the last sent and with this message acknowledged client command
		if (!string.charCodeAt(index))
			index = 0;
		if (string.charCodeAt(index) > 127 || string.charCodeAt(index) == '%') {
			key ^= '.' << (i & 1)
		}
		else {
			key ^= string.charCodeAt(index) << (i & 1)
		}
		index++;
		// decode the data with this key
		message[i] = message[i] ^ key
  }
}

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
  } else {
    valid = true
  }
  if(!valid) {
      console.log('Invalid message received', channel.compat, sequence, channel.challenge)
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

    channel.serverSequence = sequence    

    return true
  }

  channel.serverSequence = sequence
  // finished parsing header
  return read
}

module.exports = {
  netchanProcess,
  netchanDecode,
}
