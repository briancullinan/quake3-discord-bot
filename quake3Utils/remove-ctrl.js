
// TODO: use this for server names and player names when matching to discord
function removeCtrlChars(str) {
    return str
        .replace(/\^\^[a-z0-9][a-z0-9]/ig, '')
        .replace(/\^[a-z0-9]/ig, '')
        .trim()
}

module.exports = removeCtrlChars
