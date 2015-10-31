

var id = 0;

var idHash = {};

var assignId = function (obj) {
  obj.id = id;
  idHash[id] = obj;
  id++;
};

var get = function (id) {
  return idHash[id];
};

Array.prototype.contains = function (el) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] === el) {
      return true;
    }
  }
  return false;
};

Array.prototype.union = function (arr) {
  var occHash = {};
  var newArr = [];
  this.forEach(function (el) {
    if (!occHash[el]) {
      newArr.push(el);
      occHash[el] = true;
    };
  });
  arr.forEach(function (el) {
    if (!occHash[el]) {
      newArr.push(el);
      occHash[el] = true;
    };
  });
  return newArr;
};

Array.prototype.unionById = function (arr) {
  var occHash = new SuperStateHash();
  var newArr = [];
  this.forEach(function (el) {
    if (!occHash.get([el])) {
      newArr.push(el);
      occHash.put([el], true);
    };
  });
  arr.forEach(function (el) {
    if (!occHash.get([el])) {
      newArr.push(el);
      occHash.put([el], true);
    };
  });
  return newArr;
};

Array.prototype._unionById = function (arr) {
  var occHash = new SuperStateHash();
  this.forEach(function (el) {
    occHash.put([el], true);
  });
  arr.forEach(function (el) {
    if (!occHash.get([el])) {
      this.push(el);
      occHash.put([el], true);
    };
  }.bind(this));
  return this
};

Array.prototype.uniq = function () {
  return this.union([]);
};

Array.prototype.keyify = function () {
  return this.map(function (el) {
    return el.id;
  })
};

Array.prototype.max = function () {
  var max = this[0];
  this.forEach(function (el) {
    if (el > max) {
      max = el;
    };
  });
  return max;
};

Array.prototype.min = function () {
  var min = this[0];
  this.forEach(function (el) {
    if (el < min) {
      min = el;
    };
  });
  return min;
};



String.prototype.parseIntArray = function () {
  return this.split(',').map(function (el) {
    return el.parseInt();
  });
};

String.prototype.parseStateSet = function () {
  return new Set(this.parseIntArray().map(function (int) {
    return get(int);
  }));
};

var Matrix = function (height, width) {
  this.matrix = [];
  for (var i = 0; i < height; i++) {
  var row = []
  this.matrix.push(row);
    for (var j = 0; j < width; j++) {
      row.push(0);
    };
  };
};



var State = function (transition, accept) {
  assignId(this);
  this._transitionGenerator = transition;
  this.accept = accept;
}

State.prototype.set = function () {
  if (!this.transition) {
    this.transition = this._transitionGenerator();
  }
  return this;
};

State.prototype.trans = function (char) {
  this.set();
  if (this.transition.$) {
    return this.transition.$
  } else {
    return this.transition[char]
  }
};

var StateHash = function () {
  this.hash = {};
};

StateHash.prototype.put = function (state, value) {
  this.hash[state.id] = value;
}

StateHash.prototype.get = function (state) {
  return this.hash[state.id];
}

var SuperStateHash = function () {
  this.hash = {};
}

SuperStateHash.prototype.put = function (array, value) {
  this.hash[SuperStateHash.toString(array.keyify())] = value;
}

SuperStateHash.prototype.get = function (array) {
  return this.hash[SuperStateHash.toString(array.keyify())];
}

SuperStateHash.toString = function (array) {
  var binaryArray = [];
  array.forEach(function (el) {
    if (binaryArray.length <= el) {
      while (binaryArray.length <= el) {
        binaryArray.push(0);
      }
    }
    binaryArray[el] = 1;
  });
  return binaryArray.join();
};

var DFA = function (start, alphabet) {
  this.start = start;
  this.alphabet = alphabet;

  this.currentState = this.start;
  this.alphabetHash = {};
  this.alphabet.forEach(function(char) {
    this.alphabetHash[char] = true;
  }.bind(this));
}
//
// var sinkState = function () {
//
// };
//
// var toSingleState = function (state) {
//
// };

