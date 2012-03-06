
module.exports = function(client, args) {
  prefix = args.shift();
  uri = args.shift();

  // FIXME: verify that prefix, uri are valid URIs/CURIEs

  client.prefix[prefix] = uri;
};
