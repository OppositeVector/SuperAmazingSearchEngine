var tokenizerModule = require("./Tokenizer");
var sortModule = require("./Sort");
// var setModule = require("./Set");
var hasher;

var empty = exports.empty = "ε";
var start = exports.start = "$";

var quickSearchStructure = {
	name: "Name of the expression",
	type: "0 for terminals, 1 for non-terminals",
	arr: "Array containing all rules and terminals that have this name",
	first: "All the terminals that this expression can start with"
}

var NameType = {
	token: 0,
	rule: 1
}

try {
	hasher = require("./Hash");
} catch(err) {
	console.log(err);
	hasher = new (function() {
		this.HashSring = function(str) {
			var h = 5318;
			var m = 33;
			for(var i = 0; i < str.length; ++i) {
				h = (m * h) + str.charCodeAt(i);
			}
			return h;
		}
	});
}

function DeepCopy(from, to)
{
    if (from == null || typeof from != "object") return from;
    if (from.constructor != Object && from.constructor != Array) return from;
    if (from.constructor == Date || from.constructor == RegExp || from.constructor == Function ||
        from.constructor == String || from.constructor == Number || from.constructor == Boolean)
        return new from.constructor(from);

    to = to || new from.constructor();

    for (var name in from)
    {
        to[name] = typeof to[name] == "undefined" ? DeepCopy(from[name], null) : to[name];
    }

    return to;
}

function CheckCapital(letter) {
	return (letter >= "A" && letter <= "Z");
}

function CreateHashes(rulesSet) {

	for(var i = 0; i < rulesSet.length; ++i) {
		rulesSet[i].hash = hasher.HashSring(rulesSet[i].pattern);
	}

	if(sortModule.QuickSort(rulesSet, function(a, b) {
		return (b.hash - a.hash);
	})) {
		throw Error("The hashing algorithm used created a duplicate with this rules set, use another hashing algorithm");
	}

}


// Joins two arrays, excluding all duplicate elements and excluding any element in "exclude" (array) parameter
function JoinExclusivly(a, b, exclude) {

    if(a.length == 0) {
    	return b.concat();
    } else if( b.length == 0) {
    	return a.concat();
    }

    if(exclude == null) {
    	exclude = [];
    }

    var retVal = [];

    // go through all the elements of a
    for(var i = 0; i < a.length; ++i) {
    	// if a's value is not a duplicate and its not empty, then add it
        if((exclude.indexOf(a[i]) == -1) && (retVal.indexOf(a[i]) == -1)) { 
        	retVal.push(a[i]);
        }

    }

    // go through all the elements of b
    for(var i = 0; i < b.length; i++){
        // if b's value is not in a and its not empty, then add it
        if((exclude.indexOf(b[i]) == -1) && (retVal.indexOf(b[i]) == -1)) { 
        	retVal.push(b[i]);
        }
    }

    return retVal;

}

function ConsolidateIntArray(arr) {

	console.log(arr);

	var retVal = [];

	for(var i = 0; i < arr.length; ++i) {
		if(arr[i].constructor === Array) {
			console.log("ARRAY");
			var returned = ConsolidateIntArray(arr[i]);
			console.log("returned");
			console.log(returned);
			for(var j = 0; j < returned.length; ++j) {
				if(retVal.indexOf(returned[j]) == -1) {
					retVal.push(returned[j]);
				}
			}
		} else {
			console.log("NOT ARRAY");
			if(retVal.indexOf(arr[i]) == -1) {
				retVal.push(arr[i]);
				console.log(" HERE ");
			}
			console.log(retVal);
		}
	}

	return retVal;

}

function FindIndex(arr, comparer) {

	for(var i = 0; i < arr.length; ++i) {
		if(comparer(arr[i])) {
			return i;
		}
	}

	return -1;

}

