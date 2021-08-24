var fs = require('fs')
var path = require('path')
var {request} = require('gaxios')
var PROFILE_PATH = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
var credentials
var tokenPath
if(fs.existsSync('./discord-bot.txt')) {
    tokenPath = path.resolve('./discord-bot.txt')
} else {
    tokenPath = path.join(PROFILE_PATH, '.credentials/discord-bot.txt')
}
var token = fs.readFileSync(tokenPath).toString('utf-8').trim()

var DEFAULT_GUILD = process.env.DEFAULT_GUILD || '393252386426191873'
var DEFAULT_CHANNEL = process.env.DEFAULT_CHANNEL || '393252386426191875'
var DEFAULT_APPLICATION = process.env.DEFAULT_APPLICATION || '723583889779589221'
var DEFAULT_API = process.env.DEFAULT_API || 'https://discord.com/api/v8/'
var MESSAGE_TIME = process.env.DEFAULT_TIME || 1000 * 60 * 60 // 1 hour to respond
var DEFAULT_RATE = 1000 / 50 // from discord documentation
var previousRequest = 0


async function delay() {
    var now = (new Date()).getTime()
    previousRequest = now
    if(now - previousRequest < DEFAULT_RATE)
        await new Promise(resolve => setTimeout(resolve, DEFAULT_RATE - (now - previousRequest)))
    previousRequest = (new Date()).getTime()
}

async function triggerTyping(channelId = DEFAULT_CHANNEL) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'POST',
        url: `${DEFAULT_API}channels/${channelId}/typing`
    })
    return result.data
}

module.exports = {
    authorizeUrl,
    userGuilds,
    userChannels,
    userConnections,
    guildChannels,
    getGuildRoles,
    channelMessages,
    triggerTyping,
    createMessage,
    updateMessage,
    registerCommand,
    getCommands,
    interactionResponse,
    updateInteraction,
    createThread,
    archivedThreads,
    activeThreads,
    deleteCommand,
    getPins,
    pinMessage,
    unpinMessage
}
