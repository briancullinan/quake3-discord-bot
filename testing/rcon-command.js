var importer = require('../Core')
var serverApi = importer.import('quake 3 server commands')

async function testRcon (command) {
    var masters = await serverApi.listMasters(void 0, void 0, false)
    console.log(masters)
    await serverApi.sendRcon(masters[0].ip, masters[0].port, command)
    await new Promise(resolve => setTimeout(resolve, 1000))
    serverApi.udpClient.close()
}

module.exports = testRcon
