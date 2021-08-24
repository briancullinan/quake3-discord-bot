var fs = require('fs')
var path = require('path')
var WebSocket = require('ws')
var {request} = require('gaxios')
var importer = require('../Core')
var {authorizeUrl, interactionResponse} = importer.import('discord api')
var PROFILE_PATH = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
var tokenPath
if(fs.existsSync('./discord-bot.txt')) {
    tokenPath = path.resolve('./discord-bot.txt')
} else {
    tokenPath = path.join(PROFILE_PATH, '.credentials/discord-bot.txt')
}
var token = fs.readFileSync(tokenPath).toString('utf-8').trim()

async function authorizeUrl() {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}gateway/bot`
    })
    return result.data
}

var DEFAULT_API = process.env.DEFAULT_API || 'https://discord.com/api/v6/'

var heartbeat
var ws = false
var wsConnecting = false
var cancelConnection
var seq = 0
var privateChannels = {}
var interactions = {}
var shouldReconnect = false

function sendHeartbeat() {
    if(!ws) return
    console.log('Sending heartbeat')
    ws.send(JSON.stringify({
        op: 1,
        d: seq
    }))
    cancelConnection = setTimeout(() => ws ? ws.close() : false, 4000)
}

async function authorizeGateway() {
    var result
    if(wsConnecting) {
        await new Promise(resolve => {
            var authorizeWait
            var authorizeCount = 0
            authorizeWait = setInterval(() => {
                if(typeof ws == 'object' &&
                    ws.readyState == 1
                    || authorizeCount == 30) {
                    clearInterval(authorizeWait)
                    resolve()
                } else {
                    authorizeCount++
                }
            }, 100)
        })
    }
    if(typeof ws == 'object' && ws.readyState == 1)
        return // already connected, no need to continue
    wsConnecting = true
    try {
        result = await authorizeUrl()
    } catch (e) {
        console.log(e.message)
        ws = false
        return
    }
    ws = new WebSocket(result.url)
    await new Promise(resolve => {
        ws.on('open', () => {
            wsConnecting = false
            shouldReconnect = false
            console.log('Connecting to Discord')
            resolve()
        })
    })
    var identified = false
    ws.on('message', (message) => {
        var msgBuff = new Buffer.from(message)
        var gateway = JSON.parse(msgBuff.toString('utf-8'))
        if(gateway.s) seq = gateway.s
        if(gateway.d && gateway.d.seq) seq = gateway.d.seq
        if(gateway.op == 10) {
            heartbeat = setInterval(sendHeartbeat, gateway.d.heartbeat_interval)
            ws.send(JSON.stringify({
                op: 2,
                intents: ['DIRECT_MESSAGES', 'GUILD_MESSAGES', 'GUILDS'],
                d: {
                    token: token,
                    properties: {
                        "$os": "linux",
                        "$browser": "jupyter",
                        "$device": "quake3"
                    }
                }
            }))
            return
        } else if (gateway.op === 7) {
            shouldReconnect = true
            return
        } else if (gateway.op === 0 || gateway.op === 9) {
            identified = true
            if(gateway.t == 'MESSAGE_CREATE' 
                // guild ID can only be null if it is a personal message
                && typeof gateway.d.guild_id == 'undefined') {
                console.log(gateway)
                privateChannels[gateway.d.channel_id] = Date.now()
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
        console.log(gateway)
    })
    var timer
    ws.on('close', () => {
        console.log('Discord disconnected')
        if(timer) clearInterval(timer)
        clearInterval(heartbeat)
        ws.close()
        ws = false
        if(shouldReconnect)
            setTimeout(authorizeGateway, 1000)
        return
    })
    await new Promise(resolve => {
        timer = setInterval(() => {
            if(identified) {
                clearInterval(timer)
                resolve()
            }
        }, 1000)
    });
    return ws
}

module.exports = {
    authorizeGateway,
    privateChannels,
    interactions
}
