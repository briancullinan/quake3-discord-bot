
async function userGuilds(userId = '@me') {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}users/${userId}/guilds`
    })
    return result.data
}

async function getGuildRoles(guildId = DEFAULT_GUILD) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}guilds/${guildId}/roles`
    })
    return result.data
}

async function userConnections(userId = '@me') {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}users/${userId}/connections`
    })
    return result.data
}
