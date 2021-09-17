
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
  var now = Date.now()
  var delayed = now + delay
  while(!result && now < delayed) {
    await timeout(100)
    result = await until()
    now = Date.now()
  }
  return result
}

module.exports = {
  timeout,
  delay,
  wait,
}
