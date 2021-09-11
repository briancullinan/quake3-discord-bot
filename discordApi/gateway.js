var {TOKEN} = require('./default-config.js')

var indentifyTimer
var globalWS = null
var privateChannels = {}
var interactions = {}
var cancelConnection // if gateway doesn't respond properly, close web socket
var heartbeat
var seq = 0

function sendHeartbeat(ws) {
  if(!ws) return
  console.log('Sending heartbeat')
  ws.send(JSON.stringify({
    op: 1,
    d: seq
  }))
  cancelConnection = setTimeout(gatewayClose.bind(null, ws), 4000)
}

function gatewayMessage(ws, reconnectGateway, message) {
  var msgBuff = new Buffer.from(message)
  var gateway = JSON.parse(msgBuff.toString('utf-8'))
  if(gateway.s) seq = gateway.s
  if(gateway.d && gateway.d.seq) seq = gateway.d.seq
  console.log('Gateway message', gateway)
  if(gateway.op == 10) {
    ws.identified = true
    heartbeat = setInterval(sendHeartbeat.bind(null, ws), gateway.d.heartbeat_interval)
    ws.send(JSON.stringify({
      op: 2,
      intents: [
        'DIRECT_MESSAGES', 'DIRECT_MESSAGE_REACTIONS', 
        'GUILD_MESSAGES', 'GUILD_MESSAGE_REACTIONS', 
        'GUILDS', 'THREAD_UPDATE', 'THREAD_CREATE',
        'THREAD_DELETE', 'THREAD_LIST_SYNC', 'THREAD_MEMBER_UPDATE',
        'THREAD_MEMBERS_UPDATE', 'MESSAGE_CREATE', 'MESSAGE_UPDATE',
        'GUILD_PRESENCES',
      ],
      d: {
        token: TOKEN,
        properties: {
          "$os": "linux",
          "$browser": "nodejs",
          "$device": "quake3"
        }
      }
    }))
    return
  } else if (gateway.op === 7) {
    console.log('Reconnecting...')
    gatewayClose(ws)
    setTimeout(reconnectGateway, 1000)
    return
  } else if (gateway.op === 0 || gateway.op === 9) {
    if(gateway.t == 'MESSAGE_CREATE') {
      // guild ID can only be null if it is a personal message
      if(typeof gateway.d.guild_id == 'undefined') {
        privateChannels[gateway.d.channel_id] = Date.now()
      } else {
      }
    }
    if(gateway.t == 'INTERACTION_CREATE') {
      if(typeof interactions[gateway.d.channel_id] == 'undefined')
        interactions[gateway.d.channel_id] = []
      interactions[gateway.d.channel_id].push(gateway.d)
      interactionResponse(gateway.d.id, gateway.d.token)
    }
    return
  } else if (gateway.op === 11) {
    clearTimeout(cancelConnection)
    return
  }
  console.log('Unrecognized gateway', gateway)
}

function gatewayClose(ws) {
  console.log('Discord disconnected')
  if(indentifyTimer)
    clearInterval(indentifyTimer)
  if(heartbeat)
    clearInterval(heartbeat)
  if(ws.readyState == 1)
    ws.close()
  ws.identified = false
  globalWS = false
  return
}

async function gatewayIdentified(ws) {
  var identifyCount = 0
  if(ws)
    globalWS = ws
  await new Promise(resolve => {
    indentifyTimer = setInterval(() => {
      if((ws && ws.identified)
        || (globalWS && globalWS.identified)
        || identifyCount == 30) {
        clearInterval(indentifyTimer)
        resolve()
      } else {
        identifyCount++
      }
    }, 100)
  })
}

module.exports = {
  gatewayClose,
  gatewayMessage,
  gatewayIdentified,
  privateChannels,
  interactions
}
