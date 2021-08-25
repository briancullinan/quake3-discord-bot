var {readBits} = require('./huffman.js')

function SwapLong(read, message) {
  return (message[(read>>3)+3] << 24) + (message[(read>>3)+2] << 16)
    + (message[(read>>3)+1] << 8) + message[(read>>3)]
}

function SwapShort(read, message) {
  return (message[(read>>3)+1] << 8) + message[(read>>3)]
}

function ReadString(read, message, big = false) {
  var result = ''
  do {
    read = readBits( message, read[0], 8 ) // use ReadByte so -1 is out of bounds
    var c = read[1]
    if ( c <= 0 /*c == -1 || c == 0 */
      || (!big && result.length >= MAX_STRING_CHARS-1 )
      || (big && result.length >= BIG_INFO_STRING-1 ) ) {
      break
    }
    // translate all fmt spec to avoid crash bugs
    if ( c == '%' ) {
        c = '.'
    } else
    // don't allow higher ascii values
    if ( c > 127 ) {
        c = '.'
    }
    result += String.fromCharCode(c)
  } while ( true )
  return [read[0], result]
}

function NETCHAN_GENCHECKSUM(challenge, sequence) {
  return (challenge) ^ ((sequence) * (challenge))
}

module.exports = {
  NETCHAN_GENCHECKSUM,
  ReadString,
  SwapShort,
  SwapLong
}
