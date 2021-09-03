var {readInteractions, respondCommand} = require('../discordCmds')
var readAllCommands = require('./poll-channels.js')
var {authorizeGateway} = require('../discordApi')
//var monitorServer = importer.import('monitor q3 servers')
//var spectateServer = importer.import('spectate q3 server')
var DEFAULT_CHANNEL = process.env.DEFAULT_CHANNEL || 'general'

var stillRunning = false
var commandResponder
async function startResponder() {
  if(stillRunning) {
    console.log('Still running...')
    return
  }
  await authorizeGateway()
  stillRunning = true
  try {
    //var commands = await readAllCommands(DEFAULT_CHANNEL)
    //await respondCommand(commands)
    var commands = await readAllCommands('@me')
    await respondCommand(commands)
    var commands = await readInteractions()
    console.log(commands)
    await respondCommand(commands)
  } catch (e) {
    console.log(e)
  }
  stillRunning = false
  if(!commandResponder)
    commandResponder = setInterval(startResponder, 1000)
}

module.exports = startResponder
