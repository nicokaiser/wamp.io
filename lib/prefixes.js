
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

PrefixMap = function () {
    var self = this;
    self._index = {};
    self._rindex = {};
};

PrefixMap.prototype.get = function (prefix) {
    var self = this;
    return self._index[prefix];
};

PrefixMap.prototype.set = function (prefix, uri) {
    var self = this;
    self._index[prefix] = uri;
    self._rindex[uri] = prefix;
};

PrefixMap.prototype.setDefault = function (uri) {
    var self = this;
    self._index[""] = uri;
    self._rindex[uri] = "";
};

PrefixMap.prototype.remove = function (prefix) {
    var self = this;
    var uri = self._index[prefix];
    if (uri) {
        delete self._index[prefix];
        delete self._rindex[uri];
    }
};

PrefixMap.prototype.resolve = function (curie, pass) {
    var self = this;

    // skip if not a CURIE
    var i = curie.indexOf(":");
    if (i >= 0) {
        var prefix = curie.substring(0, i);
        if (self._index[prefix]) {
            return self._index[prefix] + curie.substring(i + 1);
        }
    }

    // either pass-through or null
    if (pass == true) {
        return curie;
    } else {
        return null;
    }
};

PrefixMap.prototype.shrink = function (uri, pass) {
    var self = this;

    for (var i = uri.length; i > 0; i -= 1) {
        var u = uri.substring(0, i);
        var p = self._rindex[u];
        if (p) {
            return p + ":" + uri.substring(i);
        }
    }

    // either pass-through or null
    if (pass == true) {
        return uri;
    } else {
        return null;
    }
};

exports.PrefixMap = PrefixMap;
