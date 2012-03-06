
module.exports = function(client, args) {
  callId = args.shift();
  procUri = args.shift();
  args = args || [];

  if (! callId) {
    return client.emit('error', 'CALL message without callID');
  }
  if (! procUri) {
    return client.emit('error', 'CALL message without procURI');
  }

  // Callback function
  cb = function(err, result) {
    var msg;
    if (err) {
      msg = [4, callId, err.toString()]; // 4: CALL_ERROR
    } else {
      msg = [3, callId, result]; // 3: CALL_RESULT
    }
    client.send(JSON.stringify(msg));
  };

  this.emit('call', procUri, args, cb);
};
