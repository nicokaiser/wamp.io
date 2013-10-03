//
// This is a simple server example
// 
// This script runs a simple WAMP server on port 9000 that exposes
// only one function, "test:isEven". It returns `true` if the first
// parameter is even, `false` otherwise.
//

var WebSocketServer = require('ws').Server
  , wamp = require('../../lib/wamp.io');

//
// WebSocket server
//
var wss = new WebSocketServer({ port: 9000 });

//
// Procedures
//
var procs = {

  // Simple even/odd number test
  'test:isEven': function(args, cb) {
    cb(null, args[0] % 2 === 0);
  }

};

// 
// Attach wamp.io to the WebSocket server and react on function calls
//
var app = wamp.attach(wss);

app.on('call', function(procUri, args, cb) {
  if (! procs[procUri]) {
    return cb('Unknown procedure: ' + procUri);
  }
  procs[procUri](args, cb);
});
