var {wait} = require('../utilities/timeout-delay.js')
var {guildChannels} = require('../discordApi')

var DEFAULT_REFRESH = 10 * 1000
var channelsLastUpdated = 0
var channelsUpdating = false
var channels

async function getServerChannel(server) {
  // get a list of channels to pair gametype up with
  if(channelsUpdating) {
    await wait(() => channelsUpdating == false, 3000)
  } else if((new Date).getTime() - channelsLastUpdated > DEFAULT_REFRESH
    || !channels) {
    channelsUpdating = true
    channels = (await guildChannels()).filter(c => c.type == 0)
    channelsLastUpdated = (new Date).getTime()
    channelsUpdating = false
  }
  var channel
  // sort ffa/ctf/freeZe
  if(!channel && (server.server_freezetag == '1'
    || (server.game || server.gamename || '').toLowerCase() == 'freon'
    || (typeof server.xp_version != 'undefined'
      && server.g_gametype == '8'))) {
    channel = channels.filter(c => c.name.toLowerCase() == 'freeze-tag')[0]
  }
  if(!channel && server.gamename.toLowerCase() == 'defrag') {
    channel = channels.filter(c => c.name.toLowerCase() == 'defrag')[0]
  }
  if(!channel && server.g_gametype == '4') {
    channel = channels.filter(c => c.name.toLowerCase() == 'capture-the-flag')[0]
  }
  if(!channel && server.g_gametype == '3') {
    channel = channels.filter(c => c.name.toLowerCase() == 'team-deathmatch')[0]
  }
  if(!channel && typeof server.xp_version != 'undefined'
    && server.g_gametype == '7') {
    channel = channels.filter(c => c.name.toLowerCase() == 'clan-arena')[0]
  }
  if(!channel && typeof server.xp_version != 'undefined'
    && server.g_gametype == '1') {
    channel = channels.filter(c => c.name.toLowerCase() == '1on1-duel')[0]
  }
  if(!channel) {
    channel = channels.filter(c => c.name.toLowerCase() == 'free-for-all')[0]
  }
  if(!channel) {
    channel = channels.filter(c => c.name.toLowerCase() == 'quake3')[0]
  }
  if(!channel) {
    channel = channels.filter(c => c.name.toLowerCase() == 'general')[0]
  }
  return channel
}

module.exports = getServerChannel
