
function parseConfigStr(m) {
  return m.toString('utf-8').trim()
    .split(/\n/ig)[0].trim()
    .split(/\\/ig).slice(1) // starts with empty\\key\\value alternating
    .reduce((obj, c, i, arr) => {
      if(i & 1) {
        obj[arr[i-1].toLowerCase()] = c
        obj[arr[i-1]] = c
      }
      return obj
    }, {})
}

module.exports = parseConfigStr
