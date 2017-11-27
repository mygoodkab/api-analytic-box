var child_process = require('child_process');
var resp = child_process.execSync('curl --unix-socket /var/run/docker.sock "http:/v1.24/containers/webconfig-dist/logs?stdout=1"');
var result = resp.toString('UTF8');
console.log(result);
