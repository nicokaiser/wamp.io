
/*!
 * wamp.io: a node.js WAMP™ server
 * Copyright (c) 2012 Nico Kaiser <nico@kaiser.me>
 * MIT Licensed
 */

/**
 * Shrink given URI to CURIE. If no appropriate prefix mapping 
 * is available, return original URI.
 *
 * @param {String} uri
 * @return {String} CURIE or original URI
 */

exports.shrink = function(uri) {
  return uri; // TODO
};

/**
 * Resolve given CURIE to full URI.
 *
 * @param {String} curie (i.e. "rdf:label")
 * @return {String} Full URI or null
 */

exports.resolve = function(curie) {
  return null; // TODO
};

/**
 * Resolve given CURIE/URI and return string verbatim if cannot be resolved.
 *
 * @param {String} curieOrUri
 * @return {String} Full URI for CURIE or original string
 */

exports.resolveOrPass = function(curieOrUri) {
  var u = exports.resolve(curieOrUri);
  u = u || curieOrUri;
  return u;
};
