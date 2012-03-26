
/*!
 * wamp.io: a node.js WAMP™ server
 * Copyright (c) 2012 Nico Kaiser <nico@kaiser.me>
 * MIT Licensed
 */

/**
 * Server constructor.
 *
 * @api public
 */

exports.Server = require('./server');

/**
 * Attach to WebSocket.IO Server.
 *
 * @param {wsio.Server} server
 * @param {Object} options
 * @return {wsio.Server}
 * @api public
 */

exports.attach = function(server, options) {
  var wamp = new exports.Server(options);

  server.on('connection', function(client) {
    wamp.onConnection(client);
  });

  return wamp;
};
