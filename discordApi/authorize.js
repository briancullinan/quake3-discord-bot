var {request} = require('gaxios')
var WebSocket = require('ws')
var {
  gatewayIdentified, gatewayClose, gatewayMessage
} = require('./gateway.js')
var {
  TOKEN, DEFAULT_API, DEFAULT_RATE
} = require('./default-config.js')

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
  var resolveRequest
  resolveRequest = async () => {
    var result
    try {
      result = (await request(outgoing)).data
    } catch (e) {
      // check result for rate limit and re-run this request in a queue
      if(e.code == 429) {
        result = await new Promise(resolve => setTimeout(() => {
          resolve(resolveRequest())
        }, e.response.data.retry_after * 1000))
      } else {
        throw e
      }
    }
    return result
  }
  return await resolveRequest()
}

async function gatewayUrl() {
  // TODO: return the same result if queried less than 1 second ago
  // doesn't use requestAuthQ because that would create an infinite loop
  var result = await request({
    headers: {
      'Authorization': `Bot ${TOKEN}`
    },
    method: 'GET',
    url: `${DEFAULT_API}gateway/bot`
  })
  return result.data
}

function gatewayOpen() {
  console.log('Connecting to Discord')
}

async function authorizeGateway() {
  var result
  if(wsConnecting) {
    await gatewayIdentified()
  }
  if(typeof ws == 'object' && ws.identified)
    return // already connected, no need to continue
  wsConnecting = true
  try {
    result = await gatewayUrl()
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
  authorizeGateway,
  request: requestAuthQ,
  gatewayUrl,
  closeGateway
}
