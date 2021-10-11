var {
  deleteMessage,
  channelMessages
} = require('../discordApi')
var STATUS_REMOVE = 72 * 60 * 60 * 1000 // past 72 hours
var DEFAULT_USERNAME = 'Orbb'

async function removeMessages(channelId = '887793723692449822') {
  var messages = await channelMessages(channelId, STATUS_REMOVE)
  messages = messages
    .filter(m => m.id != 0
      && m.author.username == DEFAULT_USERNAME && (
        (m.embeds && m.embeds[0] && m.embeds[0].fields
          && m.embeds[0].fields[0] && m.embeds[0].fields[0].name == 'Map')
        || (m.content.length == 0 && (!m.embeds || m.embeds.length == 0))
    ))
  console.log(messages)
  for(var i = 0; i < messages.length; i++) {
    await deleteMessage(messages[i].id, channelId)
  }

}

module.exports = removeMessages
