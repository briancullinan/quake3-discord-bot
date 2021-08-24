var fs = require('fs')
var huffman = fs.readFileSync('./huffman_js.wasm')
//var Huffman = require('/Users/briancullinan/planet_quake/code/xquakejs/lib/huffman.js')
var Huff_Compress
var Huff_Decompress
var HuffmanGetBit
var HuffmanGetSymbol
var isInit = false

var MAX_MSGLEN = 16384
var buffer
var memory


// negative bit values include signs
function writeBits( msgBytes, offset, value, bits ) {
    var base = 8192 * 12
    var bitIndex = offset
    var nbits = bits&7

	if ( bits < 0 ) {
		bits = -bits
	}
    for(var j = 0; j < MAX_MSGLEN; j++) {
        if(j < msgBytes.length)
            memory[base + j] = msgBytes[j] & 0xFF
        else
            memory[base + j] = 0
    }

    value &= (0xffffffff>>(32-bits))
    if ( nbits ) {
        for ( var i = 0; i < nbits ; i++ ) {
            HuffmanPutBit( base, bitIndex, (value & 1) )
            bitIndex++
            value = (value>>1)
        }
        bits = bits - nbits
    }
    if ( bits ) {
        for( var i = 0 ; i < bits ; i += 8 ) {
            bitIndex += HuffmanPutSymbol( base, bitIndex, (value & 0xFF) )
            value = (value>>8)
        }
    }
    return [bitIndex, memory.slice(base, base + (bitIndex>>3)+1)]
}


function readBits(m, offset, bits = 8) {
    var base = 8192 * 12
    var value
    var nbits = bits & 7
    var sym = base - 4
    var bitIndex = offset
    for(var i = 0; i < m.length; i++)
        memory[base + i] = m[i]
    if ( nbits )
    {
        for ( i = 0; i < nbits; i++ ) {
            value |= HuffmanGetBit( base, bitIndex ) << i
            bitIndex++
        }
        bits -= nbits
    }
    if ( bits )
    {
        for ( i = 0; i < bits; i += 8 )
        {
            bitIndex += HuffmanGetSymbol( sym, base, bitIndex )
            value |= ( memory[sym] << (i+nbits) )
        }
    }
    return [bitIndex, value]
}

async function decompressMessage(message, offset) {
    if(!isInit)
        await init()
    if(typeof message == 'string')
        message = message.split('')
    for(var i = 0; i < message.length; i++)
        Huffman.HEAP8[msgData+i] = c
	Huffman.HEAP32[(msg>>2)+5] = message.length
	Huffman._Huff_Decompress( msg, 12 )
	return Huffman.HEAP8.slice(msgData + offset, msgData + Huffman.HEAP32[(msg>>2)+5])
}

async function compressMessage(message) {
    var msg = 8192 * 12
    var msgStart = (msg + 64)
    if(!isInit)
        await init()
    for(var i = msg; i < msgStart + message.length; i++)
    {
        memory[i] = 0
    }
    memory[msg + 12] = msgStart & 255
    memory[msg + 13] = (msgStart >> 8) & 255
    memory[msg + 14] = (msgStart >> 16) & 255
    memory[msg + 15] = (msgStart >> 24) & 255
    memory[msg + 20] = (message.length + 1) & 255
    memory[msg + 21] = ((message.length + 1) >> 8) & 255
    memory[msg + 22] = 0
    memory[msg + 23] = 0

    if(typeof message == 'string')
        message = message.split('')
    for(var i = 0; i < message.length; i++)
        memory[msgStart + i] = message[i].charCodeAt(0)
    memory[msgStart + message.length] = 0

    Huff_Compress(msg, 12)
    var msgLength = (memory[msg + 21] << 8) + memory[msg + 20]
    var compressed = memory.slice(msgStart, msgStart + msgLength)
    return compressed
}

async function init() {
    var binary = new Uint8Array(huffman)
    let imports = {};
    imports['memory'] = new WebAssembly['Memory']( {'initial': 16, 'maximum': 100} )
    memory = new Uint8Array( imports['memory']['buffer'] )
    let program = await WebAssembly.instantiate(binary, { env: imports })
    Huff_Compress = program.instance.exports.Huff_Compress
    Huff_Decompress = program.instance.exports.Huff_Decompress
    HuffmanGetBit = program.instance.exports.HuffmanGetBit
    HuffmanGetSymbol = program.instance.exports.HuffmanGetSymbol
    HuffmanPutBit = program.instance.exports.HuffmanPutBit
    HuffmanPutSymbol = program.instance.exports.HuffmanPutSymbol
}

init()

module.exports = init
Object.assign(init, {
    readBits,
    writeBits,
    decompressMessage,
    compressMessage
})
