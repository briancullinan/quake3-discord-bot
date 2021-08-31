var lookupDNS = require('../utilities/dns.js')
var {
  connectionlessEvent, connectionlessPacket
} = require('./parse-connectionless.js')
var {
  parseServerMessage, serverMessageEvent,
  netchanProcess
} = require('./parse-server.js')

var MAX_TIMEOUT = process.env.DEFAULT_TIMEOUT || 10000
var responses = {}
var masters = []

function mergeMaster(master) {
  var found = false
  masters.forEach((ma, i) => {
    if((ma['ip'] == master['ip']
      || ma['domain'] == master['domain'])
      && ma['port'] == master['port']) {
      found = masters[i]
      Object.assign(masters[i], master)
      Object.assign(master, masters[i])
      return false
    }
  })
  if(!found) {
    masters.push(master)
    return master
  }
  return found
}

async function packetEvent(m, rinfo) {
  if(m[0] == 255 && m[1] == 255 && m[2] == 255 && m[3] == 255) {
    m = m.slice(4, m.length)
    var data = connectionlessPacket(m)
    mergeMaster(Object.assign(data, {
      ip: rinfo.address,
      port: rinfo.port
    }))
  } else {
    var master = mergeMaster({
      ip: rinfo.address,
      port: rinfo.port
    })
    if(!master.connected) {
      console.log("Sequenced packet without connection")
      return
    }
    var read = netchanProcess(m, master.channel)
    if(read === false) return // fragment message, do nothing more
    if(read === true && master.channel.fragmentLength) {
      m = master.channel.fragmentBuffer
      master.channel.fragmentBuffer = Buffer.from([])
      master.channel.fragmentLength = 0
    } else {
      m = m.slice(read / 8, m.length)
    }
    //console.log(m)
    master.channel = master.channel || {}
    var commandNumber = master.channel.commandSequence
    var channel = parseServerMessage(m, master.channel)
    if(channel === false) {
      return
    }
    //console.log(channel)
    // always respond with input event
    // response to snapshots automatically and not waiting,
    //   so new messages can be received
    Promise.resolve(sendSequence(rinfo.address, rinfo.port, master.channel))
  }
}

var RESPONSE_INTERVAL = 20
async function nextResponse(key, address, port = 27960, isChannel = false) {
  var timeout = 0
  var server
  if(!address) {
    if(isChannel) {
      serverMessageEvent.once(key, (data) => {responses[key] = data})
    } else {
      connectionlessEvent.once(key, (data) => {responses[key] = data})
    }
    server = responses
  } else {
    var dstIP = await lookupDNS(address)
    server = mergeMaster({
        domain: address,
        ip: dstIP,
        port: port
    })
    if(isChannel) {
      if(!server.channel)
        return
      else
        server = server.channel
    }
  }
  // make a copy of the key
  var backup = server[key]
  server[key] = null
  return await new Promise(resolve => {
    var waiter
    waiter = setInterval(() => {
      if(server[key] != null) {
        clearInterval(waiter)
        resolve(server[key])
      } else if (timeout >= MAX_TIMEOUT) {
        // restore old value, but return empty
        server[key] = backup 
        clearInterval(waiter)
        resolve()
      } else {
        timeout += RESPONSE_INTERVAL
      }
    }, RESPONSE_INTERVAL)
  })
}

module.exports = {
  packetEvent,
  mergeMaster,
  nextResponse,
}
