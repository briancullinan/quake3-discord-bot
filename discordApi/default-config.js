var fs = require('fs')
var path = require('path')

var DEFAULT_GUILD = process.env.DEFAULT_GUILD || '393252386426191873'
var DEFAULT_CHANNEL = process.env.DEFAULT_CHANNEL || '393252386426191875' // 366715821654933515
var DEFAULT_APPLICATION = process.env.DEFAULT_APPLICATION || '723583889779589221'
var DEFAULT_API = process.env.DEFAULT_API || 'https://discord.com/api/v9/'
var MESSAGE_TIME = process.env.DEFAULT_TIME || 1000 * 60 * 2 // * 60 // 2 minutes to respond
var DEFAULT_RATE = 1000 / 50 // from discord documentation
var PROFILE_PATH = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
var DEFAULT_USERNAME = 'Orbb'
var MESSAGES_START = 1420070400000

var tokenPath
if(fs.existsSync('./discord-bot.txt')) {
  tokenPath = path.resolve('./discord-bot.txt')
} else {
  tokenPath = path.join(PROFILE_PATH, '.credentials/discord-bot.txt')
}
var TOKEN = fs.readFileSync(tokenPath).toString('utf-8').trim()

module.exports = {
  DEFAULT_GUILD,
  DEFAULT_CHANNEL,
  DEFAULT_APPLICATION,
  DEFAULT_API,
  MESSAGE_TIME,
  DEFAULT_RATE,
  PROFILE_PATH,
  TOKEN,
  DEFAULT_USERNAME,
  MESSAGES_START
}
