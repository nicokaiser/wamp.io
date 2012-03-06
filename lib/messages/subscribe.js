
module.exports = function(client, args) {
  topicUri = args.shift();

  // FIXME: validate and unfold URI

  client.topics[topicUri] = true;
  if (typeof this.topics[topicUri] === 'undefined') this.topics[topicUri] = {};
  this.topics[topicUri][client.id] = true;
};
