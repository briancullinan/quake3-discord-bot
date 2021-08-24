var dns = require('dns')
var _dnsLookup = {}

async function lookupDNS(address) {
  if(typeof _dnsLookup[address] != 'undefined')
    return _dnsLookup[address]
  return new Promise((resolve, reject) => dns.lookup(address, function(err, dstIP) {
    if(err) {
      return reject(err)
    }
    _dnsLookup[address] = dstIP
    return resolve(dstIP)
  }))
}

module.exports = lookupDNS
