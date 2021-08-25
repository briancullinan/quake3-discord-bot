var {getServers, sendRcon, udpClient} = require('../quake3Api')

async function testRcon (command) {
  var masters = await getServers(void 0, void 0, false)
  console.log(masters)
  var result = await sendRcon(masters[0].ip, masters[0].port, command)
  console.log(result)
  udpClient.close()
}

module.exports = testRcon
