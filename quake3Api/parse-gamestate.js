var {readBits} = require('../quake3Utils/huffman.js')
var {ReadString} = require('../quake3Utils/maths.js')
var {GENTITYNUM_BITS} = require('../quake3Api/entity-fields.js')
var parseConfigStr = require('../quake3Utils/parse-configstr.js')
var {
  systemInfoChanged, configStringsChanged
} = require('../quake3Api/parse-command.js')
var readDeltaEntity = require('../quake3Api/parse-deltaent.js')

var	CS_SERVERINFO = 0 // an info string with all the serverinfo cvars
var CS_SYSTEMINFO = 1 // an info string for server system to client system configuration (timescale, etc)

function parseGamestate(read, message, channel, server) {
  read = readBits(message, read[0], 32)
  channel.commandSequence = read[1]
  while(true) {
    read = readBits(message, read[0], 8)
    if(read[1] == 8)  // svc_EOF
      break

    switch(read[1]) {
      default: 
        console.log('Bad command byte', read[1])
      break
      case 3: // svc_configstring
        read = readBits(message, read[0], 16)
        var csI = read[1]
        read = ReadString(read, message, true /* big */)
        if(typeof channel.configStrings == 'undefined')
          channel.configStrings = []
        channel.configStrings[csI] = read[1]
      break
      case 4: // svc_baseline
        if(typeof channel.entities == 'undefined')
          channel.entities = []
        read = readBits(message, read[0], GENTITYNUM_BITS)
        var newnum = read[1]
        read = readDeltaEntity(read, message, channel, newnum)
      break
    }
  }

  read = readBits(message, read[0], 32)
  channel.clientNum = read[1]

  read = readBits(message, read[0], 32)
  channel.checksumFeed = read[1]

  // parse server info
  channel.serverInfo = parseConfigStr(channel.configStrings[CS_SERVERINFO])

  // parse system info
  channel.systemInfo = parseConfigStr(channel.configStrings[CS_SYSTEMINFO])
  systemInfoChanged(channel)
  configStringsChanged(channel, server)

  return read
}

module.exports = parseGamestate
