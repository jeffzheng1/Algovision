if (typeof(module) !== 'undefined') {
  var ExecError = require('./errors.js').ExecError;
}

function Table() {
	this.dict = {};
}

Table.prototype.put = function(key, value) {
  if (typeof key == "string") { 
    this.dict["." + key] = value;
  } else { 
    this.dict[key] = value;
  }
};

Table.prototype.has_key = function(key) {
  if (typeof key == "string") { 
    key = "." + key
  }
	return this.dict.hasOwnProperty(key) ? 1 : 0;
};

Table.prototype.get = function(key) {
  if (typeof key == "string" && key[0] != ".") { 
     key = "." + key
  }
  if (this.dict[key] != null) { 
    return this.dict[key];
  } else if (this.dict.hasOwnProperty(".__mt")) { 
    return this.dict[".__mt"].get(key);
  } else {
    if (this.dict.hasOwnProperty(key) == 0) {
      if (key[0] == ".") { 
         key = key.slice(1);
      } 
      throw new ExecError("Tried to get nonexistent key: "+ key);
    }
  }
};

Table.prototype.toString = function() {
    var string = "{";
    var first = true;
    for (key in this.dict) {
      if (!first) { 
        string = string + ", ";
      }
      first = false;
      if (key == null && this.dict[key] == null) { 
        var keyVal = "null: null";
      } else if (key == null) { 
        var keyVal = "null: " + this.dict[key].toString();
      } else if (this.dict[key] == null) { 
        if (key[0] == ".") { 
          var remove_ = key.slice(1);
          var keyVal = remove_.toString() + ": null";
        } else { 
          var keyVal = key.toString() + ": null";
        }
      } else if (key.toString() == '.__index') { 
        if (key[0] == ".") { 
          var remove_ = key.slice(1);
          var keyVal = remove_.toString() + ": " + "self";
        } else { 
          var keyVal = key.toString() + ": " + "self";
        }
      } else if (this.dict[key].type == "closure") { 
        if (key[0] == ".") { 
          var remove_ = key.slice(1);
          var keyVal = remove_.toString() + ": " + "Lambda";
        } else { 
          var keyVal = key.toString() + ": " + "Lambda";
        }
      } else if (this.dict[key] === this) {
        if (key[0] == ".") { 
          var remove_ = key.slice(1);
          var keyVal = remove_.toString() + ": self";
        } else { 
          var keyVal = key.toString() + ": self";
        }
      } else { 
        if (key[0] == ".") { 
          var remove_ = key.slice(1);
          var keyVal = remove_.toString() + ": " + this.dict[key].toString(); 
        } else {
          var keyVal = key.toString() + ": " + this.dict[key].toString(); 
        }
      }
      string = string + keyVal;
    }
    string = string + "}";
    return string;
};

Table.prototype.get_length = function() {
  var x = 0;
  for (x = 0; x < Object.keys(this.dict).length; x++) { 
    if (!this.dict.hasOwnProperty(x)) { 
      return x;
    }
  }
  return x;
};

Table.prototype.type = "table";

if (typeof(module) !== 'undefined') {
  module.exports = {
    Table: Table
  };
}
