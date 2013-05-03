
# WAMP.IO: Autobahn WebSockets RPC/PubSub

This is an implentation of the [WebSocket Application Messaging Protocol (WAMP)](http://www.tavendo.de/autobahn/protocol.html) proposed by Travendo.

It attaches to a [WebSocket server](https://github.com/einaros/ws/) and provides mechanisms for

- **Request and Response** and
- **Publish and Subscribe**

## Usage

### Simple PubSub server

By default, wamp.io provides a simple PubSub server that enables client to subscribe to any topic and to send events to any topic.

#### Attach WAMP to a WebSocket.IO server

```js
var wsio = require('websocket.io')
  , wamp = require('wamp.io');

var ws = wsio.listen(9000);
var app = wamp.attach(ws);
```

#### Attach WAMP to an Engine.IO server

```js
var eio = require('engine.io')
  , wamp = require('wamp.io');

var engine = eio.listen(9000);
var app = wamp.attach(engine);
```

### Simple RPC server

The server emits the `call` event when an RPC function is called. Results can be returned using the callback parameter.

```js
var wsio = require('websocket.io')
  , wamp = require('wamp.io');

var ws = wsio.listen(9000);
var app = wamp.attach(ws);

app.on('call', function(procUri, args, cb) {
  if (procUri === 'isEven') {
    cb(null, args[0] % 2 == 0);
  }
});
```

### Simple RPC client
```js
var when = require('when')
  , wamp = require('wamp.io');
  
var app = wamp.connect('ws://localhost:9000',
    // WAMP session was established
    function (session) 
    {
      console.log('new wamp session');
      
      session.call("test:isEven", 2)      
        .promise.then(
            // RPC success callback
            function (reply)
            {
              console.log("result: " + reply);
            },

            // RPC error callback
            function (error, desc) 
            {        
              console.log("error: " + desc);
            }
        );      
    },

    // WAMP session is gone
    function (session) 
    {
      console.log('wamp session is gone');
    }
  );  
```


## License 

(The MIT License)

Copyright (c) 2013 Nico Kaiser &lt;nico@kaiser.me&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
