var {readBits} = importer.import('huffman decode')
var {parseConfigStr} = importer.import('quake 3 server responses')

var BIG_INFO_STRING = 8192
var MAX_STRING_CHARS = 1024
var MAX_PACKETLEN = 1400
var FRAGMENT_SIZE = (MAX_PACKETLEN - 100)
var MAX_MSGLEN = 16384
var FLOAT_INT_BITS = 13
var FLOAT_INT_BIAS = (1<<(FLOAT_INT_BITS-1))
var	CS_SERVERINFO = 0 // an info string with all the serverinfo cvars
var CS_SYSTEMINFO = 1 // an info string for server system to client system configuration (timescale, etc)
var MAX_RELIABLE_COMMANDS = 64
var GENTITYNUM_BITS = 10
var MAX_POWERUPS = 16


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

var entityStateFields = [
    32, //  NETF(pos.trTime)
    0, //  NETF(pos.trBase[0])
    0, //  NETF(pos.trBase[1])
    0, //  NETF(pos.trDelta[0])
    0, //  NETF(pos.trDelta[1])
    0, //  NETF(pos.trBase[2])
    0, //  NETF(apos.trBase[1])
    0, //  NETF(pos.trDelta[2])
    0, //  NETF(apos.trBase[0])
    10, //  NETF(event)
    0, //  NETF(angles2[1])
    8, //  NETF(eType)
    8, //  NETF(torsoAnim)
    8, //  NETF(eventParm)
    8, //  NETF(legsAnim)
    GENTITYNUM_BITS, //  NETF(groundEntityNum)
    8, //  NETF(pos.trType)
    19, //  NETF(eFlags)
    GENTITYNUM_BITS, //  NETF(otherEntityNum)
    8, //  NETF(weapon)
    8, //  NETF(clientNum)
    0, //  NETF(angles[1])
    32, //  NETF(pos.trDuration)
    8, //  NETF(apos.trType)
    0, //  NETF(origin[0])
    0, //  NETF(origin[1])
    0, //  NETF(origin[2])
    24, //  NETF(solid)
    MAX_POWERUPS, //  NETF(powerups)
    8, //  NETF(modelindex)
    GENTITYNUM_BITS, //  NETF(otherEntityNum2)
    8, //  NETF(loopSound)
    8, //  NETF(generic1)
    0, //  NETF(origin2[2])
    0, //  NETF(origin2[0])
    0, //  NETF(origin2[1])
    8, //  NETF(modelindex2)
    0, //  NETF(angles[0])
    32, //  NETF(time)
    32, //  NETF(apos.trTime)
    32, //  NETF(apos.trDuration)
    0, //  NETF(apos.trBase[2])
    0, //  NETF(apos.trDelta[0])
    0, //  NETF(apos.trDelta[1])
    0, //  NETF(apos.trDelta[2])
    32, //  NETF(time2)
    0, //  NETF(angles[2])
    0, //  NETF(angles2[0])
    0, //  NETF(angles2[2])
    32, //  NETF(constantLight)
    16, //  NETF(frame)
]