function SplitRules(ruleSet) {

	for(var i = 0; i < ruleSet.length; ++i) {

		var split = ruleSet[i].def.split("|");
		if(split.length > 1) {

			ruleSet[i].def = split[0].trim();
			for(var j = 1; j < split.length; ++j) {
				var newRule = DeepCopy(ruleSet[i]);
				newRule.def = split[j].trim();
				ruleSet.push(newRule);
			}

		}

	}

}

function BreakDownDefinitions(ruleSet, nameEnum) {

	for(var i = 0; i < ruleSet.length; ++i) {
		ruleSet[i].brokenDef = ruleSet[i].def.split(/[\s]+/);
		ruleSet[i].brokenDefEnum = [];
		for(var j = 0; j < ruleSet[i].brokenDef.length; ++j) {
			ruleSet[i].brokenDefEnum.push(FindIndex(nameEnum, function(ele) {
				return (ruleSet[i].brokenDef[j].localeCompare(ele.name) == 0);
			}));
		}
	}

}

// function CreateEnumeration(tokens, rules, nameEnum) {

// 	nameEnum.push({ name: empty });
// 	var index = 1;

// 	for(var i = 0; i < tokens.length; ++i) {

// 		var mapped = FindIndex(nameEnum, function(ele) {
// 			return (ele.name.localeCompare(tokens[i].name) == 0);
// 		});

// 		if(mapped == -1) {
// 			nameEnum.push({ name: tokens[i].name, type: NameType.token });
// 			tokens[i].enum = index;
// 			++index;
// 		} else {
// 			tokens[i].enum = mapped;
// 		}

// 	}

// 	for(var i = 0; i < rules.length; ++i) {

// 		var mapped = FindIndex(nameEnum, function(ele) {
// 			return (ele.name.localeCompare(rules[i].name) == 0);
// 		});

// 		if(mapped == -1) {
// 			nameEnum.push({ name: rules[i].name, type: NameType.rule });
// 			rules[i].enum = index;
// 			++index;
// 		} else {
// 			rules[i].enum = mapped;
// 		}

// 	}

// }

function CalculateFirst(rule, qsSet) {

	if(rule.first == null) {
		if(rule.type == NameType.token) {
			rule.first = [ rule.arr[0].index ];
		} else {

			var firsts = [];
			var emptyCheck = false;
			for(var i = 0; i < rule.arr.length; ++i) {

				var internalEmptyCheck = true;
				for(var j = 0; j < rule.arr[i].brokenDefEnum.length; ++j) {

					var foundf = CalculateFirst(qsSet[rule.arr[i].brokenDefEnum[j]], qsSet);
					console.log(foundf + ", on rule:" + rule.arr[i].name + ", on name:" + rule.arr[i].brokenDef[j]);
					firsts = JoinExclusivly(firsts, foundf, [ 0 ]);
					if(FindIndex(foundf, function(ele) { return (ele == 0); }) == -1) {
						internalEmptyCheck = false;
						console.log("break");
						break;
					}

				}

				// If one of the rules has empty as a first then this entire non-terminal has empty as a first
				if(internalEmptyCheck == true) {
					emptyCheck = true;
				}

			}

			if(emptyCheck == true) {
				firsts.push(0);
			}
			rule.first = firsts;

		}
	}

	return rule.first;

}

