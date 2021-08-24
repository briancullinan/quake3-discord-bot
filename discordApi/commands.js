
async function registerCommand(cmd, desc, guildId = null) {
    await delay()
    // TODO: guild specific commands
    //url = "https://discord.com/api/v8/applications/<my_application_id>/guilds/<guild_id>/commands"
    var json
    if(typeof cmd == 'object') {
        json = cmd
    } else {
        json = {
            'name': cmd,
            'description': desc,
            'options': []
        }
    }
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        method: 'POST',
        url: `${DEFAULT_API}applications/${DEFAULT_APPLICATION}/commands`,
        data: JSON.stringify(json)
    })
    return result.data
}

async function interactionResponse(interactionId, interactionToken) {
    await delay()
    var json = {
        'type': 5
    }
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        method: 'POST',
        url: `${DEFAULT_API}interactions/${interactionId}/${interactionToken}/callback`,
        data: JSON.stringify(json)
    })
    return result.data
}

async function getCommands(guildId = null) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'GET',
        url: `${DEFAULT_API}applications/${DEFAULT_APPLICATION}/commands`
    })
    return result.data
}

async function updateInteraction(message, interactionId, interactionToken) {
    await delay()
    var json = typeof message == 'string' ? ({
            'content': message
        }) : message
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`,
            'Content-Type': 'application/json'
        },
        method: 'PATCH',
        url: `${DEFAULT_API}webhooks/${DEFAULT_APPLICATION}/${interactionToken}/messages/@original`,
        data: JSON.stringify(json)
    })
    return result.data
}


async function deleteCommand(commandId) {
    await delay()
    var result = await request({
        headers: {
            Authorization: `Bot ${token}`
        },
        method: 'DELETE',
        url: `${DEFAULT_API}applications/${DEFAULT_APPLICATION}/commands/${commandId}`
    })
    return result.data
}
