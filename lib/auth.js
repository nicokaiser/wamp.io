/**
 * WAMP Protocol Constants
 */

var protocol = require('./protocol')


/**
 * Crypto Libraries
 */

var crypto = require('crypto');
var CryptoJS = require("crypto-js");



/**
 * WampError constructor and inheritance.
 *
 * @api public
 */

function WampError(type, desc) {
  this.name = type;
  this.message = desc;
  this.uri = protocol.URI_WAMP_ERROR + type;
}

WampError.prototype.__proto__ = Error.prototype;





/**
 * WAMP-CRA Authentication Support Functions
 */

//var URI_WAMP_PROCEDURE = "http://api.wamp.ws/procedure#";

var newid = function() {
  return String(Math.random() * Math.random()).substr(3);
  //return ''.join([random.choice("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_") for i in xrange(16)])
};

var deriveKey = function (secret, extra) {
  /*
      Computes a derived cryptographic key from a password according to PBKDF2
      http://en.wikipedia.org/wiki/PBKDF2.

      The function will only return a derived key if at least 'salt' is
      present in the 'extra' dictionary. The complete set of attributes
      that can be set in 'extra':

         salt: The salt value to be used.
         iterations: Number of iterations of derivation algorithm to run.
         keylen: Key length to derive.

      :returns str -- The derived key or the original secret.
  */

  if (extra && extra.salt) {
    var salt = String(extra.salt);
    var keylen = +extra.keylen || 32;
    var iterations = +extra.iterations || 10000;

    //console.log("Using crypto.pbkdf2 (only HMAC-SHA1)");
    //var key = crypto.pbkdf2Sync(secret, salt, iterations, keylen);
    //return key.toString("base64");
    console.log("Using CryptoJS.PBKDF2");
    var key = CryptoJS.PBKDF2(secret, salt, { keySize: keylen / 4, iterations: iterations, hasher: CryptoJS.algo.SHA256 });
    return key.toString(CryptoJS.enc.Base64);
  } else {
    return secret;
  }
};

var authSignature = function(authChallenge, authSecret, authExtra) {
  /*
  Compute the authentication signature from an authentication challenge and a secret.

      :param authChallenge: The authentication challenge.
      :type authChallenge: str
      :param authSecret: The authentication secret.
      :type authSecret: str
      :authExtra: Extra authentication information for salting the secret. (salt, keylen,
              iterations)
      :type authExtra: dict

      :returns str -- The authentication signature.
  */
  if (!authSecret) {
    authSecret = "";
  }
  //if (authSecret instanceof unicode) {
  //   authSecret = authSecret.encode('utf8')
  //}

  var authSecret = deriveKey(authSecret, authExtra);
  console.log("secret: " + authSecret);
  var h = crypto.createHmac('sha256', authSecret);
  h.update(authChallenge, 'utf8');
  //h = hmac.new(authSecret, authChallenge, hashlib.sha256)
  var sig = h.digest('base64').trim();
  console.log("signature: " + sig);
  return sig;
};

var getAuthSecret = function(authKey, cb) {
  // FOR TESTING ONLY!!! DO NOT USE THIS!
  cb(null, "password");
};



/**
 * WAMP-CRA Authentication RPC Handler
 */

exports.isAuthUri = function(procUri) {
  if (!procUri) return false;

  if (procUri === protocol.URI_WAMP_PROCEDURE + 'authreq') {
    return true;
  } else if (procUri === protocol.URI_WAMP_PROCEDURE + 'auth') {
    return true;
  } else {
    return false;
  }
};

