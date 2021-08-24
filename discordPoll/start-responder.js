var importer = require('../Core')
var respondCommand = importer.import('respond discord commands')
var monitorServer = importer.import('monitor q3 servers')
var spectateServer = importer.import('spectate q3 server')

var DEFAULT_CHANNEL = process.env.DEFAULT_CHANNEL || 'general'

var serverList = [
    // Defrag
    '83.243.73.220:27961',
    '83.243.73.220:27960',
    '83.243.73.220:27965',
    // Eplus
    '45.32.237.139:27960',
    '45.32.237.139:27000',
    '45.32.237.139:6666',
    '45.32.237.139:6000',
    '173.199.75.8:27963',
    '108.61.122.25:27982',
    '212.187.209.123:27965',
    '79.172.212.116:27970',
    // OSP/baseq3
    '193.33.176.30:27960',
    '85.10.201.6:27960',
    '88.198.221.99:27965',
    '88.198.221.99:27960',
    '88.198.221.98:27962',
    '216.86.155.163:27960',
    '216.86.155.161:27960',
    '216.86.155.173:29676',
    '216.86.155.162:27960',
    '69.30.217.148:27960',
    '69.30.217.148:27960',
    '69.30.217.150:27960',
    '69.30.217.149:27960',
    '212.42.38.88:27960',
    '212.42.38.88:27961',
    '212.42.38.88:27962',
    '212.42.38.88:27963',
    '212.42.38.88:27967',
    '79.142.106.99:27960',
    // CPMA
    '82.196.10.31:27960',
    '45.63.78.66:27970',
    // Msk
    'meat.q3msk.ru:7700',
    'q3msk.ru:27961',
    'q3msk.ru:27962',
    'q3msk.ru:27963',
    'q3msk.ru:27964',
    'q3msk.ru:27965',
    'q3msk.ru:27977',
    'q3msk.ru:27978',
    'tdm.q3msk.ru:27960',
    'ca.q3msk.ru:27960',
    'ca.q3msk.ru:27961',
    'ca.q3msk.ru:27963',
    'pl.q3msk.ru:27962',
    'pl.q3msk.ru:27964',
    'ctf.q3msk.ru:27960',
    'ctf.q3msk.ru:27970',
    'n2.q3msk.ru:29000',
    'q3msk.ru:27980',
    'q3msk.ru:27981',
    'q3msk.ru:27985',
    // QooL7
    'quakearea.com:27960',
    'q3.rofl.it:27960',
]
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
