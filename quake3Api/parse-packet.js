var {connectionlessPacket} = require('../quake3Api/parse-connectionless.js')
var {parseServerMessage} = require('../quake3Api/parse-server.js')
var {netchanProcess, netchanDecode} = require('../quake3Api/parse-netchan.js')

var masters = []

function mergeMaster(master) {
  var found = false
  masters.forEach((ma, i) => {
    if((ma['ip'] == master['ip']
      || ma['domain'] == master['domain'])
      && ma['port'] == master['port']) {
      found = masters[i]
      Object.assign(masters[i], master)
      Object.assign(master, masters[i])
      return false
    }
  })
  if(!found) {
    masters.push(master)
    return master
  }
  return found
}

async function packetEvent(m, rinfo) {
  var master = mergeMaster({
    ip: rinfo.address,
    port: rinfo.port
  })
  if(m[0] == 255 && m[1] == 255 && m[2] == 255 && m[3] == 255) {
    m = m.slice(4, m.length)
    var data = connectionlessPacket(m, master)
    if(data)
      mergeMaster(Object.assign(data, {
        ip: rinfo.address,
        port: rinfo.port
      }))
  } else {
    if(!master.connected) {
      console.log("Sequenced packet without connection")
      return
    }
    master.channel = master.channel || {}
    var read = netchanProcess(m, master.channel)
    if(read === false) return // fragment message, do nothing more
    if(read === true && master.channel.fragmentLength) {
      m = master.channel.fragmentBuffer
      master.channel.fragmentBuffer = Buffer.from([])
      master.channel.fragmentLength = 0
    } else {
      m = m.slice(read / 8, m.length)
    }

    if(master.channel.compat)
      netchanDecode(m, master.channel)

    var channel = parseServerMessage(m, master.channel, master)
    //console.log(channel)
    if(channel === false) {
      return
    }
    // always respond with input event
    // response to snapshots automatically and not waiting,
    //   so new messages can be received
    Promise.resolve(sendSequence(rinfo.address, rinfo.port, master.channel))
  }
}

module.exports = {
  packetEvent,
  mergeMaster,
}