DFA.set = function (states) {
  states.forEach(function (state) {
    state.set();
  });
}

DFA.prototype.eachState = function (callback) {
  var queue = [];
  var cache = {};
  queue.push(this.start);
  cache[this.start.id] = true;
  while (queue.length !== 0) {
    var state = queue.shift();
    state.set();
    callback(state);
    this.alphabet.forEach(function (char) {
      var destState = state.transition[char];
      if (!cache[destState.id]) {
        queue.push(state.transition[char]);
        cache[destState.id] = true;
      };
    });
  };
  return this;
};

DFA.prototype.getStates = function () {
  if (!this.states) {
  var states = [];
  this.eachState(function (state) {
    states.push(state);
  });
  this.states = states;
}
  return this.states
};

DFA.prototype.getAcceptStates = function () {
    if (!this.acceptStated) {
       this.getStates();
       var acceptStates = [];
       this.states.forEach(function(state) {
           if (state.accept) {
               acceptStates.push(state);
           };
       });
       this.acceptStates = acceptStates
    };
    return this.acceptStates;
};

DFA.prototype.transition = function (char) {
    var inAlphabet = true;
    this.alphabet.forEach(function(char) {

      if (!this.currentState.trans(char)) {
        inAlphabet = false;
        return;
      }
    }.bind(this))
    if (!inAlphabet) {
      this.currentState = this.start;
      throw 'missing transition';
    }
    this.currentState = this.currentState.trans(char);
  }
  // this.currentState = this.currentState.transition[char];

// }


DFA.prototype.evaluate = function (str) {
  var outsideAlphabet = false;
  str.split('').forEach(function(char) {
    if(!this.alphabetHash[char]) {
      outsideAlphabet = true;
      return;
    }
    this.transition(char);
  }.bind(this));
  if (outsideAlphabet) {
    this.currentState = this.start;
    throw 'input outside of alphabet';
  };
  var accepting = this.currentState.accept;
  this.currentState = this.start;
  return accepting;
};

var span = function (states, char) {
  var destinations = [];
  states.forEach(function (state) {
    destinations.push(state.transition[char]);
  });
  return destinations;
};
//
var CombinerBinary = function (dfa1, dfa2, predicate) {
  var span = function (states, char) {
    var destinations = [];
    states.forEach(function (state) {
      var destination = state.transition[char]
      if (destination) {
        destinations.push(state.transition[char]);
      }
    });
    // console.log(destinations);
    // console.log("-");
    return destinations;
  };

  var alphabet = dfa1.alphabet.union(dfa2.alphabet);
  var sinkState = new State(function () {
    var trans = {};
    alphabet.forEach(function (char) {
      trans[char] = sinkState;
    })
    return trans;
  }, false);

  var cache = new SuperStateHash()

  cache.put([], sinkState);
  return MachineDerivative({
    alphabet: alphabet,
    startStates: [dfa1.start, dfa2.start],
    cache: cache,
    predicate: predicate,
    span: span,
    close: function () {},
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = cache.get(pair[1]);
    },
    machineType: DFA
  })
};

var MachineDerivative = function (options) {
  var alphabet = options.alphabet;
  var startStates = options.startStates;
  var cache = options.cache;
  var predicate = options.predicate;
  var span = options.span;
  var close = options.close;
  var setTransition = options.setTransition;
  var machineType = options.machineType;
  var queue = [];

  close(startStates)
  queue.push(startStates);

  while (queue.length !== 0) {
    (function() {
    var sourceStates = queue.pop();
    DFA.set(sourceStates);
    var destStateMap = [];
    if (machineType === NFA) {
      for (k in sourceStates[0].transition) {
        var horizon = span(sourceStates, k);
        // close(horizon);
        destStateMap.push([k, horizon]);
      }
    } else {
      alphabet.forEach(function (char) {
        var horizon = span(sourceStates, char);
        close(horizon);
        destStateMap.push([char, horizon]);
      });
    }
    //construct composite state transition
    var stateTransition = function () {
      var trans = {};
      destStateMap.forEach(function (pair) {
        setTransition(pair, trans, cache);
      })
      return trans;
    };

    //construct composite state
    if (!cache.get(sourceStates)) {
      var sourceState = new State(stateTransition, sourceStates.map(function (state) {
        return state.accept;
      }).reduce(predicate));

      //cache composite state
      cache.put(sourceStates, sourceState);
    }

    destStateMap.forEach(function (pair) {
      var destStates = pair[1];
        if (!cache.get(destStates)) {
        queue.push(destStates);
      };
    })
  })();
  }
  return new machineType(cache.get(startStates), alphabet);
};

