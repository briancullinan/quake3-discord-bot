var removeCtrlChars = require('./remove-ctrl.js')

function getThreadName(server) {
  return removeCtrlChars(server.sv_hostname || server.hostname)
    .trim()
    .replace(/[^0-9a-z\-\s]/ig, '')
    .replace(/\s\s+/ig, ' ')
    .replace(/\s\s+/ig, ' ')
    .trim()
}

module.exports = getThreadName
