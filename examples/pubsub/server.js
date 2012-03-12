
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
  if (req.url !== '/hub' ||  req.method !== 'POST') {
    res.writeHead(400);
    res.end();
    return;
  }

  var buffer = '';

  req.on('data', function(data) {
    buffer += data;
  });

  req.on('end', function() {
    try {
      var parsed = qs.parse(buffer);
    
      var topicUri = parsed.topicuri;
      var event = JSON.parse(parsed.body);

      console.log('pushing ' + event + ' to ' + topicUri);
      app.publish(topicUri, event);
    } catch (e) {
      res.writeHead(400);
      res.end();
      return;
    }
    res.writeHead(200);
    res.end();
  });

  req.on('close', function() {
    buffer = '';
  });
});

api.listen(9090);
