var {readBits} = require('../quake3Utils/huffman.js')
var {entityStateFields} = require('./entity-fields.js')

var FLOAT_INT_BITS = 13
var FLOAT_INT_BIAS = (1<<(FLOAT_INT_BITS-1))

function readDeltaEntity(read, message, channel, number) {
  // check for a remove
  read = readBits(message, read[0], 1)
  if(read[1] == 1) { // remove
    delete channel.entities[number]
    return read
  }
  
  // check for no delta
  read = readBits(message, read[0], 1)
  if(read[1] == 0) { // no delta
    if(typeof channel.entities[number] == 'undefined')
      channel.entities[number] = 0
    return read
  }
  
  
  read = readBits(message, read[0], 8)
  var lc = read[1]

  for(var j = 0; j < lc; j++) {
    read = readBits(message, read[0], 1)
    if(read[1] == 0) // no change
      continue

    // fields bits
    if(entityStateFields[j] == 0) {
      read = readBits(message, read[0], 1)
      if(read[1] == 0) {
        channel.entities[number] = 0
      } else {
        read = readBits(message, read[0], 1)
        if(read[1] == 0) {
          read = readBits(message, read[0], FLOAT_INT_BITS)
          channel.entities[number] = read[1] - FLOAT_INT_BIAS
        } else {
          read = readBits(message, read[0], 32)
          channel.entities[number] = read[1]
        }
      }
    } else {
      read = readBits(message, read[0], 1)
      if(read[1] == 0) {
        channel.entities[number] = 0
      } else {
        read = readBits(message, read[0], entityStateFields[j])
        channel.entities[number] = read[1]
      }
    }
  }
  return read
}

module.exports = readDeltaEntity
