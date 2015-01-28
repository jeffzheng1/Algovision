'use strict';
if (typeof(module) !== 'undefined') {
  var ExecError = require('./errors.js').ExecError;
  var desugarAST = require('./desugar.js').desugarAST;
  var env = require('./environment.js');
  var Table = require('./table.js').Table;
  var envRoot = env.root;
  var envExtend = env.extend;
  var envBind = env.bind;
  var envUpdate = env.update;
  var envLookup = env.lookup;
  var envObjectLookup = env.objectLookup;
  var envObjectUpdate = env.objectUpdate;
}

var interpret = function(asts, log, err) {

  var root = envRoot();
  root['*title'] = 'Root';

  // Returns a closure, a data structure which stores the param names
  // (id objects), the body of the function, and the referencing
  // environment, in which it was initialized --- (for lexical scoping).
  function makeClosure(names, body, env) {
    return {
      names: names,
      body: body,
      env: env,
      type: 'closure'
    };
  }

  function to164Object(o) {
    // convert a Python object to a suitable 164 object
    var type = typeof o;
    if (type === 'number') {
      return o;
    } else if (type === 'string') {
      return o;
    } else {
      // throw new ExecError('converting unknown type')
      console.log('converting unknown type');
      return null;
    }
  }

  function toJSObject(o) {
    // convert a Python object to a suitable 164 object
    var type = typeof o;
    if (type === 'number') {
      return o;
    } else if (type === 'string') {
      return o;
    } else {
      // throw new ExecError('converting unknown type')
      console.log('converting unknown type');
      return null;
    }
  }

  var drawable = []

  function make_drawable(f) {
      drawable.push(f.name);
  }

  function is_drawable(f) {
    for (var i in drawable) {
        if (drawable[i] == f.name) {
            return true;
        }
    }
    return false;
  }

  var drawstack = [];

  function make_drawstack(stack) {
    drawstack.push(stack);
  }

  var childCounter = -1;

  function evalBlock(t, env, draw, topLevelRecursion) {
    var last = null;
    t.forEach(function(n) {
      last = evalStatement(n, env, draw, topLevelRecursion);
    });
    return last;
  }

  // Base query string fro wolfram api accesses
  var BASEQUERY = 'http://localhost:9090/wolfram/';
  var tmpQ = BASEQUERY;

  // Initial problem size for use with recurrence calculating
  var INITSIZE = null;

  function getArg(node) {
    switch (node.type) {
      case 'id':
        return 'n';
      case 'int-lit':
        return node.value;
    }
  }

  function add_recurrence(nodeArgs, env) {
    switch (nodeArgs.type) {
      case '+':
      case '-':
      case '*':
      case '/':
        var arg1 = getArg(nodeArgs.operand1);
        var arg2 = getArg(nodeArgs.operand2);
        tmpQ += '%2Bg(' + arg1 + nodeArgs.type + arg2 + ')';
      break;
      case 'id':
        var val = envLookup(env, nodeArgs.name);
        switch (val.type) {
          case 'table':
            tmpQ += '%2Bg(' + 'n/' + INITSIZE / Object.keys(val.dict).length + ')';
            break;
        break;
        }
    }
  }

  function evalExpression(node, env, draw, topLevelRecursion) {
    switch (node.type) {
      case '+':
        var e1 = evalExpression(node.operand1, env, draw, topLevelRecursion);
        var e2 = evalExpression(node.operand2, env, draw, topLevelRecursion);
        if (((typeof(e1)  != 'string') && (typeof(e1) != 'number')) || ((typeof(e2) != 'string') 
            && (typeof(e2) != 'number'))) { 
          throw new ExecError("Operands to + must be numbers or strings.");
        }
        return e1 + e2;
      case '-': 
        var e1 = evalExpression(node.operand1, env, draw, topLevelRecursion);
        var e2 = evalExpression(node.operand2, env, draw, topLevelRecursion);
        if ((typeof(e1) != 'number') || (typeof(e2) != 'number')) { 
          throw new ExecError("Operands to - must be numbers.");
        }
        return e1 - e2;
      case '*': 
        var e1 = evalExpression(node.operand1, env, draw, topLevelRecursion);
        var e2 = evalExpression(node.operand2, env, draw, topLevelRecursion);
        if ((typeof(e1) != 'number') || (typeof(e2) != 'number')) { 
          throw new ExecError("Operands to * must be numbers.");
        }
        return e1 * e2;
      case '/': 
        var e1 = evalExpression(node.operand1, env, draw, topLevelRecursion);
        var e2 = evalExpression(node.operand2, env, draw, topLevelRecursion);
        if ((typeof(e1) != 'number') || (typeof(e2) != 'number')) { 
          throw new ExecError("Operands to / must be numbers.");
        } else if (e2 == 0) { 
          throw new ExecError("Division by zero");    
        } 
        return Math.floor(e1 / e2);
      case '==': 
        if (isIntStringTypeComparision(node)) { 
           return 0;
        }
        return evalExpression(node.operand1, env) == evalExpression(node.operand2, env) ? 1 : 0;
      case '!=': 
        if (isIntStringTypeComparision(node)) { 
           return 1;
        }
        return evalExpression(node.operand1, env) != evalExpression(node.operand2, env) ? 1 : 0;
      case '<=': 
        var e1 = evalExpression(node.operand1, env);
        var e2 = evalExpression(node.operand2, env);
        if ((typeof(e1) != 'number') || (typeof(e2) != 'number')) { 
          throw new ExecError("Operands to <= must be numbers.");
        }
        return e1 <= e2 ? 1 : 0;
      case '>=':
        var e1 = evalExpression(node.operand1, env);
        var e2 = evalExpression(node.operand2, env);
        if ((typeof(e1) != 'number') || (typeof(e2) != 'number')) { 
          throw new ExecError("Operands to >= must be numbers.");
        }
        return e1 >= e2 ? 1 : 0;
      case '<':
        var e1 = evalExpression(node.operand1, env);
        var e2 = evalExpression(node.operand2, env);
        if ((typeof(e1) != 'number') || (typeof(e2) != 'number')) { 
          throw new ExecError("Operands to < must be numbers.");
        }
        return e1 < e2 ? 1 : 0;
      case '>': 
        var e1 = evalExpression(node.operand1, env);
        var e2 = evalExpression(node.operand2, env);
        if ((typeof(e1) != 'number') || (typeof(e2) != 'number')) { 
          throw new ExecError("Operands to > must be numbers.");
        }
        return e1 > e2 ? 1 : 0;
      case 'exp':
        return evalExpression(node.body, env);
      case 'null': 
        return null;
      case "string-lit":
        return String(node.value);
      case "id":
        return envLookup(env, node.name);
      case "int-lit":
        return node.value;
      case "in": 
        return evalExpression(node.operand2, env).has_key(evalExpression(node.operand1, env));
      case "len": 
        return envLookup(env, node.dict.name).get_length();
      case "get": 
        return envObjectLookup(env, evalExpression(node["dict"], env), evalExpression(node.field, env)); 
      case "ite":
        var cond = evalExpression(node.condition, env);
        var ct = evalExpression(node.true,  env, draw, topLevelRecursion);
        var cf = evalExpression(node.false, env, draw, topLevelRecursion);
        if (cond == null) {
          cond = false;
        }
        if ((typeof cond != 'boolean') && (typeof cond != 'number')) {
          throw new ExecError('Condition not a boolean');
        }
        return cond ? ct : cf;
      case 'type':
        if (node.arguments[0].type == 'dict-lit') {
          return 'table';
        }
        return evalExpression(node.arguments[0], env).type;
      case "lambda":
        return makeClosure(node.arguments, node.body, env);
      case 'draw':
        if (node.arguments.length > 1) { 
          throw new ExecError('Draw takes in only one function call.');
        } else if (node.arguments.length == 0) { 
          throw new ExecError('Draw takes in one function call.');
        }
        env.isTopLevel = true;
        make_drawable(node.arguments[0].function);
        evalExpression(node.arguments[0], env);
         try {
           var req = new XMLHttpRequest();
           req.open("GET", tmpQ, false);
           req.send();
           var parser = new DOMParser();
           var xmlDoc = parser.parseFromString(req.responseText, "text/xml");
           var pods = xmlDoc.getElementsByTagName("pod");
           var image;
           var plot;
           for (var i = 0; i < pods.length; i++) {
             var at = pods[i].attributes;
             if (at[0].value == 'Recurrence equation solution') {
               image = pods[i].getElementsByTagName("img");
             } else if (at[0].value == 'Value plot and recurrence plot') {
               plot = pods[i].getElementsByTagName("img");
             }
           }
           if (image != null) {
             // console.log(image);
             log("Image");
             log("<img id ='runPic' src='" + image[0].attributes[0].value + "'>");
           } else if (image == null) { 
             log("Image");
             log("Wolfram did not could not generate a runtime.")
           }
           if (plot != null) {
             // console.log(plot);
             log("Plot");
             log("<img id ='plotPic' src='" + plot[0].attributes[0].value + "'>");
           } else if (plot == null) { 
             log("Plot");
             log("Wolfram did not could not generate a plot.")
           }
         } catch (e) {
             console.log(e);
         }
         tmpQ = BASEQUERY;
         INITSIZE = null;
        break;
      case "call":
        var depth = env.depth;
        var draw = env.draw;
        var argsList = [];
        var fn = evalExpression(node.function, env);
        if (fn.type && fn.type === 'closure') {
          var newEnv = envExtend(fn.env, childCounter, depth, draw);
          if (node.arguments.length != fn.names.length) {
              throw new ExecError('Wrong number of arguments');
          } else if (node.arguments) {
            if (node.arguments[0] && node.arguments[0].type == "empty-dict-lit") {
              var table = new Table();
              for (index in fn.body) { 
                if (fn.body[index].type == "exp") { 
                  break;
                }
                table.put(evalExpression(fn.body[index].field, env),
                          evalExpression(fn.body[index].value, env)); 
              }
              return table;
            }
            var pairs = zip([fn.names, node.arguments]);
            for (var index = 0; index < pairs.length; index++) {
              var result = evalExpression(pairs[index][1], env, draw, topLevelRecursion);
              if (node.function && (is_drawable(node.function) || env.draw) && node.function.name && node.function.name != "body" && node.function.name != "condition" && node.function.name[0] != "#") {
                argsList.push(result);
              }
              envBind(newEnv, pairs[index][0].name, result);
            }
          }
          if (node.function && (is_drawable(node.function) || env.draw) && node.function.name && node.function.name != "body" && node.function.name != "condition"
            && node.function.name[0] != "#") {
            if (topLevelRecursion && is_drawable(node.function)) {
                add_recurrence(node.arguments[0], env);
                topLevelRecursion = false;
            }
            childCounter++;
            draw = true;
            var args = "(";
            var argsDetail = "Arguments: <br>";
            var pairs = zip([fn.names, argsList]);
            for (var index = 0; index < pairs.length; index++) {
                var argEval = pairs[index][1];
                argsDetail += "&emsp;" + pairs[index][0].name + " = " + argEval + "<br>";
                args += argEval;
            }
            args += ")";
            if (args.length > 6) { 
              args = "*";
            }
            var name =  node.function.name;
            var deprecated;
            if (name) { 
              name = node.function.name.substring(0, 3);
              deprecated = name + " : " + node.function.name;
            }
            make_drawstack({ 
              "deprecated": deprecated,
              "nodeID": childCounter,
              "key": name + args,
              "children": [],
              "function": argsDetail,
              "depth": env.depth,
            })
            if (env.nodeEnv > -1) {
              drawstack[env.nodeEnv]["children"].push(childCounter);
            }
            depth++;
          }
          if (env.isTopLevel) {
            topLevelRecursion = true;
            var binding = envLookup(newEnv, fn.names[0].name);
            if (binding.type == 'table') {
              INITSIZE = binding.get_length();
            }
          }
          return evalBlock(fn.body, newEnv, draw, topLevelRecursion);
        } else {
          throw new ExecError('Trying to call non-lambda');
        }
        break;
      case 'native':
        var func = node.function.name;
        var args = node.arguments;
        var jsArgs = args.map(function(n) {
          return toJSObject(evalExpression(n, env));
        });
        var jsFunc = runtime[func];
        var ret = jsFunc.apply(null, jsArgs);
        return to164Object(ret);
    }
  }

  function isIntStringTypeComparision(node) { 
    if ((node.operand1.type == 'string-lit') && (node.operand2.type == 'int-lit')) { 
      return true;
    } else if ((node.operand1.type == 'int-lit') && (node.operand2.type == 'string-lit')) { 
      return true;
    }
    return false;
  }
  
  function zip(arrays) {
    return arrays[0].map(function(_, i) {
      return arrays.map(function(array) {return array[i]})
    });
  }

  function evalStatement(node, env, draw, topLevelRecursion) {
    switch (node.type) {
      case "get": 
        return envObjectLookup(env, evalExpression(node["dict"], env, draw), evalExpression(node.field, env, draw)); 
      case "put": 
        var name;
        if (node["dict"]["dict"]) {
          name = node["dict"]["dict"]["name"];
        } else {
          name = node["dict"]["name"];
        }
        envObjectUpdate(env, name, evalExpression(node.field, env, draw), evalExpression(node.value, env, draw));
        return null;
      case "def":
        envBind(env, node["name"]["name"], evalExpression(node.value, env, draw));
        return null;
      case "asgn":
        envUpdate(env, node["name"]["name"], evalExpression(node.value, env, draw));
        return null;
      case "print":
        var temp = evalExpression(node.value, env, draw)
        if (temp && temp.type == "closure") { 
          log("Lambda");
        } else if (temp != null) {
          log(temp.toString());
        } else {
          log(temp)
        }
        return null;
      case "error":
        throw new ExecError(evalExpression(node.message, env, draw));
      case "exp":
        return evalExpression(node.body, env, draw, topLevelRecursion);
      default:
        throw new Error(
          "What's " + node.type + "? " + JSON.stringify(node)
      );
    }
  }

  function desugarAll(remaining, desugared, callback) {
    if (remaining.length == 0) {
      setTimeout(function () {
        callback(desugared);
      }, 0);
      return;
    }

    var head = remaining.shift();
    desugarAST(head, function(desugaredAst) {
      desugared.push(desugaredAst);
      desugarAll(remaining, desugared, callback);
    });
  }

  desugarAll(asts, [], function(desugaredAsts) {
    for (var i = 0, ii = desugaredAsts.length; i < ii; ++i) {
      try {
        evalBlock(desugaredAsts[i], root, false, -1);
        var counter = 0;
        if (drawstack.length > 0) { 
          log("JSON");
          log(drawstack);
          drawstack = []
        }
      } catch (e) {
        if (e instanceof ExecError) {
          log('Error: ' + e.message);
        } else {
          throw e;
        }
      }
    }
  });
};

if (typeof(module) !== 'undefined') {
  module.exports = {
    'interpret': interpret
  };
}
