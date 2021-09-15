
var timers = {}
var mainTimer = setInterval(callResolve, 20)

function callResolve() {
  var now = Date.now()
  var times = Object.keys(timers)
  for(var i = 0; i < times.length; i++) {
    if(now > times[i]) {
      try {
        Promise.resolve(timers[times[i]]())
      } catch (e) {
        console.log('timer failed', e)
        throw e
      }
      delete timers[times[i]]
      return
    }
  }
}

function addResolve(resolve, time) {
  while(typeof timers[time] != 'undefined') {
    time++
  }
  timers[time] = resolve
}

async function timeout(delay) {
  var now = Date.now()
  await new Promise(resolve => addResolve(resolve, now + delay))  
}

async function delay(prev, delay) {
  var now = Date.now()
  if(now - prev < delay)
    await new Promise(resolve => addResolve(resolve, now + (delay - (now - prev))))
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
