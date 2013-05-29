/*!
 * wamp.io: a node.js WAMP™ server
 * Copyright (c) 2012 Nico Kaiser <nico@kaiser.me>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var EventEmitter = process.EventEmitter
  , handlers = require('./handlers')
  , protocol = require('./protocol')
  , debug = require('debug')('wamp');

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
  if (!client.id) {
    client.id = String(Math.random() * Math.random()).substr(3);
  }

  self.clients[client.id] = client;
  debug('new connection');

  // Send welcome message
  var msg = [protocol.TYPE_ID_WELCOME, client.id, 1, 'wamp.io'];
  client.send(JSON.stringify(msg));

  client.on('message', function(data) {
    var msg;
    debug('message received: ' + data);

    try {
      msg = JSON.parse(data);
    } catch (e) {
      debug('invalid json');
      return;
    }

    if (!Array.isArray(msg)) {
      debug('msg not a list');
      return;
    }

    var typeId = msg.shift();
    if (!handlers[typeId]) {
      debug('unknown message type');
      return;
    }

    handlers[typeId].apply(self, [client, msg]);
  });

  client.on('close', function() {
    debug('client close');
//    for (var topic in Object.keys(client.topics)) {
//      delete self.topics[topic][client.id];
//    }
    var topicKeys = Object.keys(client.topics);
    for (var topic in topicKeys) {
      delete self.topics[topicKeys[topic]][client.id];
    }
    delete self.clients[client.id];
    self.emit('disconnected', client.id);
  });

  return this;
};

/**
 * Publish an event to all subscribed clients
 *
 * @param {String} topicUri
 * @param {Object} event
 * @param {String} exclude
 * @api public
 */

Server.prototype.publish = function(topicUri, event, exclude) {
  if (this.topics[topicUri]) {
    var msg, id;
    msg = JSON.stringify([protocol.TYPE_ID_EVENT, topicUri, event]);
    for (id in this.topics[topicUri]) {
      if (exclude && id === exclude) {
        continue;
      }
      this.clients[id].send(msg);
      debug('delivered event to client ' + id);
    }
  }
};


// Supports WORLIZE WebSocket-Node

/**
 * Handle new connection
 *
 * @param {wsio.Socket} client
 * @return {Server} for chaining
 * @api public
 */

Server.prototype.onConnectionWSN = function(client) {
  var self = this;

  client.topics = {};
  client.prefixes = {};
  if (!client.id)
    client.id = String(Math.random() * Math.random()).substr(3);

  self.clients[client.id] = client;
  debug('new connection');
  self.emit('clientconnected', client.id);

  // Send welcome message
  var msg = [protocol.TYPE_ID_WELCOME, client.id, 1, 'wamp.io'];
  client.send(JSON.stringify(msg));

  client.on('message', function(data) {
    var msg;
    debug('message received: ' + data);

    try {
      msg = JSON.parse(data.utf8Data);
    } catch (e) {
      debug('invalid json');
      return;
    }

    if (!Array.isArray(msg)) {
      debug('msg not a list');
      return;
    }

    var typeId = msg.shift();
    if (!handlers[typeId]) {
      debug('unknown message type');
      return;
    }

    handlers[typeId].apply(self, [client, msg]);
  });

  client.on('close', function(reasonCode, description) {
    debug('client close');
//    for (var topic in Object.keys(client.topics)) {
//      delete self.topics[topic][client.id];
//    }
    var topicsKeys = Object.keys(client.topics);
    for (var topic in topicsKeys) {
      delete self.topics[topicsKeys[topic]][client.id];
    }
    delete self.clients[client.id];
    self.emit('clientdisconnected', client.id, reasonCode, description);
  });

  return this;
};
