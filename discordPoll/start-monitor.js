var monitorServer = require('../quake3Utils/monitor-servers.js')
var spectateServer = require('../quake3Utils/spectate-servers.js')
var serverList = require('./server-list.js')

function startMonitor() {
  // TODO: comment the slice out when it is working
  serverList.slice(0, 3).forEach(async (s) => {
    var address = s.split(':')[0]
    var port = parseInt(s.split(':')[1] || '27960')
    Promise.resolve(monitorServer(address, port))
    Promise.resolve(spectateServer(address, port))
  })
}

module.exports = startMonitor
