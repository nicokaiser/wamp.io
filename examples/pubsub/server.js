
/**
 * Module dependencies.
 */

var wsio = require('websocket.io')
  , wamp = require('../../lib/wamp.io');

var ws = wsio.listen(9000);
var app = wamp.attach(ws);
