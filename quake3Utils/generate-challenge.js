function generateChallenge() {
  var challenge = []
  for(var c = 0; c < 4; c++) {
      challenge[c] = Math.round(Math.random() * 255)
  }
  var unsigned = new Uint32Array(Uint8Array.from(challenge).buffer)
  return unsigned[0].toString()
}

module.exports = generateChallenge
