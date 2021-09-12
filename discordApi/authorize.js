var {request} = require('gaxios')
var WebSocket = require('ws')
var {delay, wait} = require('../utilities/timeout-delay.js')
var {
  gatewayIdentified, gatewayClose, gatewayMessage
} = require('../discordApi/gateway.js')
var {
  TOKEN, DEFAULT_API, DEFAULT_RATE
} = require('../discordApi/default-config.js')

var ws = false
var wsConnecting = false
var previousRequest = 0

async function requestAuthQ(outgoing) {
  await authorizeGateway()
  if(typeof outgoing.headers == 'undefined')
    outgoing.headers = {}
  outgoing.headers['Authorization'] = `Bot ${TOKEN}`
  outgoing.url = DEFAULT_API + outgoing.url
  previousRequest = await delay(previousRequest, DEFAULT_RATE)
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
  if(wsConnecting) {
    var result = await wait(() => ws && ws.identified, 3000)
    if(!result)
      return await authorizeGateway()
    else
      return ws
  } else if (ws && ws.readyState == 1 && ws.identified) {
    return ws
  }
  wsConnecting = true
  try {
    ws = new WebSocket((await gatewayUrl()).url)
    ws.identified = false
  } catch (e) {
    console.log('Authorize error', e.message)
    ws = false
    wsConnecting = false
    return
  }
  ws.on('open', gatewayOpen)
  ws.on('message', gatewayMessage.bind(null, ws, authorizeGateway))
  ws.on('close', gatewayClose.bind(null, ws))
  await wait(() => ws.identified, 3000)
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
