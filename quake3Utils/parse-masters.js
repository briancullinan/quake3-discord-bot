
function parseMasters(m) {
  var masters = []
  for(var i = 0; i < m.length / 7; i++) {
    var ip = i*7+1
    if(m[ip-1] !== '\\'.charCodeAt(0)) continue
    if(m.slice(ip, ip+3) == 'EOT') continue
    var master = {
      ip: m[ip] + '.' + m[ip+1] + '.' + m[ip+2] + '.' + m[ip+3],
      port: (m[ip+4] << 8) + m[ip+5],
    }
    masters.push(master)
  }
  return masters
}

module.exports = parseMasters
