var fs = require('fs')
var os = require('os')
var path = require('path')
var {request} = require('gaxios')
var METADATA_BASE = 'https://lvlworld.com/metadata/'
var TEMP_DIR = process.env.LVLWORLD || path.join(process.env.HOME || process.env.HOMEPATH 
  || process.env.USERPROFILE || os.tmpdir(), '/quake3-discord-bot/lvlworldDB')


async function downloadAllMeta() {
  var currentYear = (new Date()).getFullYear()
  for(var y = 2004; y <= currentYear; y++) {
    var from = y
    var to = from + 1
    if(fs.existsSync(path.join(TEMP_DIR, from + '.json'))
      && y != currentYear)
      continue
    /*if(y == 1998) {
      from = 1969
      to = 1999
    }*/
    var outgoing = {
      method: 'GET',
      url: `${METADATA_BASE}from:${from}-01-01/to:${to}-01-01/extended`
    }
    var response = await request(outgoing)
    fs.writeFileSync(path.join(TEMP_DIR, from + '.json'), JSON.stringify(response.data, null, 2))
  }
}

module.exports = downloadAllMeta
