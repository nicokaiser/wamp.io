
/**
 * Module dependencies.
 */

var http = require('http')
  , qs = require('querystring')
  , wsio = require('websocket.io')
  , wamp = require('../../lib/wamp.io');

/**
 * WebSocket server
 */

var ws = wsio.listen(9000);
var app = wamp.attach(ws);

/**
 * REST API
 */

var api = http.createServer(function(req, res) {
  if (req.url !== '/hub') {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method Not Allowed');
    return;
  }

  var buffer = '';

  req.on('data', function(data) {
    buffer += data;
  });

  req.on('end', function() {
    var topicUri, event;
    try {
      var parsed = qs.parse(buffer);
      topicUri = parsed.topicuri;
      event = JSON.parse(parsed.body);
    } catch (e) {
      res.writeHead(400);
      res.end('invalid JSON in request body');
      return;
    }
    app.publish(topicUri, event);
    res.writeHead(202);
    res.end();
  });

  req.on('close', function() {
    buffer = '';
  });
});

api.listen(9090);
