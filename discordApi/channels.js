
async function userChannels(userId = '@me') {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}channels/${userId}`
    })
    return result.data
}

async function guildChannels(guildId = DEFAULT_GUILD) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}guilds/${guildId}/channels`
    })
    return result.data
}

async function channelMessages(channelId = DEFAULT_CHANNEL) {
    await delay()
    var params = {
        limit: 100,
        after: (BigInt(Date.now() - 1420070400000 - MESSAGE_TIME) << BigInt(22)).toString()
    };
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}channels/${channelId}/messages`,
        params
    })
    return result.data
}
