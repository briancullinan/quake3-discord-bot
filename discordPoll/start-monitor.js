var monitorServer = require('../quake3Utils/monitor-servers.js')
var serverList = require('./server-list.js')

function startMonitor() {
  serverList.forEach(async (s) => {
    var address = s.split(':')[0]
    var port = parseInt(s.split(':')[1] || '27960')
    Promise.resolve(monitorServer(address, port))
    //await spectateServer(address, port)
  })
}

module.exports = startMonitor