function CalculateFollow(qsSet) {

	for(var i = 0; i < qsSet.length; ++i) {
		if(qsSet[i].type == NameType.rule) {

			if(qsSet[i].follow == null) {
				qsSet[i].follow = [];
			}

			if(qsSet[i].name.localeCompare("start") == 0) {
				qsSet[i].follow = [ [ 1 ] ];
			}

			for(var j = 0; j < qsSet[i].arr.length; ++j) {
				for(var k = 0; k < qsSet[i].arr[j].brokenDefEnum.length; ++k) {
					var checked = qsSet[qsSet[i].arr[j].brokenDefEnum[k]];
					if(checked.type == NameType.rule) {
						if(checked.follow == null) {
							checked.follow = [];
						}
						var l = k + 1;
						while(l != (qsSet[i].arr[j].brokenDefEnum.length)) {
							var next = qsSet[qsSet[i].arr[j].brokenDefEnum[l]];
							if(next.type == NameType.token) {
								checked.follow.push([ next.index ]);
								break;
							} else if(next.type == NameType.rule) {
								var first = next.first;
								checked.follow.push(first);
								if(FindIndex(first, function(ele) { return (ele == 0) }) == -1) {
									break;
								}
							}

							++l;
						}
						if(l == qsSet[i].arr[j].brokenDefEnum.length) {
							if(checked.index != qsSet[i].index) {
								checked.follow.push(qsSet[i].follow);
							}
						}
					}
				}
			}
		}
	}

	// Condolidate follow sets, as right not they consist of an array of arrays
	for(var i = 0; i < qsSet.length; ++i) {
		if(qsSet[i].follow != null) {
			qsSet[i].follow = ConsolidateIntArray(qsSet[i].follow);
		}
	}

}

function CreateQuickSearch(tokenSet, ruleSet) {

	var retVal = [];
	var index = 2;

	retVal.push({ name: empty, type: NameType.token, index: 0, arr: [{ index: 0 }] });
	retVal.push({ name: start, type: NameType.token, index: 1, arr: [{ index: 1 }] });

	for(var i = 0; i < tokenSet.length; ++i) {

		var mapped = FindIndex(retVal, function(ele) {
			return (ele.name.localeCompare(tokenSet[i].name) == 0);
		});

		if(mapped == -1) {
			retVal.push({ name: tokenSet[i].name, index: index, type: NameType.token, arr: [] });
			tokenSet[i].index = index;
			mapped = index;
			++index;
		} else {
			tokenSet[i].index = mapped;
		}

		retVal[mapped].arr.push(tokenSet[i]);

	}

	for(var i = 0; i < ruleSet.length; ++i) {

		var mapped = FindIndex(retVal, function(ele) {
			return (ele.name.localeCompare(ruleSet[i].name) == 0);
		});

		if(mapped == -1) {
			retVal.push({ name: ruleSet[i].name, index: index, type: NameType.rule, arr: [] });
			ruleSet[i].index = index;
			mapped = index;
			++index;
		} else {
			ruleSet[i].index = mapped;
		}

		retVal[mapped].arr.push(ruleSet[i])

	}

	return retVal;

}

function AttepmtReduce(stack, qsSet) {

	var set = qsSet;

	for(var i = 0; i < set.length; ++i) {
		if(set[i].type == NameType.token) {
			continue;
		}
		for(var j = 0; j < set[i].arr.length; ++j) {
			var offset = 1;
			var current = stack[stack.length - offset];
			for(var k = (set[i].arr[j].brokenDefEnum.length - 1); k >= 0; --k) {
				if(current.index != set[i].arr[j].brokenDefEnum[k].index) {
					break;
				} else if(k == 0) {
					return set[i].arr[j];
				} else {
					++offset;
					current = stack[stack.length - offset];
				}
			}
		}
	}

	return null;

}

