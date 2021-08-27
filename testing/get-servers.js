var {getServers, sendRcon, udpClose} = require('../quake3Api')

async function listServers (command) {
  var masters = await getServers('master.quake3arena.com', void 0, true)
  console.log(masters)
  udpClose()
}

module.exports = listServers
