'use strict';

var assert = require("assert");
var should = require("should");
var sinon = require('sinon');
var WebSocketServer = require('ws').Server;
var wamp = require('../lib/wamp.io');

describe('Array', function(){
    describe('#indexOf()', function(){
        it('should return -1 when the value is not present', function(){
            assert.equal(-1, [1,2,3].indexOf(5));
            assert.equal(-1, [1,2,3].indexOf(0));
        })
    })
});

describe('wamp', function(){

    var wss;

    beforeEach(function(){
        wss = new WebSocketServer({port : 9001});
    });

    afterEach(function(){
        wss.close();
    });

    describe('#attach', function(){

        it('should fail if the websocket is undefined', function(){
            should(function(){wamp.attach(undefined);}).throw(Error);
        });

        it('should generate id on connection', function(done){

            var conn = wamp.attach(wss);

            conn.on('connected', function(id) {
                id.should.be.ok;
                done();
            });

            var client = wamp.connect("ws://localhost:9001");
        });

        it('should after connect send a welcome message', function(done){

            wss.on('connection', function(wsClient){
                sinon.spy(wsClient, "send");
            });

            var conn = wamp.attach(wss);

            var client = wamp.connect("ws://localhost:9001");

            wss.getCall(0).args[0].should.equal([]);

        });

    });
});