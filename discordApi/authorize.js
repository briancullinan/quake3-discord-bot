var {request} = require('gaxios')
var WebSocket = require('ws')
var {
  gatewayIdentified, gatewayClose, gatewayMessage
} = require('./gateway.js')
var {TOKEN, DEFAULT_API} = require('./default-config.js')

var ws = false
var wsConnecting = false
var previousRequest = 0

async function delay() {
  var now = (new Date()).getTime()
  previousRequest = now
  if(now - previousRequest < DEFAULT_RATE)
    await new Promise(resolve => setTimeout(resolve, DEFAULT_RATE - (now - previousRequest)))
  previousRequest = (new Date()).getTime()
}

async function requestAuthQ(outgoing) {
  await authorizeGateway()
  if(typeof outgoing.headers == 'undefined')
    outgoing.headers = {}
  outgoing.headers['Authorization'] = `Bot ${TOKEN}`
  outgoing.url = DEFAULT_API + outgoing.url
  await delay()
  var result = await request(outgoing)
  // TODO: check result for rate limit and re-run this request in a queue
  return result.data
}

async function gatewayUrl() {
  // TODO: return the same result if queried less than 1 second ago
  return await request({
    method: 'GET',
    url: `gateway/bot`
  })
}

function gatewayOpen() {
  console.log('Connecting to Discord')
}

async function authorizeGateway() {
  var result
  if(wsConnecting) {
    await gatewayIdentified()
  }
  if(typeof ws == 'object' && ws.identified == 1)
    return // already connected, no need to continue
  wsConnecting = true
  try {
    result = await authorizeUrl()
  } catch (e) {
    console.log(e.message)
    ws = false
    wsConnecting = false
    return
  }
  ws = new WebSocket(result.url)
  ws.identified = false
  ws.on('open', gatewayOpen)
  ws.on('message', gatewayMessage.bind(null, ws, authorizeGateway))
  ws.on('close', gatewayClose.bind(null, ws))
  await gatewayIdentified(ws)
  wsConnecting = false
  return ws
}

function closeGateway() {
  gatewayClose(ws)
}

module.exports = {
  request: requestAuthQ,
  gatewayUrl,
  closeGateway
}
