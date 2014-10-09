'use strict';

//var should = require("should");
var chai = require('chai');
var should = chai.should();
var chaiAsPromised = require('chai-as-promised');
var sinon = require('sinon');
var WebSocketServer = require('ws').Server;
var wamp = require('../lib/wamp.io');

chai.use(chaiAsPromised);

describe('wamp', function(){



    describe('#attach', function(){

        var wss;

        beforeEach(function(){
            wss = new WebSocketServer({port : 9001});

        });

        afterEach(function(){
            wss.close();
        });

        it('should fail if the websocket is undefined', function(){
            (function(){wamp.attach(undefined)}).should.throw(Error);
//            should(function(){wamp.attach(undefined);}).throw(Error);
        });

        it('should generate id on connection', function(done){

            var conn = wamp.attach(wss);

            conn.on('clientconnected', function(id) {
                id.should.be.ok;
                done();
            });

            var client = wamp.connect("ws://localhost:9001");
        });
    });

    describe('#call', function() {

        var wss;

        before(function(){
            wss = new WebSocketServer({port : 9001});

            var server = wamp.attach(wss);

            server.on('call', function(uri, args, cb){
                if (uri === 'http://test.com/test#pass')
                    cb(null, true);
                else if (uri === 'http://test.com/test#fail')
                    cb(new Error("failed!"), undefined);
            });
        });

        it('should resolve functions that are completed', function(done) {
            var client = wamp.connect("ws://localhost:9001", function(){
                client.call('http://test.com/test#pass', false).should.eventually.equal(true).notify(done);
            });
        });

        it('should reject functions that are errors', function(done) {
            var client = wamp.connect("ws://localhost:9001", function(){
                client.call('http://test.com/test#fail', false).should.eventually.be.rejected.notify(done);
            });
        })
    });
});