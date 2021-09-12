
async function timeout(delay) {
  await new Promise(resolve => setTimeout(resolve, delay))  
}

async function delay(prev, delay) {
  var now = Date.now()
  if(now - prev < delay)
    await new Promise(resolve => setTimeout(resolve, delay - (now - prev)))
  return Date.now()
}

async function wait(until, delay) {
  var waitTimer
  var waitCount = 0
  var result
  await new Promise(resolve => {
    waitTimer = setInterval(() => {
      if((result = until())) {
        clearInterval(waitTimer)
        resolve(result)
      } else if (waitCount == Math.round(delay / 100)) {
        clearInterval(waitTimer)
        resolve(false)
      } else {
        waitCount++
      }
    }, 100)
  })
}

module.exports = {
  timeout,
  delay,
  wait,
}