// DFA.prototype.reverse = function () {
//   var nfa = this.toNFA();
//
//   nfa.getStates().forEach(function (state) {
//
//   })
// }


var Combiner = function () {
  var args = Array.prototype.slice.call(arguments);
  var dfas = args.slice(1)
  var op = args[0];
  return dfas.reduce(function (x, y) {
    return CombinerBinary(x, y, op);
  });
};

DFA.prototype.union = function (dfa) {
  return CombinerBinary(this, dfa, function (x, y) {
    return x || y;
  });
};

DFA.prototype.intersect = function (dfa) {
  return CombinerBinary(this, dfa, function (x, y) {
    return x && y;
  });
};

DFA.prototype.takeAway = function (dfa) {
  return CombinerBinary(this, dfa, function (x, y) {
    return x && !y;
  });
};

DFA.prototype.algebraify = function () {
 return FAAR.algebraify(this);
};

DFA.union = function () {
  var dfas = Array.prototype.slice.call(arguments);
  dfas.unshift(function (x, y) {
    return x || y;
  });
  return Combiner.apply(undefined, dfas);
};

DFA.prototype.toNFA = function () {
  return MachineDerivative({
    alphabet: this.alphabet,
    startStates: [this.start],
    cache: new SuperStateHash(),
    predicate: function () {},
    span: function (state, char) {
      state[0].set();
      return [state[0].transition[char]];
    },
    close: function () {},
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = [cache.get(pair[1])];
    },
    machineType: NFA
  });
};

DFA.prototype.set = function () {
  this.eachState(function (state) {
    state.set();
  });
};

//finite automaton algebraic representation
var FAAR = function (numStates, transitions, startKey, alphabet, acceptStates) {
  this.numStates = numStates;

  // { a: matrixa, b: matrixb, ... }
  this.transitions = transitions;
  this.startKey = startKey;
  this.alphabet = alphabet;
  this.acceptStates = {};
  acceptStates.forEach(function (key) {
    this.acceptStates[key] = true;
  }.bind(this));
};

FAAR.algebraify = function (dfa) {
  var states = dfa.getStates();
  var statesMap = {};
  states.forEach(function (state, i) {
    statesMap[state.id] = i;
  });
  var alphabet = dfa.alphabet;
  var transitions = {};

  alphabet.forEach(function (char) {
    var transition = [];
    transitions[char] = transition;
    for (var i = 0; i < states.length; i++) {
      var stateRow = [];
      transition.push(stateRow);
      for (var j = 0; j < states.length; j++) {
        stateRow.push(0);
      };
    };
  });

   alphabet.forEach(function (char) {
     var transition = transitions[char];
     states.forEach(function (state, i) {
      var destStateKey = statesMap[state.transition[char].id];
      transition[i][destStateKey] = 1;
     });
   })
  return new FAAR(states.length, transitions, statesMap[dfa.start.id], alphabet, dfa.getAcceptStates().map(function(state) {
      return statesMap[state.id];
  }));
};

FAAR.machineify = function (alg) {
  var faar = alg;
  return alg.machineify();
};

FAAR.prototype.machineify = function () {
  var cache = {};
  var range = [];
  for (var i= 0; i < this.numStates; i++) {
    range.push(i);
  }
  while (range.length !== 0) {
    (function () {
      var stateKey = range.pop();

      var stateTransition = function () {
        var trans = {};
        this.alphabet.forEach(function (char) {
          var destStateKey = 0;
          this.transitions[char][stateKey].forEach(function (el, i) {
            if (el) {
              destStateKey = i;
              return;
            };
          });
          trans[char] = cache[destStateKey];
        }.bind(this))
        return trans;
      }.bind(this);

    cache[stateKey] = new State(stateTransition, !!this.acceptStates[stateKey]);
    }.bind(this))();

  }
  return new DFA(cache[this.startKey], this.alphabet);
};



