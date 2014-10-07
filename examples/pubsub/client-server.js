/**
 * Created by dap1lan on 9/17/2014.
 */
"use strict";

var WebSocketServer = require('ws').Server
    , wamp = require('../../lib/wamp.io');

var wss = new WebSocketServer({port : 9000});
var app = wamp.attach(wss);


wamp.connect('ws://localhost:9000',
    function connected(session){

        session.subscribe('http://com.topic.client/stuff#action', function(topic, data) {

            console.log('Client #1 Received data: ' + data.str);
        });

        session.publish('http://com.topic2.client/other_stuff#action', {data : "Hello Again!"}, false);

    },
    function disconnected(session){


    });

wamp.connect('ws://localhost:9000',
    function connected(session){

        session.subscribe('http://com.topic.client/stuff#action', function(topic, data) {
            console.log('Client #2 Received data: ' + data.str);
            session.publish('http://com.topic.client/other_stuff#action', {str : "Hello WAMP!"}, true);
        });



    },
    function disconnected(session){


    });