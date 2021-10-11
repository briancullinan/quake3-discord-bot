var {
  archivedThreads,
  activeThreads
} = require('../discordApi')


async function listThreads(threadName, channelId) {
  var thread
  if(!channelId)
    return
  threadName = threadName.trim()
  // find old threads to reactivate
  var archived = (await archivedThreads(channelId)).threads
    .filter(t => t.name.trim() == threadName)
  if(archived.length > 0) {
    thread = archived[0]
  } else {
    // thread is already active
    var active = (await activeThreads(channelId)).threads
      .filter(t => t.name.trim() == threadName)
    if(active.length > 0) {
      thread = active[0]
    } else {
      
    }
  }
  
  console.log(thread)
}

module.exports = listThreads
