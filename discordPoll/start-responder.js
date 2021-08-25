var respondCommand = importer.import('respond discord commands')
var monitorServer = importer.import('monitor q3 servers')
var spectateServer = importer.import('spectate q3 server')

var DEFAULT_CHANNEL = process.env.DEFAULT_CHANNEL || 'general'

serverList.forEach(async (s) => {
  var address = s.split(':')[0]
  var port = parseInt(s.split(':')[1] || '27960')
  await monitorServer(address, port)
  //await spectateServer(address, port)
})

var stillRunning = false
var commandResponder
async function startResponder() {
  if(stillRunning) {
    console.log('Still running...')
    return
  }
  stillRunning = true
  try {
    await respondCommand(DEFAULT_CHANNEL)
    await respondCommand('@me')
  } catch (e) {
    console.log(e)
  }
  stillRunning = false
  if(!commandResponder)
    commandResponder = setInterval(startResponder, 5000)
}

module.exports = startResponder