var evenZeros = new State(function () {return {0: oddZeros, 1: evenZeros}}, true);

var oddZeros = new State(function () {return {0: evenZeros, 1: oddZeros}}, false);
//

var evenOnes = new State(function () {return {0: evenOnes, 1: oddOnes}}, true);

var oddOnes = new State(function () {return {0: oddOnes, 1: evenOnes}}, false);

var evenlyManyZeros = new DFA(evenZeros, ['0', '1']);
//


var evenlyManyOnes = new DFA(evenOnes, ['0', '1']);

//
var ifEvenlyMany = evenlyManyZeros.union(evenlyManyOnes);
//
// var ifEvenlyManyG = DFA.union(evenlyManyZeros, evenlyManyOnes, evenlyManyOnes);

var faar = new FAAR(2, {a: [[0, 1], [1, 0]], b: [[1, 0], [0,1]]}, 0, ['a', 'b'], [0])






var NFA = function (start, alphabet) {
  this.start = start;
  this.alphabet = alphabet;

  this.currentState = this.start;
  this.alphabetHash = {};
  this.alphabet.forEach(function(char) {
    this.alphabetHash[char] = true;
  }.bind(this));
}


Array.prototype.or = function () {
  this.reduce(function (x, y) {
    x || y;
  });
};

State.prototype.hasTransition = function (char) {
  this.set();
  return this.transition[char] && this.transition[char].length > 0;
}

NFA.prototype.eachState = function (callback) {
  this.start.span({callback: callback, alphabet: this.alphabet});
  return this;
}

NFA.prototype.path = function (str) {
  var currentState = this.start
  var insts = str.split(" ")

  insts.forEach(function (num, i) {
    if ((i + 1) % 2 !== 0) {
      currentState = currentState.trans(num)[insts[i + 1]];
    };
  });
  return currentState
};

//use this in DFA

State.prototype.span = function (options) {
  if (options) {
    var callback = options.callback;
    var epsilon = options.epsilon;
    var alphabet = options.alphabet;
  }
  var queue = [];
  var cache = {};
  queue.push(this);
  cache[this.id] = true;
  while (queue.length !== 0) {
    var state = queue.shift();
    state.set();
    if (callback) {
    callback(state);
    }
    if (epsilon) {
      var destStates = state.transition["_"];
      if (state.hasTransition("_")) {
        destStates.forEach(function (destState) {
          if (!cache[destState.id]) {
            queue.push(destState);
            cache[destState.id] = true;
          }
        });
      };
      //code is copied
    }  else {
      alphabet.forEach(function (char) {
        var destStates = state.transition[char];
        if (state.hasTransition(char)) {
          destStates.forEach(function (destState) {
            if (!cache[destState.id]) {
              queue.push(destState);
              cache[destState.id] = true;
            }
          });
        };
      });
      var destStates = state.transition["_"];
      if (state.hasTransition("_")) {
        destStates.forEach(function (destState) {
          if (!cache[destState.id]) {
            queue.push(destState);
            cache[destState.id] = true;
          }
        });
      };
    };
  };
};

State.prototype.epsilonIter = function (callback) {
  this.span({callback: callback, epsilon: true});
};

State.prototype.epsilonSpan = function () {
  var destState = [];
  this.epsilonIter(function (state) {
    destState.push(state);
  });
  return destState;
}


NFA.epsilonSpan = function (states) {
  if (states.length === 0) {
    return [];
  } else if (states.length === 1) {
    return states[0].epsilonSpan();
  } else {
    return states.map(function (state) {
      return state.epsilonSpan();
    }).reduce(function (left, right) {
      return left.unionById(right);
    })
  }
};

