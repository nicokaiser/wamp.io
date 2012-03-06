
module.exports = function(client, args) {
  topicUri = args.shift();
  event = args.shift();

  // FIXME: validate and unfold URI

  this.publish(topicUri, event);
};
