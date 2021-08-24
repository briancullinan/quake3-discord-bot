
async function createThread(name, channelId = DEFAULT_CHANNEL) {
    await delay()
    var json = {
        'name': name,
        'type': 11,
        'auto_archive_duration': 60
    }
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        method: 'POST',
        url: `${DEFAULT_API}channels/${channelId}/threads`,
        data: JSON.stringify(json)
    })
    return result.data
}

async function archivedThreads(channelId = DEFAULT_CHANNEL) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}channels/${channelId}/threads/archived/public`
    })
    return result.data
}

async function activeThreads(channelId = DEFAULT_CHANNEL) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}channels/${channelId}/threads/active`
    })
    return result.data
}
