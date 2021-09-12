var {udpPort, udpSend} = require('../quake3Api/send-connectionless.js')
var {NETCHAN_GENCHECKSUM} = require('../quake3Api/send-checksums.js')
var {mergeMaster} = require('../quake3Api/parse-packet.js')
var {writeBits} = require('../quake3Utils/huffman.js')
var lookupDNS = require('../utilities/dns.js')
var {MAX_RELIABLE_COMMANDS} = require('../quake3Api/config-strings.js')
var CL_ENCODE_START = 12

function netchanEncode(message, channel) {
  //var messageView = new Uint32Array(message)
  var cmdI = channel.commandSequence & (MAX_RELIABLE_COMMANDS-1)
  var string = (channel.serverCommands || [])[ cmdI ] || ''
  var index = 0;
  //
  var key = (channel.challenge ^ channel.serverId ^ channel.serverSequence) & 0xFF
  for (var i = CL_ENCODE_START; i < message.length; i++) {
    // modify the key with the last received now acknowledged server command
    if (!string.charCodeAt(index))
      index = 0
    if (string.charCodeAt(index) > 127 || string.charCodeAt(index) == '%') {
      key ^= '.' << (i & 1);
    }
    else {
      key ^= string.charCodeAt(index) << (i & 1)
    }
    index++;
    // encode the data with this key
    message[i] = message[i] ^ key
  }
}

async function sendSequence(address, port, channel) {
  var msg
  msg = writeBits([]    , 0     , channel.serverId || 0, 32)
  msg = writeBits(msg[1], msg[0], channel.serverId ? (channel.serverSequence || 0) : 0, 32)
  msg = writeBits(msg[1], msg[0], channel.serverId ? (channel.commandSequence || 0) : 0, 32)

  // write any unacknowledged clientCommands
  for ( var i = channel.reliableAcknowledge + 1 ; i <= channel.reliableSequence ; i++ ) {
    msg = writeBits(msg[1], msg[0], 4, 8) // clc_clientCommand
    msg = writeBits(msg[1], msg[0], i, 32)
    var command = channel.reliableCommands[ i & (MAX_RELIABLE_COMMANDS-1) ]
    for ( var c = 0 ; c < command.length; c++ ) {
      // get rid of 0x80+ and '%' chars, because old clients don't like them
      var v
      if ( command[c] & 0x80 || command[c] == '%' )
        v = '.'.charCodeAt(0);
      else
        v = command[c].charCodeAt(0);
      msg = writeBits(msg[1], msg[0], v, 8)
    }
    msg = writeBits(msg[1], msg[0], 0, 8)
  }

  // empty movement
  msg = writeBits(msg[1], msg[0], 3, 8) // clc_moveNoDelta
  // write the command count
  msg = writeBits(msg[1], msg[0], 1, 8)
  // write delta user cmd key
  msg = writeBits(msg[1], msg[0], 1, 1)
  // TODO: spectate and record player locations
  msg = writeBits(msg[1], msg[0], 0, 1) // no change
  
  msg = writeBits( msg[1], msg[0], 5, 8 ); // clc_EOF

  var dstIP = await lookupDNS(address)
  var qport = udpPort()
  var msgBuff = new Buffer.from([
    (channel.outgoingSequence >> 0) & 0xFF,
    (channel.outgoingSequence >> 8) & 0xFF,
    (channel.outgoingSequence >> 16) & 0xFF,
    (channel.outgoingSequence >> 24) & 0xFF,
    (qport >> 0) & 0xFF,
    (qport >> 8) & 0xFF,
  ])

  var checksum = NETCHAN_GENCHECKSUM(channel.challenge, channel.outgoingSequence)
  if(!channel.compat) {
    msgBuff = Buffer.concat([
      msgBuff,
      new Buffer.from([
        (checksum >> 0) & 0xFF,
        (checksum >> 8) & 0xFF,
        (checksum >> 16) & 0xFF,
        (checksum >> 24) & 0xFF,
      ])
    ])
  }

  if(channel.compat)
    netchanEncode(msg[1], channel)

  msgBuff = Buffer.concat([
    msgBuff,
    msg[1]
  ])

  channel.outgoingSequence++
  await udpSend(msgBuff, port, dstIP)
}

async function sendReliable(address, port, cmd) {
  var dstIP = await lookupDNS(address)
  var channel = mergeMaster({
    ip: dstIP,
    port: port
  }).channel
  if(typeof channel != 'undefined') {
    console.log('clientCommand: ', cmd)
  	channel.reliableSequence++
    var index = channel.reliableSequence & ( MAX_RELIABLE_COMMANDS - 1 )
    channel.reliableCommands[index] = cmd
    await sendSequence(address, port, channel)
  } else
    console.log('Not connected')
}

module.exports = {
  sendSequence,
  sendReliable
}
