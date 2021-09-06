var lookupDNS = require('../utilities/dns.js')
var {connectionlessEvent} = require('./parse-connectionless.js')
var {serverMessageEvent} = require('./parse-server.js')
var {mergeMaster} = require('./parse-packet.js')

var RESPONSE_INTERVAL = 20
var MAX_TIMEOUT = process.env.DEFAULT_TIMEOUT || 10000
var responses = {}

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

module.exports = nextResponse
