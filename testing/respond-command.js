var importer = require('../Core')
var respondCommand = importer.import('respond discord commands')

module.exports = function testChannel(channel) {
    respondCommand(channel)
    
}
