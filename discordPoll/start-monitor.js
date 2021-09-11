var monitorServer = require('../quake3Utils/monitor-servers.js')
var spectateServer = require('../quake3Utils/spectate-servers.js')
var serverList = require('./server-list.js')

async function startMonitor() {
  // TODO: comment the slice out when it is working
  for(var i = 0; i < serverList.length; i++) {
    var address = serverList[i].split(':')[0]
    var port = parseInt(serverList[i].split(':')[1] || '27960')
    await new Promise(resolve => setTimeout(resolve, 100))
    Promise.resolve(monitorServer(address, port))
    Promise.resolve(spectateServer(address, port))
  }
}

module.exports = startMonitor