exports.handleAuthRpc = function(client, procUri, args, cb) {
  var self = this;

  if (client) {
    console.log("Client " + client.id + ": " + procUri);
  }


  if (procUri === protocol.URI_WAMP_PROCEDURE + 'authreq')
  {

    /*
      RPC endpoint for clients to initiate the authentication handshake.

      :param authKey: Authentication key, such as user name or application name.
      :type authKey: str
      :param extra: Authentication extra information.
      :type extra: dict

      :returns str -- Authentication challenge. The client will need to create an authentication signature from this.
    */

    var authKey = (0 in args ? args[0] : null);
    var extra = (1 in args ? args[1] : null);

    // check authentication state
    //
    if (client._clientAuthenticated) {
      //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "already-authenticated"), "already authenticated")
      cb(new WampError("already-authenticated", "already authenticated"));
      return;
    }
    if (client._clientPendingAuth) {
      //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "authentication-already-requested"), "authentication request already issues - authentication pending")
      cb(new WampError("authentication-already-requested", "authentication request already issues - authentication pending"));
      return;
    }

    // check extra
    //
    if (extra) {
      if(typeof(extra) !== 'object') {
        //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "invalid-argument"), "extra not a dictionary (was %s)." % str(type(extra)))
        cb(new WampError("invalid-argument", "extra not a dictionary (was " + typeof(extra) + ")."));
        return;
      }
    } else {
      extra = {};
    }

    // check authKey
    //
    if (authKey === null && !self.clientAuthAllowAnonymous) {
      //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "anonymous-auth-forbidden"), "authentication as anonymous forbidden")
      cb(new WampError("anonymous-auth-forbidden", "authentication as anonymous forbidden"));
      return;
    }
    if (typeof(authKey) !== 'string') {
      //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "invalid-argument"), "authentication key must be a string (was %s)" % str(type(authKey)))
      cb(new WampError("invalid-argument", "authentication key must be a string (was " + typeof(authkey) + ")"));
      return;
    }

    var onGetAuthSecretOk = (function(authKey, extra, cb) {
      return function (err, authSecret) {
        if (err) { cb(new WampError("auth-getsecret-error", err.toString())); return; }

        if (authKey !== null && authSecret === null) {
          //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "no-such-authkey"), "authentication key '%s' does not exist." % authKey)
          cb(new WampError("no-such-authkey", "authentication key '" + authKey + "' does not exist."));
          return;
        }


        // each authentication request gets a unique authid, which can only be used (later) once!
        //
        var authid = newid();

        // create authentication challenge
        //
        var info = {}
        info['authid'] = authid;
        info['authkey'] = authKey;
        info['timestamp'] = new Date().getTime();
        info['sessionid'] = client.id;  // Warning: value of client is not captured
        info['extra'] = extra;

        var onAuthPermissionsOk = function(err, res) {
          if (err) { cb(new WampError("auth-permissions-error", err.toString())); return; }

          if (!res) {
            res = {'permissions': {}};
            res['permissions'] = {'pubsub': [], 'rpc': []};
          }
          info['permissions'] = res['permissions'];
          if ('authextra' in res) {
            info['authextra'] = res['authextra'];
          }

          if (authKey) {
            // authenticated session
            //
            var infoser = JSON.stringify(info);
            var sig = authSignature(infoser, authSecret, extra);   //TODO

            client._clientPendingAuth = [info, sig, res];
            //console.log(sig);
            cb(null, infoser);
            return;
          } else {
            // anonymous session
            //
            client._clientPendingAuth = [info, null, res];
            cb(null, null);
            return;
          }
        };

        // getAuthPermissions() will callback on onAuthPermissionsOk()
        if (self.getAuthPermissions && typeof(self.getAuthPermissions) === 'function') {
          process.nextTick(function() {
            // defers execution to event loop without the use of EventEmitter
            self.getAuthPermissions(authKey, extra, onAuthPermissionsOk);
          });
        }
        self.emit('getAuthPermissions', authKey, extra, onAuthPermissionsOk);

      };
    })(authKey, extra, cb);

    // getAuthSecret() will callback on onGetAuthSecretOk()
    if (self.getAuthSecret && typeof(self.getAuthSecret) === 'function') {
      process.nextTick(function() {
        // defers execution to event loop without the use of EventEmitter
        self.getAuthSecret(authKey, onGetAuthSecretOk);
      });
    }
    self.emit('getAuthSecret', authKey, onGetAuthSecretOk);

  }
  else if (procUri === protocol.URI_WAMP_PROCEDURE + 'auth')
  {
    /*
    RPC endpoint for clients to actually authenticate after requesting authentication and computing
      a signature from the authentication challenge.

      :param signature: Authentication signature computed by the client.
      :type signature: str

      :returns list -- A list of permissions the client is granted when authentication was successful.
    */
    var signature = (0 in args ? args[0] : null);
    //console.log(signature);

    // check authentication state
    //
    if (client._clientAuthenticated === true) {
      //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "already-authenticated"), "already authenticated")
      cb(new WampError("already-authenticated", "already authenticated"));
      return;
    }
    if (client._clientPendingAuth === null) {
      //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "no-authentication-requested"), "no authentication previously requested")
      cb(new WampError("no-authentication-requested", "no authentication previously requested"));
      return;
    }

    // check signature
    //
    if (typeof(signature) !== 'string') {  //TODO
      //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "invalid-argument"), "signature must be a string or None (was %s)" % str(type(signature)))
      cb(new WampError("invalid-argument", "signature must be a string or None (was " + typeof(signature) + ")"));
      return;
    }
    if (client._clientPendingAuth[1] !== signature) {
      client._clientPendingAuth = null;
      //raise Exception(self.shrink(WampProtocol.URI_WAMP_ERROR + "invalid-signature"), "signature for authentication request is invalid")
      cb(new WampError("invalid-signature", "signature for authentication request is invalid"));
      return;
    }

    // at this point, the client has successfully authenticated!
    console.log("Client " + client.id + " was authenticated.");

    // get the permissions we determined earlier
    //
    var perms = client._clientPendingAuth[2];

    // delete auth request and mark client as authenticated
    //
    var authKey = client._clientPendingAuth[0]['authkey'];
    client._clientAuthenticated = true;
    client._clientPendingAuth = null;
    if(client._clientAuthTimeoutCall !== null) {
      clearTimeout(client._clientAuthTimeoutCall);
      client._clientAuthTimeoutCall = null;  //TODO
    }

    // fire authentication callback
    //
    if (self.onAuthenticated && typeof(self.onAuthenticated) === 'function') { self.onAuthenticated(authKey, perms); }
    self.emit('authenticated', authKey, perms, client);

    // return permissions to client
    //
    cb(null, perms['permissions']);
    return;

  }
};
