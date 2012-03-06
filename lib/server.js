
/**
 * Module dependencies.
 */

var messages = require('./messages')
  , EventEmitter = process.EventEmitter;

/**
 * Module exports.
 */

module.exports = Server;

/**
 * Server constructor.
 *
 * @api public
 */

function Server(options) {
  this.options = options || {};
  this.topics = {};
}

/**
 * Inherits from EventEmitter.
 */

Server.prototype.__proto__ = EventEmitter.prototype;

/**
 * Handle new connection
 *
 * @param {wsio.Socket} client
 * @return {Server} for chaining
 * @api public
 */

Server.prototype.onConnection = function(client) {
  var self = this;
  client.topics = {};

  client.on('message', function(data) {
    try {
      var msg = JSON.parse(data);
    } catch (e) {
      return client.emit('error', 'Invalid JSON');
    }

    if (! Array.isArray(msg)) {
      return client.emit('error', 'Invalid WAMP message');
    }

    var typeId = msg.shift();
    if (! messages[typeId]) {
      return client.emit('error', 'Invalid message type ' + typeId);
    }

    messages[typeId].apply(self, [client, msg]);
  });

  client.on('close', function() {
    // Remove client from all subscribed topics
    // ...
  });

  return this;
};
