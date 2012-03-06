
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
  this.clients = {};
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
  client.prefixes = {};
  if (! client.id) client.id = String(Math.random() * Math.random()).substr(3);

  this.clients[client.id] = client;

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
    for (var topic in Object.keys(client.topics)) {
      delete this.topics[topic][client.id];
    }
    delete this.clients[client.id];
  });

  return this;
};

/**
 * Publish an event to all subscribed clients
 *
 * @param {String} topicUri
 * @param {Object} event
 * @api public
 */

Server.prototype.publish = function(topicUri, event) {
  if (this.topics[topicUri]) {
    var msg, id;
    msg = JSON.stringify([8, topicUri, event]); // 8: TYPE_ID_EVENT
    for (id in this.topics[topicUri]) {
      // FIXME: use client's prefix if present
      this.clients[id].send(msg);
    }
  }
};