NFA.set = function (states) {
  states.forEach(function (state) {
    state.set();
  });
};


NFA.prototype.getStates = function () {
  // if (!this.states) {
  var states = [];
  this.eachState(function (state) {
    states.push(state);
  });
  // this.states = states;
// }
  // return this.states
  return states;
};

NFA.prototype.getAcceptStates = function () {
  var acceptStates = [];
  this.eachState(function (state) {
    if (state.accept) {
      acceptStates.push(state)
    };
  });
  return acceptStates;
};

NFA.prototype.dup = function () {
  this.start.set();
  return MachineDerivative({
    alphabet: this.alphabet,
    startStates: [this.start],
    cache: new SuperStateHash(),
    predicate: function () {},
    span: function(states, char) {
        return states[0].transition[char];
    },
    close: function () {},
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = pair[1].map(function (state) {
        return cache.get([state]);
      });
    },
    machineType: NFA
  });
};

DFA.prototype.dup = function () {
  this.start.set();
  return MachineDerivative({
    alphabet: this.alphabet,
    startStates: [this.start],
    cache: new SuperStateHash(),
    predicate: function () {},
    span: function(states, char) {
      return [states[0].transition[char]];
    },
    close: function () {},
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = cache.get(pair[1]);
    },
    machineType: DFA
  });
};

NFA.prototype.toDFA = function () {
  var span = function (states, char) {
    // console.log('states:');
    // console.log(states);
    // console.log("_");
    var destinations = [];
    states.forEach(function (state) {
      state.set()
      var destination = state.transition[char]
      // console.log('destinations:');
      // console.log(destinations);
      // console.log("-");
      // console.log('char:');
      // console.log(char);
      // console.log("-");
      // console.log('destination:')
      // console.log(destination);
      // console.log("-----");
      if (destination) {
        // destinations = destinations.unionById(destination);
        destinations._unionById(destination);
      }
    });
    // console.log('result:');
    // console.log(destinations);
    // console.log("-------------------");
    return destinations;
  }
  var alphabet = this.alphabet
  var sinkState = new State(function () {
    var trans = {};
    alphabet.forEach(function (char) {
      trans[char] = sinkState;
    })
    return trans;
  }, false);

  var cache = new SuperStateHash();
  cache.put([], sinkState);
  this.start.set();
  return MachineDerivative({
    alphabet: this.alphabet,
    startStates: NFA.epsilonSpan([this.start]),
    cache: cache,
    predicate: function (x, y) { return x || y },
    span: span,
    close: function (states) {
      states._unionById(NFA.epsilonSpan(states))
    },
    setTransition: function (pair, trans, cache) {
      trans[pair[0]] = cache.get(pair[1]);
    },
    machineType: DFA
  });
};

DFA.prototype.star = function () {
  return this.toNFA()._star().toDFA();
};

DFA.prototype.starPlus = function () {
  return this.concatenate(this.star()).toDFA();
};

Array.prototype.takeAway = function (arr) {
  var result = [];
  var out = {};
  arr.forEach(function (el) {
    out[el] = true;
  });
  this.forEach(function (el) {
    if (!out[el]) {
      result.push(el);
    };
  });
  return result
};

DFA.prototype.concatenate = function (dfa) {
  return (this.toNFA()._concatenate(dfa.toNFA())).toDFA();
};

NFA.prototype._star = function () {
  var result = this.dup();
  result.eachState(function (state) {
    if (state.accept) {
      if (state.transition["_"]) {
        state.transition["_"].push(result.start);
      } else {
        state.transition["_"] = [result.start];
      }
    };
  });
  result.start.accept = true;
  return result
};

NFA.prototype._concatenate = function (nfa) {
  var result = this.dup();
  result.alphabet = result.alphabet.union(nfa.alphabet);
  var leftStates = result.getStates();
  leftStates.forEach(function (state) {
    if (state.accept) {
      if (state.transition["_"]) {
        state.transition["_"].push(nfa.start);
      } else {
        state.transition["_"] = [nfa.start];
      }
      state.accept = false;
    };
  })
  return result;
};

