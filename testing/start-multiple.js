var serverList = require('../discordPoll/server-list.js')

function startMultiple() {
  // TODO: comment the slice out when it is working
  serverList.forEach((s) => {
    Promise.resolve(monitorServer(address, port))
  })
}

module.exports = startMultiple
