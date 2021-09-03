var {interactions} = require('../discordApi/gateway.js')

// converts an interaction into the same format as a message command
async function readInteractions() {
  var commands = []

  // find all commands in interactions
  var interactionsCount = Object.keys(interactions)
    .reduce((sum, i) => {return sum + interactions[i].length}, 0)
  console.log(`Reading ${Object.keys(interactions).length} channels with ${interactionsCount} interactions`)
  Object.keys(interactions).forEach(i => {
    for(var c in interactions[i]) {
      interactions[i][c].commands = [interactions[i][c].data.name.toUpperCase()]
      interactions[i][c].author = interactions[i][c].member.user
      interactions[i][c].content = interactions[i][c].data.name + ' '
        + (interactions[i][c].data.options || []).map(o => o.value).join(' ')
      interactions[i][c].interaction = true
      commands.push(interactions[i][c])
    }
    interactions[i] = []
  })

  return commands
}

module.exports = readInteractions
