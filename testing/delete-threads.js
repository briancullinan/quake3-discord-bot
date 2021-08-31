var {archivedThreads, activeThreads, deleteChannel} = require('../discordApi')

async function deleteThreads() {
  var channels = await guildChannels()
  //console.log(channels)
  for(var i = 0; i < channels.length; i++) {
    var channel = channels[i]
    if(channel.type != 0) continue

    var archived = (await archivedThreads(channel.id)).threads
    for(var j = 0; j < archived.length; j++) {
      console.log('Deleting ', archived[j].name)
      await deleteChannel(archived[j].id)
    }
  }
}

module.exports = deleteThreads
