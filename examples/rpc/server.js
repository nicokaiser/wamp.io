
/**
 * Module dependencies.
 */

var wsio = require('websocket.io')
  , wamp = require('../../lib/wamp.io');

/**
 * WebSocket server
 */

var ws = wsio.listen(3000);

/**
 * Procedures
 */

var procs = {

  // Simple even/odd number test
  'test:isEven': function(args, cb) {
    cb(null, args[0] % 2 == 0);
  }

};

/**
 * Attach wamp
 */

var app = wamp.attach(ws);

app.on('call', function(procUri, args, cb) {
  if (! procs[procUri]) {
    return cb('Unknown procedure: ' + procUri);
  }
  procs[procUri](args, cb);
});
