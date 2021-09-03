var {DISCORD_COMMANDS} = require('./cmd-definitions.js')
var formatMap = require('../quake3Utils/format-map.js')
var {tokenSearch} = require('../utilities/map-search.js')

async function searchCommand(command) {
  var options = DISCORD_COMMANDS.SEARCH.exec(command.content)
  var response = tokenSearch(options[1].trim())
  if(response.length == 0)
    return 'No search results.'
  return formatMap(response[0].item)
}

module.exports = searchCommand
