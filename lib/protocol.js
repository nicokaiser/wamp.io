
/*!
 * wamp.io: a node.js WAMP™ server
 * Copyright (c) 2012 Nico Kaiser <nico@kaiser.me>
 * MIT Licensed
 */

/**
 * Export protocol.
 */

 module.exports = {
    'TYPE_ID_WELCOME': 0
  , 'TYPE_ID_PREFIX': 1
  , 'TYPE_ID_CALL': 2
  , 'TYPE_ID_CALL_RESULT': 3
  , 'TYPE_ID_CALL_ERROR': 4
  , 'TYPE_ID_SUBSCRIBE': 5
  , 'TYPE_ID_UNSUBSCRIBE': 6
  , 'TYPE_ID_PUBLISH': 7
  , 'TYPE_ID_EVENT': 8
 };

var URI_WAMP_BASE = "http://api.wamp.ws/";
module.exports['URI_WAMP_BASE'] =  URI_WAMP_BASE;
// WAMP base URI for WAMP predefined things.

var URI_WAMP_ERROR = URI_WAMP_BASE + "error#";
module.exports['URI_WAMP_ERROR'] = URI_WAMP_ERROR;
// Prefix for WAMP errors.

module.exports['URI_WAMP_PROCEDURE'] = URI_WAMP_BASE + "procedure#";
//Prefix for WAMP predefined RPC endpoints.

module.exports['URI_WAMP_TOPIC'] = URI_WAMP_BASE + "topic#";
//Prefix for WAMP predefined PubSub topics.

module.exports['URI_WAMP_ERROR_GENERIC'] = URI_WAMP_ERROR + "generic";
//WAMP error URI for generic errors.

module.exports['DESC_WAMP_ERROR_GENERIC'] = "generic error"
//Description for WAMP generic errors.

module.exports['URI_WAMP_ERROR_INTERNAL'] = URI_WAMP_ERROR + "internal";
//WAMP error URI for internal errors.

module.exports['DESC_WAMP_ERROR_INTERNAL'] = "internal error";
//Description for WAMP internal errors.

module.exports['URI_WAMP_ERROR_NO_SUCH_RPC_ENDPOINT'] = URI_WAMP_ERROR + "NoSuchRPCEndpoint";
//WAMP error URI for RPC endpoint not found.

module.exports['WAMP_PROTOCOL_VERSION']         = 1;
//WAMP version this server speaks. Versions are numbered consecutively
//(integers, no gaps).
