var WebSocket = require('ws')
    , when = require('when')
    , debug = require('debug')('wamp-client')
    , protocol = require('./protocol')
    , PrefixMap = require('./prefixes').PrefixMap;

/**
 * Module exports.
 */

module.exports = Client;

function Session(ws, onOpen, onClose, options) {
    var self = this;

    self._websocket = ws;
    self._websocket_connected = false;

    self._onopen = onOpen;
    self._onclose = onClose;

    self.options = options || {};

    self._session_id = null;
    self._wamp_version = null;
    self._server = null;

    self._txcnt = 0;
    self._rxcnt = 0;

    self._calls = {};
    self._prefixes = new PrefixMap();

    self._subscriptions = {};

    self._websocket.onmessage = function (e) {
        debug('recv message: ' + e.data);

        var o = JSON.parse(e.data);
        if (o[0] === protocol.TYPE_ID_CALL_RESULT) {
            if (o[1] in self._calls) {
                // the reply has arrived, get the deferred
                var callid = o[1];
                var deferred = self._calls[callid];
                var reply = o[2];

                debug('[' + self._websocket.url + '] < Call result [' + callid + '] :' + reply);

                // finally resolve the pending deferred request
                deferred.resolve(reply);
            }
        }
        else if (o[0] === protocol.TYPE_ID_CALL_ERROR) {
            if (o[1] in self._calls) {

                var callid = o[1];
                var deferred = self._calls[callid];
                var errorURI = o[2];
                var errorDesc = o[3];
                var errorDetails = o[4];

                debug('[' + self._websocket.url + '] < Call error [' + callid + ']: ' + errorURI);

                deferred.reject({errorURI : errorURI, errorDesc : errorDesc, errorDetails : errorDetails});
            }
        }
        else if (o[0] === protocol.TYPE_ID_EVENT) {

            if (o[1] in self._subscriptions) {
                self._subscriptions[o[1]](o[1], o[2]);
            }

        } else if (o[0] === protocol.TYPE_ID_WELCOME) {
            if (self._session_id === null) {
                self._session_id = o[1];
                self._wamp_version = o[2];
                self._server = o[3];

                debug('[' + self._websocket.url + '] > Welcome WAMP v' + self._wamp_version + ', server: ' + self._server + ', session  [' + self._session_id + ']');

                // only now that we have received the initial server-to-client
                // welcome message, fire application onopen() hook
                if (self._onopen !== null) {
                    self._onopen(self);
                }

                self._websocket_connected = true;
            } else {
                throw "protocol error (welcome message received more than once)";
            }
        }
    };

    self._websocket.onopen = function (e) {
        // check if we can speak WAMP!
        if (self._websocket.protocol !== "wamp") {

            if (typeof self._websocket.protocol === 'undefined') {
                //
                // i.e. Safari does subprotocol negotiation (broken), but then
                // does NOT set the protocol attribute of the websocket object (broken)
                //
                debug("WebSocket object has no protocol attribute: WAMP subprotocol check skipped!");
            } else if (self._options && self._options.skipSubprotocolCheck) {
                //
                // WAMP subprotocol check disabled by session option
                //
                debug("Server does not speak WAMP, but subprotocol check disabled by option!");
                debug(self._websocket.protocol);
            } else {
                //
                // we only speak WAMP .. if the server denied us this, we bail out.
                //
                self._websocket.close(1000, "server does not speak WAMP");
                throw "server does not speak WAMP (but '" + self._websocket.protocol + "' !)";
            }
        }

        debug("WAMP Connect [" + self._websocket.url + "]");

        self._websocket_connected = true;
    };

    self._websocket.onclose = function (e) {
        // invoke handler
        if (self._onclose !== null) {
            if (self._websocket_connected) {
                if (e.wasClean) {
                    // connection was closed cleanly (closing HS was performed)
                    self._onclose(1, "WS-" + e.code + ": " + e.reason);
                } else {
                    // connection was closed uncleanly (lost without closing HS)
                    self._onclose(2);
                }
            } else {
                // connection could not be established in the first place
                self._onclose(3);
            }
        }

        // cleanup - reconnect requires a new session object!
        self._websocket_connected = false;
        self._wsuri = null;
        self._websocket_onopen = null;
        self._websocket_onclose = null;
        self._websocket = null;

    };
}

Session.prototype._new_id = function () {
    return Math.random().toString(36);
};

Session.prototype._send = function (msg) {
    var self = this;

    if (!self._websocket_connected) {
        throw "websocket not connected";
    }

    var rmsg = JSON.stringify(msg);
    self._websocket.send(rmsg);
    self._txcnt += 1;

    debug('sent message: %s [%s], #%d: %s', self._websocket.url, self._session_id, self._txcnt, rmsg);
};

/**
 * Call rpc
 *
 * @api public
 */
Session.prototype.call = function () {
    var self = this;

    // generate a new unique call id
    var callid;
    do {
        callid = self._new_id();
    } while (callid in self._calls);

    // create a new deferred request and save it using the call id as key
    var deferred = when.defer();
    self._calls[callid] = deferred;

    var procuri = self._prefixes.shrink(arguments[0], true);
    // create the json array containing the request minus arguments
    var obj = [protocol.TYPE_ID_CALL, callid, procuri];
    for (var i = 1; i < arguments.length; i += 1) {
        obj.push(arguments[i]);
    }

    debug('[%s] > Call [%s] : %s', self._websocket.url, callid, obj);

    // now send the whole wamp packet through the websocket
    self._send(obj);

    return deferred.promise;
};

Session.prototype.publish = function (topicUri, data, excludeMeOrExclude, eligible) {
    var ev = [protocol.TYPE_ID_PUBLISH, topicUri, data];

    if (typeof excludeMeOrExclude !== 'undefined')
        ev.push(excludeMeOrExclude);

    if (typeof eligible !== 'undefined')
        ev.push(eligible);

    this._send(ev);
};

function _warnNoOP() {
    debug("Subscribed to but no call back on this topic");
}

Session.prototype.subscribe = function (topicUri, callback) {
    this._send([protocol.TYPE_ID_SUBSCRIBE, topicUri]);
    this._subscriptions[topicUri] = callback || _warnNoOP;
};

Session.prototype.unsubscribe = function (topicUri) {

    this._send([protocol.TYPE_ID_UNSUBSCRIBE, topicUri]);

    delete this._subscriptions[topicUri];
};

/**
 * Client constructor.
 *
 * @api public
 */
function Client(wsuri, onconnect, onhangup, options) {
    // options for WebSocket protocol
    var wsoptions = {
        protocol: 'wamp'
    };

    // create the WebSocket connection
    var ws = new WebSocket(wsuri, wsoptions);

    // establish session to WAMP server
    var session = new Session(ws,

        // fired when session has been opened
        function () {
            // we are connected .. do awesome stuff!
            if (onconnect)
                onconnect(session);
            else
                debug('Warning: no on connection callback defined!');

        },

        // fired when session has been closed
        function (code, reason) {
            if (onhangup)
                onhangup(session);
            else
                debug('No hangup callback message was defined!');
        },

        options // forward options to session class for specific WS/WAMP options
    );

    return session;
}