async function decodeClientMessage(message, channel) {
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

        // TODO: implement fragment and only return on final message
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

        // make sure the message sequence is still there
        message = Buffer.concat([
            new Uint8Array(4),
            Buffer.from(channel.fragmentBuffer)
        ])
        read = 32
        channel.fragmentBuffer = Buffer.from([])
        channel.fragmentLength = 0
    }

    channel.serverSequence = sequence
    // finished parsing header

    // get the reliable sequence acknowledge number
    read = readBits(message, read, 32)
    channel.reliableAcknowledge = read[1]
	if ( channel.reliableAcknowledge < channel.reliableSequence - MAX_RELIABLE_COMMANDS ) {
		channel.reliableAcknowledge = channel.reliableSequence
	}

    // parse the message
    while(true) {
        read = readBits(message, read[0], 8)
        var cmd = read[1]

        if ( cmd == 8 ) { // svc_EOF
            break;
        }

        channel.messageType = cmd
        switch(cmd) {
            default:
                console.log('Illegible server message', cmd)
            break
            case 0: // svc_bad
            break
            case 1: // svc_nop
            break
            case 2: // svc_gamestate
                read = readBits(message, read[0], 32)
                channel.commandSequence = read[1]
                while(true) {
                    read = readBits(message, read[0], 8)
                    if(read[1] == 8)  // svc_EOF
                        break

                    switch(read[1]) {
                        default: 
                            console.log('Bad command byte')
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
                            var number = read[1]

                            // delta entity
                            
                            // check for a remove
                            read = readBits(message, read[0], 1)
                            if(read[1] == 1) { // remove
                                delete channel.entities[number]
                                break
                            }
                            
                            // check for no delta
                            read = readBits(message, read[0], 1)
                            if(read[1] == 0) { // no delta
                                if(typeof channel.entities[number] == 'undefined')
                                    channel.entities[number] = 0
                                break
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
                channel.serverId = channel.systemInfo['sv_serverid']
                channel.isPure = channel.systemInfo['sv_pure'] == '1'

            break
            case 3: // svc_configstring
            break
            case 4: // svc_baseline
            break
            case 5: // svc_serverCommand
                if(typeof channel.serverCommands == 'undefined')
                    channel.serverCommands = []
                read = readBits(message, read[0], 32)
                var seq = read[1]
                channel.commandSequence = seq
                var index = seq & (MAX_RELIABLE_COMMANDS-1)
                read = ReadString(read, message)
                channel.serverCommands[index] = read[1]
            break
            case 6: // svc_download
            break
            case 7: // svc_snapshot
                // begin sending input messages so we can receive a gamestate
                //   all this does is echo the ACK number back to the server
                // TODO: properly parse snapshot and read XYZ locations
                /*
                
                // read delta playerstate
                read = readBits(message, read[0], 1)
                if(read[1] == 1) {

                    // parse stats
                    read = readBits(message, read[0], 1)
                    if(read[1] == 1) {
                        bits = MSG_ReadBits (msg, MAX_STATS);

                        for (i=0 ; i<MAX_STATS ; i++) {
                            if (bits & (1<<i) ) {
                                to->stats[i] = MSG_ReadShort(msg);
                            }
                        }
                    }
                }

    if ( MSG_ReadBits( msg, 1 ) ) {
        LOG("PS_STATS");
    }

    // parse persistant stats
    if ( MSG_ReadBits( msg, 1 ) ) {
        LOG("PS_PERSISTANT");
        bits = MSG_ReadBits (msg, MAX_PERSISTANT);
        for (i=0 ; i<MAX_PERSISTANT ; i++) {
            if (bits & (1<<i) ) {
                to->persistant[i] = MSG_ReadShort(msg);
            }
        }
    }

    // parse ammo
    if ( MSG_ReadBits( msg, 1 ) ) {
        LOG("PS_AMMO");
        bits = MSG_ReadBits (msg, MAX_WEAPONS);
        for (i=0 ; i<MAX_WEAPONS ; i++) {
            if (bits & (1<<i) ) {
                to->ammo[i] = MSG_ReadShort(msg);
            }
        }
    }

    // parse powerups
    if ( MSG_ReadBits( msg, 1 ) ) {
        LOG("PS_POWERUPS");
        bits = MSG_ReadBits (msg, MAX_POWERUPS);
        for (i=0 ; i<MAX_POWERUPS ; i++) {
            if (bits & (1<<i) ) {
                to->powerups[i] = MSG_ReadLong(msg);
            }
        }
    }
}
*/
                return channel
            break
            case 9: // svc_voipSpeex
            break
            case 10: // svc_voipOpus
            break
            case 16: // svc_multiview
            break
            case 17: // svc_zcmd
            break
        }
    }
    return channel
}

module.exports = decodeClientMessage
