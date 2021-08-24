
function getServersResponse(m) {
    var masters = []
    m = m.slice('getserversResponse'.length)
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

function parseConfigStr(m) {
    return m.toString('utf-8')
        .trim().split(/\n/ig)[0]
        .trim().split(/\\/ig).slice(1)
        .reduce((obj, c, i, arr) => {
            if(i & 1) {
                obj[arr[i-1].toLowerCase()] = c
                obj[arr[i-1]] = c
            }
            return obj
        }, {})
}

function statusResponse(m) {
    m = m.slice('statusResponse'.length)
    var status = parseConfigStr(m)
    var players = m.toString('utf-8')
        .trim().split(/\n/ig)
        .slice(1)
        .reduce((obj, c, i, arr) => {
            if(c.trim().length == 0)
                return obj
            var player = {
                'i': (i + 1),
                'name': (/[0-9]+\s+[0-9]+\s+"(.*)"/ig).exec(c)[1],
                'score': (/([0-9]+)\s+/ig).exec(c)[1],
                'ping': (/[0-9]+\s+([0-9]+)\s+/ig).exec(c)[1],
            }
            player.isBot = player.ping == 0
            obj.push(player)
            return obj
        }, [])
    return Object.assign(status, {players})
}

function infoResponse(m) {
    m = m.slice('infoResponse'.length)
    return parseConfigStr(m)
}

module.exports = {
    getServersResponse,
    statusResponse,
    infoResponse,
    parseConfigStr,
}
