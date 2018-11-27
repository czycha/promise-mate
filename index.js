'use strict';

var isEqual = require('fast-deep-equal');

function isPrimitive(test) {
  return (test !== Object(test));
}

function pushIfAbsent(arr, val) {
  var indexOf = -1;
  if (isPrimitive(val)) {
    indexOf = arr.indexOf(val);
  } else {
    for(var i = 0; i < arr.length; i++) {
      if (isEqual(arr[i], val)) {
        indexOf = i;
        break;
      }
    }
  }
  if (indexOf === -1) {
    arr.push(val);
  }
  return indexOf === -1 ? (arr.length - 1) : indexOf
}

var Mate = function (definitions) {
  this.definitions = definitions || {};
};

Mate.prototype.define = function (key, definition) {
  this.definitions[key] = definition;
  return this;
};

Mate.prototype.undefine = function (key) {
  delete this.definitions[key];
  return this;
};

Mate.prototype.all = function (actions) {
  return Mate.all(this.definitions, actions);
};

Mate.all = function (definitions, actions) {
  var actionsLen = actions.length;
  var requirements = [];
  var map = [];
  for (var i = 0; i < actionsLen; i++) {
    var action = actions[i];
    var actionMap = [];
    if (!Array.isArray(action.requires)) {
      actionMap.push(pushIfAbsent(requirements, action.requires));
    } else {
      var requiresLen = action.requires.length;
      for (var j = 0; j < requiresLen; j++) {
        actionMap.push(pushIfAbsent(requirements, action.requires[j]));
      }
    }
    map.push(actionMap);
  }

  var promises = [];
  var requiresLen = requirements.length;
  for(var j = 0; j < requiresLen; j++) {
    var req = requirements[j];
    if ('string' === (typeof req) && definitions.hasOwnProperty(req)) {
      promises.push(definitions[req]());
    } else {
      promises.push(req);
    }
  }

  return Promise
    .all(promises)
    .then(function (results) {
      var ret = [];
      for (var k = 0; k < actionsLen; k++) {
        var action = actions[k];
        var reqIndexes = map[k];
        var args = [];
        var reqsLen = reqIndexes.length;
        for (var l = 0; l < reqsLen; l++) {
          args.push(results[reqIndexes[l]]);
        }
        ret.push('function' === typeof action.then ? action.then.apply(null, args) : action.then);
      }
      return ret;
    });
};

module.exports = Mate;