NFA.prototype.union = function (nfa) {
  var start = new State(function () {
    var t = {}
    t._ = [this.start, nfa.start];
    return t;
  }.bind(this), false);
  return new NFA(start, this.alphabet.union(nfa.alphabet));
}

// NFA.prototype._starPlus = function () {
//   var one = this.dup();
//   return one._concatenate(this._star())
// }
//
// NFA.prototype.pow = function (e) {
//   var base = this.dup();
//   var power = this.dup();
//   for (var i = 0; i < e; i++) {
//     power = power._concatenate(base);
//   };
//   return power;
// };

NFA.prototype.choice = function () {
  var choiceNFA = this.dup();
  choiceNFA.start.accept = true;
  return choiceNFA;
};

var evenlyManyZerosNFA = evenlyManyZeros.toNFA()
var evenlyManyOnesNFA = evenlyManyOnes.toNFA()

var unionStart = new State(function () {return {"_": [evenlyManyZerosNFA.start, evenlyManyOnesNFA.start]}}, false);

var unionNFA = new NFA(unionStart, ['0', '1']);

var unioned = unionNFA.toDFA()


var concatenatedNFA = evenlyManyZerosNFA._concatenate(evenlyManyOnesNFA);

var concatenated = evenlyManyZeros.concatenate(evenlyManyOnes);

var unioned = evenlyManyZeros.union(evenlyManyOnes);

var starred = evenlyManyZeros.star();

function Atom(char) {
  this.exp = char;
};

Atom.prototype.toDFA = function () {
  var start = new State(function () {
    var t = {};
    t[this.exp] = final;
    return t;
  }.bind(this), false);

  var final = new State(function () {
    var t = {};
    t[this.exp] = sink;
    return t;
  }.bind(this), true);

  var sink = new State(function () {
    var t = {};
    t[this.exp] = sink;
    return t;
  }.bind(this), false);

  return new DFA(start, [this.exp]);
};

Atom.prototype.toNFA = function () {
  var start = new State(function () {
    var t = {}
    t[this.exp] = [last];
    return t;
  }.bind(this), false);

  var last = new State(function () {
    return {};
  }, true);
  return new NFA(start, [this.exp]);
};

function Word(word) {
  this.exp = word;
}

Word.prototype.toNFA = function () {
  var word = this.exp
  var last = new State();
  var arr = this.exp.split('');
  last.accept = true;
  last.transition = {};
  var cache = {'0': last};

  for (var i = 1; i <= word.length; i++) {
    var state = new State();
    state.accept = false;
    var t = {};
    t[word[word.length - i]] = [cache[i - 1]];
    state.transition = t
    cache[i] = state;
  };
  return new NFA(cache[word.length], arr);
};

var one = new Atom("1").toDFA();
var zero = new Atom("0").toDFA();

var ones = one.star();

var zeros = zero.star();

var onesThenZeros = ones.concatenate(zeros)

var oneThenZero = one.concatenate(zero);

var oneNFA = one.toNFA();

var zeroNFA = zero.toNFA();

var oneThenZeroNFA = oneNFA._concatenate(zeroNFA)

function Star(exp) {
  this.exp = exp;
};

function Regex(exp) {
  this.exp = exp;
};

Regex.prototype.toDFA = function () {
  return this.exp.toNFA().toDFA();
};

Regex.prototype.toNFA = function () {
  return this.exp.toNFA();
}

Star.prototype.toDFA = function () {
  return this.exp.toDFA().star()
}

Star.prototype.toNFA = function () {
  return this.exp.toNFA()._star();
}

function Concat(left, right) {
  this.left = left;
  this.right = right;
};

Concat.prototype.toDFA = function () {
  return this.left.toDFA().concatenate(this.right.toDFA())
}

Concat.prototype.toNFA = function () {
  return this.left.toNFA()._concatenate(this.right.toNFA())
}

function Union(left, right) {
  this.left = left;
  this.right = right;
};

Union.prototype.toDFA = function () {
  return this.left.toDFA().union(this.right.toDFA())
};

