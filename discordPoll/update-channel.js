var {
  archivedThreads, getPins,
  activeThreads, createThread, createMessage,
  pinMessage, unpinMessage, DEFAULT_USERNAME,
  userInfo, addThreadMember, deleteMessage
} = require('../discordApi')
var STATUS_REMOVE = 72 * 60 * 60 * 1000 // past 72 hours
var userInfo

async function updateThread(threadName, channel, json) {
  if(!channel)
    return
  // find old threads to reactivate
  var archived = (await archivedThreads(channel.id)).threads
    .filter(t => t.name == threadName)
  if(archived.length > 0) {
    thread = archived[0]
  } else {
    // thread is already active
    var active = (await activeThreads(channel.id)).threads
      .filter(t => t.name == threadName)
    if(active.length > 0) {
      thread = active[0]
    } else {
      thread = await createThread(threadName, channel.id)
    }
  }
  if(json)
    await createMessage(json, thread.id)
  return thread
}

async function updateChannelThread(threadName, channel, json, noUpdate) {
  if(!channel)
    return
  // find old threads to reactivate
  var archived = (await archivedThreads(channel.id)).threads 
    .filter(t => t.name == threadName)

  var thread
  var pins
  if(archived.length > 0) {
    thread = archived[0]
    pins = (await getPins(thread.id))
      .filter(p => p.author.username == DEFAULT_USERNAME)
  } else {
    // thread is already active
    var active = (await activeThreads(channel.id)).threads
      .filter(t => t.name == threadName)
    if(active.length > 0) {
      // find and update previous "whos online" message, pins?
      thread = active[0]
      pins = (await getPins(thread.id))
        .filter(p => p.author.username == DEFAULT_USERNAME)
      if(!noUpdate && pins.length > 0) {
        try {
          console.log('Updating ', threadName)
          await updateMessage(json, pins[0].id, thread.id)
          return thread
        } catch (e) {
          if(e.code == '400' 
            && ((e.response.data || {}).message || '').includes('archived')) {
            console.log('Archived error', e.response.data.message)
            return // do nothing because it will run again in 1 minute
          }
        }
      }
    } else {
      thread = await createThread(threadName, channel.id)
      if(!userInfo) {
        userInfo = await getUser()
      }
      await addThreadMember(userInfo.id, thread.id)
    }
  }
  // create new "whos online message"
  var message = await createMessage(json, thread.id)
  await pinMessage(message.id, thread.id)

  // get all previous status messages
  var messages = (await channelMessages(thread.id, STATUS_REMOVE))
  messages = messages
    .filter(m => m.id != message.id 
      && m.author.username == DEFAULT_USERNAME
      && ((m.embeds && m.embeds[0] && m.embeds[0].fields
        && m.embeds[0].fields[0] && m.embeds[0].fields[0].name == 'Map')
      || (m.content.length == 0 && (!m.embed || m.embeds.length == 0))))
  console.log(messages)
  for(var i = 0; i < messages.length; i++) {
    Promise.resolve(deleteMessage(messages[i].id, thread.id))
  }

  if(pins && pins.length > 0) {
    for(var i = 0; i < pins.length; i++) {
      Promise.resolve(unpinMessage(pins[i].id, thread.id))
    }
  }
  return thread
}

module.exports = {
  updateChannelThread,
  updateThread,
}
