var debug = require('debug')('http')
  , http = require('http')
  , test = 'test';

// fake app

debug('booting %o', test);

http.createServer(function (req, res) {
  debug(req.method + ' ' + req.url);
  res.end('hello\n');
}).listen(3000, function () {
  debug('listening');
});

require('./routes/users.js');