Union.prototype.toNFA = function () {
  return this.left.toNFA().union(this.right.toNFA())
};

function Choice(exp) {
  this.exp = exp;
};

Choice.prototype.toNFA = function () {
  return this.exp.toNFA().choice();
};

Regex.lexFirst = function (str) {
  var special = ['*', '+', '?', '@', '.', '|', '(', ')', '[', ']', '{', '}'];
  var digits = '0123456789'.split('');
  var inputArr = str.split('');
  function notSpecial(char) {
    return !special.contains(str[i]);
  };

  function isDigit(char) {
    return digits.contains(str[i]);
  };

  var result = [];
  var i = 0;
  while (i < str.length) {
    var block = '';
    if (notSpecial(str[i])) {
      while (i < str.length && notSpecial(str[i])) {
        block = block + str[i];
        i++;
      };
      if (str[i] === '*' | str[i] == '?' | str[i] == '+') {
        var atom = block[block.length - 1];
        block = block.slice(0, block.length - 1);
        if (str[i] === '*') {
          result.push(new Star(new Atom(atom)).toNFA());
        } else if (str[i] === '?') {
          result.push(new Choice(new Atom(atom)).toNFA());
        } else if (str[i] === '+') {
          result.push((new Atom(atom).toNFA().pow())._concatenate(new Atom(atom)._star()));
        }
        result.push(new Word(block).toNFA());
        i++;
      } else {
      result.push(new Word(block).toNFA());
      }
    } else if (str[i] === '{') {
      i++;
      var numString = '';
      if (!isDigit(str[i]) || str[i] === '0') {
        throw 'invalid multiplier';
        return;
      };
      while (i < str.length && str[i] !== '}') {
        if (!isDigit(str[i]) || !notSpecial(str[i])) {
          throw 'invalid multiplier';
          return;
        }
        numString = numString + str[i];
        i++;
      };
      if (i === str.length) {
        throw 'unclosed multiplier bracket';
        return;
      }
      i++;
      result.push(parseInt(numString));
    }
    else if (str[i] === '[') {
      var complement = false;
      var block = '';
      i++;
      if (str[i] === '^') {
        complement = true;
        i++;
      }
      while (1 < str.length && str[i] !== ']') {
        if (!notSpecial(str[i])) {
          throw 'invalid set'
          return;
        }
        block = block + str[i];
        i++;
      }
      if (i === str.length) {
        throw "unclosed '['"
        return;
      };
      var union = block.split('').map(function (char) {
        return new Atom(char);
      }).reduce(function (left, right) {
        return new Union(left, right);
      });
      if (complement) {
        // result.push(everything.takeAway(union))
      } else {
        result.push(union);
      }
      i++;
    }
    // else if (str[i] === '.') {
    //   result.push(anything);
    //   i++;
    // }
    else if (str[i] === ']' || str[i] == '}') {
      throw "unclosed '[' or '{'";
      return
    }
    else {
      result.push(str[i]);
      i++;
    }
  }
  return result;
};

Regex.lexSecond = function (arr) {
arr.forEach(function () {

})
}

function process(operators, precedenceMap) {

};

function parse(operators, precedenceMap, special, operations) {

};

var oneAtom = new Atom("1");

var zeroAtom = new Atom("0");

var onesRegex = new Star(oneAtom);

var zerosRegex = new Star(zeroAtom);

var regex = new Union(new Concat(new Star(new Atom("1")), new Star(new Atom("0"))), new Atom ("a"));

var unex = new Union(new Atom("1"), new Atom("0"));

var sandwich = new Concat(new Concat(zeroAtom,  new Star(oneAtom)), zeroAtom);

var center = new Star(sandwich);

var evenZerosRegex = new Regex(new Star(new Concat(onesRegex, new Concat(center, onesRegex))));
//
// var wildStart = new State(function () {
//   return {$: seen};
// }, false);
//
// var wildSeen = new State(function () {
//   return {$: seen};
// }, true);
//
// var wildSink = new State(function () {
//   return {$: wildSink};
// });
//
// var wild = new DFA(wildStart, [])
