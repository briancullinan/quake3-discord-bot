var {sendReliable} = require('../quake3Api')
var {updateThread} = require('../discordPoll/update-channel.js')
var removeCtrlChars = require('../quake3Utils/remove-ctrl.js')
var saveMatch = require('../quake3Utils/match-db.js')
var {
  MAX_RELIABLE_COMMANDS, CS_PLAYERS
} = require('../quake3Api/config-strings.js')
var {DEFAULT_USERNAME} = require('../discordApi')


function checkServerCommands(commandNumber, threadName, discordChannel, server) {
  // forward print commands to discord
  if(commandNumber >= server.channel.commandSequence)
    return // nothing to do

  for(var j = commandNumber + 1; j <= server.channel.commandSequence; j++) {
    var index = j & (MAX_RELIABLE_COMMANDS-1)
    var message = server.channel.serverCommands[index] + ''
    if(message.match(/^chat /i) /* || (message).match(/^print /i) */) {
      console.log(server.ip + ':' + server.port + ' ---> ', message)
      message = removeCtrlChars((/"([^"]*?)"/).exec(message)[1])
      if(message.length == 0 
        || message.substr(0, DEFAULT_USERNAME.length + 1) == DEFAULT_USERNAME + ':')
        continue
      if(discordChannel)
        Promise.resolve(updateThread(threadName, discordChannel, message))
    } else if (message.match(/^cs [0-9]+ /i)
      || message.match(/^scores /i)) {
      // switch teams back to spectater in case automatically joined 
      //   on map change or something
      if(message.includes('cs ' + (CS_PLAYERS + server.channel.clientNum))
        && Date.now() - teamChanged > 30 * 1000) {
        Promise.resolve(sendReliable(server.ip, server.port, 'team s'))
        teamChanged = Date.now()
      }
      if(!server.channel.serverId)
        continue
      saveMatch(server)
    } else {
      console.log('Unrecognized', message)
    }
  }
}

module.exports = checkServerCommands
