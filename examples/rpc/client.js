var when = require('when')
  , wamp = require('../../lib/wamp.io');

//
// Turn debugging on
//
wamp.debug(true, true);

//
// Connect to the server running on localhost:9000
//
var app = wamp.connect('ws://localhost:9000',

  // WAMP session is established 
  function(session) {
    console.log('new wamp session');
      
    session.call("test:isEven", 2)
      .promise.then(
          // RPC success callback
          function (reply) {
            console.log("result: " + reply);
          },

          // RPC error callback
          function (error, desc) {
            console.log("error: " + desc);
          }
      );
  },

  // WAMP session is gone
  function (session) {
    console.log('wamp session is gone');
  }

);
