
module.exports = function(client, args) {
  topicUri = args.shift();

  // FIXME: validate and unfold URI

  delete client.topics[topicUri];
  delete this.topics[topicUri][client.id];
};