var Lexer = exports.SearchLexer = function(tokens, rules) {

	this.tokens = [];
	this.rules = [];
	this.nameEnum = [];
	var that = this;
	this.stack = [];

	if(tokens == null) {

		this.tokens = [
			{ pattern: "AND", name: "AND" },
			{ pattern: "\\&", name: "AND" },
			{ pattern: "OR", name: "OR" },
			{ pattern: "\\|", name: "OR" },
			{ pattern: "NOT", name: "NOT" },
			{ pattern: "\\!", name: "NOT" },
			{ pattern: "\\(", name: "OPEN" },
			{ pattern: "\\)", name: "CLOSE" },
			{ pattern: "\"", name: "FULL"},
			{ pattern: "[a-zA-Z0-9]+", name: "WORD" }
		];

	} else {
		this.tokens = tokens.concat();
	}

	if(rules == null) {

		this.rules = [
			{ name: "start", def: "expression", operation: function(tokens) { } },
			{ name: "expression", def: "words expression", operation: function(tokens) { } }, 
			{ name: "expression", def: "words", operation: function(tokens) { } },
			{ name: "closedExpression", def: "OPEN expression CLOSE | " + empty, operation: function(tokens) { } },
			{ name: "relasionable", def: "WORD | closedExpression", operation: function(tokens) { } },
			{ name: "expression", def: "relasionable AND relasionable | relasionable OR relasionable", operation: function(tokens) { } },
			{ name: "expression", def: "NOT relasionable", operation: function(tokens) { } },
			{ name: "expression", def: "FULL words FULL", operation: function(tokens) { } },
			{ name: "words", def: "WORD words", operation: function(tokens) { } },
			{ name: "words", def: "WORD", operation: function(tokens) { } }
		];

	} else {
		this.rules = rules.concat();
	}

	SplitRules(this.rules);
	this.quickSearch = CreateQuickSearch(this.tokens, this.rules);
	// CreateEnumeration(this.tokens, this.rules, this.nameEnum);
	BreakDownDefinitions(this.rules, this.quickSearch);
	for(var i = 0; i < this.quickSearch.length; ++i) {
		if(this.quickSearch[i].first == null) {
			CalculateFirst(this.quickSearch[i], this.quickSearch);
		}
	}
	CalculateFollow(this.quickSearch);
	// AddFirst(this.quickSearch);
	this.tokenizer = new tokenizerModule.Tokenizer(this.tokens, true);

}

Lexer.prototype.FindQSIndex = function(name) {

	for(var i= 0; i < this.quickSearch.length; ++i) {
		if(this.quickSearch[i].name.localeCompare(name) == 0) {
			return i;
		}
	}

	return -1;

}

Lexer.prototype.FindTokenIndex = function(name) {

	for(var i = 0; i < this.tokens.length; ++i) {
		if(this.tokens[i].name.localeCompare(name) == 0) {
			return i;
		}
	}

	return -1;

}

Lexer.prototype.FindRuleIndex = function(name) {

	for(var i = 0; i < this.rules.length; ++i) {
		if(this.rules.name.localeCompare(name) == 0) {
			return i;
		}
	}

	return -1;

}

Lexer.prototype.FindFirstRecursivly = function(current) {

	var retVal = [];

	if(current.brokenDef[0] == empty) {
		retVal = [ empty ];
	} else if(CheckCapital(current.brokenDef[0][0])) {
		retVal = [ current.brokenDef[0] ];
	} else {

		var emptyFound;
		var bi = 0;
		do {

			var rules = this.FindRule(current.brokenDef[bi]);
			for(var i = 0; i < rules.length; ++i) {

				if(rules[i].first != null) {
					retVal = JoinExclusivly(retVal, rules[i].first);
				} else {
					retVal = JoinExclusivly(retVal, FindFirstRecursivly(rules[i]));
				}

			}
			++bi;

		} while(emptyFound == true);

	}

	return retVal;

}

 // All rules must start with a small letter, all terminals must start with a capital letter
 // The first rule in the array must be "start", and there must be only 1 start
Lexer.prototype.Analyze = function(str) {

	var retVal = [];
	var currentToken;
	this.tokenizer.Input(str);

	while(currentToken = this.tokenizer.Next()) {
		retVal.push(currentToken);
		// this.stack.push(currentToken);
		// var r;
		// r = AttepmtReduce(this.stack, this.quickSearch);
		// if(r != null) {
		// 	this.stack.splice(this.stack.length - r.brokenDefEnum.length, r.brokenDefEnum.length, r);
		// }
	}

	return retVal;

}