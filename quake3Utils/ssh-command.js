var fs = require('fs')
var path = require('path')
var NodeSSH = require('node-ssh')
var ssh = new NodeSSH()
var PROFILE_PATH = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE
var privateKeyPath
if(fs.existsSync('./id_rsa')) {
    privateKeyPath = path.resolve('./id_rsa')
} else {
    privateKeyPath = path.join(PROFILE_PATH, '.ssh/id_rsa')
}

var DEFAULT_SSH = process.env.DEFAULT_SSH || 'okayfun.com'
var DEFAULT_SSH_USER = process.env.DEFAULT_SSH_USER || 'root'

/*
ssh.connect({
  host: DEFAULT_SSH,
  username: DEFAULT_SSH_USER,
  privateKey: privateKeyPath
})
*/

async function remoteGet(url, output, cwd) {
    var options = {
        cwd: cwd,
        onStdout(chunk) {
          console.log('stdoutChunk', chunk.toString('utf8'))
        },
        onStderr(chunk) {
          console.log('stderrChunk', chunk.toString('utf8'))
        },
    }
    try {
        await ssh.exec('/usr/bin/wget', ['-O', output, url], options)
        await ssh.exec(`
fileLength=$(wc -l ../index.json | cut -d' ' -f1);
sed "$((fileLength-1))s/$/,/;
${fileLength}i  \\\t\"\":\"\"" ../index.json`, [], options)
        
    } catch (e) {
        console.log('Ssh error', e)
    }
}

module.exports = remoteGet
