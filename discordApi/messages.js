
async function createMessage(message, channelId = DEFAULT_CHANNEL) {
    await delay()
    var params = typeof message == 'string' ? ({
        'content': message
    }) : message
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        method: 'POST',
        url: `${DEFAULT_API}channels/${channelId}/messages`,
        data: JSON.stringify(params)
    })
    return result.data
}

async function updateMessage(message, messageId, channelId = DEFAULT_CHANNEL) {
    await delay()
    var params = typeof message == 'string' ? ({
        'content': message
    }) : message
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        method: 'PATCH',
        url: `${DEFAULT_API}channels/${channelId}/messages/${messageId}`,
        data: JSON.stringify(params)
    })
    return result.data
}

async function getPins(channelId = DEFAULT_CHANNEL) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}channels/${channelId}/pins`
    })
    return result.data
}

async function pinMessage(messageId, channelId = DEFAULT_CHANNEL) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'PUT',
        url: `${DEFAULT_API}channels/${channelId}/pins/${messageId}`
    })
    return result.data
}

async function unpinMessage(messageId, channelId = DEFAULT_CHANNEL) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'DELETE',
        url: `${DEFAULT_API}channels/${channelId}/pins/${messageId}`
    })
    return result.data
}
