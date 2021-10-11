var {
  archivedThreads, getPins,
  activeThreads, createThread, createMessage,
  pinMessage, unpinMessage, DEFAULT_USERNAME,
  userInfo, addThreadMember, deleteMessage,
  channelMessages
} = require('../discordApi')
var STATUS_REMOVE = 12 * 60 * 60 * 1000 // past 12 hours
var userInfo

async function updateThread(threadName, channel, json) {
  var thread
  if(!channel || !channel.id)
    throw new Error('Invalid channel!')

  threadName = threadName.trim()
  // find old threads to reactivate
  var active = (await activeThreads(channel.id)).threads
    .filter(t => t.name.trim() == threadName)
  if(active.length > 0) {
    thread = active[0]
  } else {
    // thread is already active
    var archived = (await archivedThreads(channel.id)).threads
      .filter(t => t.name.trim() == threadName)
    if(archived.length > 0) {
      thread = archived[0]
    } else {
      thread = await createThread(threadName, channel.id)
    }
  }
  if(json)
    await createMessage(json, thread.id)
  return thread
}

async function updateChannelThread(threadName, channel, json, noUpdate) {
  var thread
  var pins
  if(!channel || !channel.id)
    throw new Error('Invalid channel!')

  thread = (await updateThread(threadName, channel))

  if(!userInfo) {
    userInfo = await getUser()
  }
  await addThreadMember(userInfo.id, thread.id)

  // find and update previous "whos online" message, pins?
  pins = (await getPins(thread.id))
    .filter(p => p.author.username == DEFAULT_USERNAME)

console.log(pins, thread)
  if(pins.length > 0 && !thread.thread_metadata.archived) {
    console.log('Updating ', threadName)
    message = pins[0]
    await updateMessage(json, pins[0].id, thread.id)
  } else {
    // create new "whos online message"
    var message = await createMessage(json, thread.id)
    await pinMessage(message.id, thread.id)
  }

  // unpin any previous pins
  if(pins && pins.length > 0) {
    for(var i = 0; i < pins.length; i++) {
      if(pins[i].id == message.id) continue;
      Promise.resolve(unpinMessage(pins[i].id, thread.id))
    }
  }

  // get all previous status messages
  var messages = await channelMessages(thread.id, STATUS_REMOVE)
  messages = messages
    .filter(m => m.id != message.id 
      && m.author.username == DEFAULT_USERNAME && (
        (m.embeds && m.embeds[0] && m.embeds[0].fields
        && m.embeds[0].fields[0] && m.embeds[0].fields[0].name == 'Map')
        || (m.content.length == 0 && (!m.embeds || m.embeds.length == 0))
    ))
  for(var i = 0; i < messages.length; i++) {
    Promise.resolve(deleteMessage(messages[i].id, thread.id))
  }

  return thread
}

module.exports = {
  updateChannelThread,
  updateThread,
}
