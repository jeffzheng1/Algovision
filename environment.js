if (typeof(module) !== 'undefined') {
  var ExecError = require('./errors.js').ExecError;
}

/* Creates a root environment. */
function envRoot() {
  return {
    // The root doesn't have a parent. The `*parent` symbol is illegal in our
    // language, and thus safe to bind.
    '*parent': null,
    'depth': 0
  };
}

/* Extends the environment. */
function envExtend(parent, nodeEnv, depth, draw) {
  return {
    '*parent': parent,
    'nodeEnv': nodeEnv,
    'depth': depth,
    'draw': draw
  };
}

/* Binds a new value to the top frame. */
function envBind(frame, name, value) {
  if (frame.hasOwnProperty(name)) {
    throw new ExecError(name + " is already declared");
  }
  frame[name] = value;
}

/* Updates the value binding of a variable. */
function envUpdate(frame, name, value) {
  if (frame.hasOwnProperty(name)) {
    frame[name] = value;
  } else if (frame['*parent'] == null) {
    throw new ExecError(name + " is not declared");
  } else {
    envUpdate(frame['*parent'], name, value);
  }
}

function envObjectUpdate(frame, name, key, value) { 
  if (frame.hasOwnProperty(name)) {
    frame[name].put(key,value);
  } else if (frame['*parent'] == null) {
    throw new ExecError(name + " is not declared");
  } else {
    envObjectUpdate(frame['*parent'], name, key, value);
  }
}

/* Looks up the value of a variable. */
function envLookup(frame, name) {
  if (frame.hasOwnProperty(name)) {
    return frame[name];
  } else if (frame['*parent'] == null) {
    throw new ExecError(name + " is not declared");
  } else {
    return envLookup(frame['*parent'], name);
  } 
}

function envObjectLookup(frame, name, key) { 
  if (name.dict) { 
    return name.get(key);
  }
  if (frame.hasOwnProperty(name)) {
    return frame[name].get(key);
  } else if (frame['*parent'] == null) {
      throw new ExecError(name + " is not declared");
  } else {
    return envObjectLookup(frame['*parent'], name, key);
  } 
}

if (typeof(module) !== 'undefined') {
  module.exports = {
    root: envRoot,
    extend: envExtend,
    bind: envBind,
    update: envUpdate,
    lookup: envLookup,
    objectLookup: envObjectLookup,
    objectUpdate: envObjectUpdate
  };
}
