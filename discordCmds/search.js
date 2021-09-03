var path = require('path')
var fs = require('fs')
var Fuse = require('fuse.js')
var {DISCORD_COMMANDS} = require('./cmd-definitions.js')
var {
  triggerTyping, updateInteraction, createMessage
} = require('../discordApi')
var TEMP_DIR = process.env.LVLWORLD || path.join(process.env.HOME || process.env.HOMEPATH 
  || process.env.USERPROFILE || os.tmpdir(), '/quake3-discord-bot/lvlworldDB')
var FUSE_CONFIG = {
    caseSensitive: false,
    findAllMatches: true,
    distance: 50,
    threshold: 0.5,
    tokenize: true,
    shouldSort: true,
    keys: ['zip', 'author', 'includes.bsp', 'includes.title', 'gameMode.0', 'gameMode.1', 'gameMode.2'],
    id: '1'
}
var tokenSearch
var cache = fs.readdirSync(TEMP_DIR)
  .filter(d => d[0] != '.' && d.includes('.json'))
  .reduce((list, d) => {
    var maps = require(path.join(TEMP_DIR, d))
    return list.concat(Object.values(maps))
  }, [])

async function searchCommand(command) {
  var options = DISCORD_COMMANDS.SEARCH.exec(command.content)
  if(!tokenSearch) {
    tokenSearch = new Fuse(cache, FUSE_CONFIG)
  }
  response = tokenSearch.search(options[1])
  console.log(response)

  if(typeof response == 'string')
    response += '\n```BOT'+command.id+'\nbeep boop\n```\n'
  else if(typeof response == 'object')
    response.content = '\n```BOT'+command.id+'\nbeep boop\n```\n'

  if(command.interaction)
    await updateInteraction(response, command.id, command.token)    
  else
    await createMessage(response, command.channel_id)    
}


module.exports = searchCommand
