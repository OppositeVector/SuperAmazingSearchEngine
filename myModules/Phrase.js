var Lexer = require("./Lexer");
var setModule = require("./Set");

var wordsIndex = -1;
var retrievedWords = [];
var allDocumnets = [];
var critical = [];
var addWords = true;

var Set = function(arr) {
	return new setModule.Set(function(a, b) { /*console.log("compaing: " + a.doc + " - " + b.doc + " = " + (a.doc - b.doc));*/ return (a.doc - b.doc); }, arr);
}

var Parser = exports.Parser = function(phrase) {

	var lexer = new Lexer.SearchLexer();
	this.tokens = lexer.Analyze(phrase);
	this.words = [];
	wordsIndex = lexer.FindTokenIndex("WORD");

	if(wordsIndex == -1) {
		throw Error("Phrase parser could not find the definition of WORD in the lexer.");
	}

	for(var i =0; i < this.tokens.length; ++i) {
		if(this.tokens[i].ruleIndex == wordsIndex) {
			this.words.push(this.tokens[i].value);
		}
	}

}

Parser.prototype.Analyze = function() {

	retrievedWords = this.words;
	var retVal = ConstructDocuments();

	retVal = AnalyzeRecursivly(this.tokens);

	return { words: critical, docs: retVal };

}

function GetRetievedWord(word) {

	var retVal = [];

	for(var i = 0; i < allDocumnets.length; ++i) {
		for(var j = 0; j < allDocumnets[i].words.length; ++j) {
			if(word.localeCompare(allDocumnets[i].words[j].word) == 0) {
				retVal.push(allDocumnets[i]);
				break;
			}
		}
	}

	return retVal;

}

function GetRetrievedDoc(docId) {

	for(var i = 0; i < allDocumnets.length; ++i) {
		if(allDocumnets[i].doc == docId) {
			return i;
		}
	}

	return -1;

}

function ConstructDocuments() {

	allDocumnets = [];
	critical = [];

	console.log(retrievedWords);
	for(var i = 0; i < retrievedWords.length; ++i) {
		var word = retrievedWords[i];
		for(var j = 0; j < word.appearsIn.length; ++j) {

			var index = GetRetrievedDoc(word.appearsIn[j].doc);
			if(index == -1) {
				allDocumnets.push({ doc: word.appearsIn[j].doc, words: [] });
				index = allDocumnets.length - 1;
			}

			allDocumnets[index].words.push({
				word: word._id, 
				total: word.total, 
				count: word.appearsIn[j].count,
				positions: word.appearsIn[j].positions
			});

		}
	}

	// console.log(JSON.stringify(allDocumnets));

	return allDocumnets;

}

function AnalyzeRecursivly(tokens, pos, set) {

	if(pos == null) {
		pos = { index: 0 };
	}

	if(set == null) {
		set = Set();
	}	

	while(tokens.length != pos.index) {

		// console.log(tokens.length + " " + pos.index);

		var returned = Decide(tokens, pos);
		console.log("returned");
		console.log(returned);

		switch (returned.c) {

		case 0:
			return set;
			break;

		case 1:
			// console.log("intersecting");
			// console.log(set);
			// console.log(returned.set);
			set.Intersection(returned.set);
			break;

		case 2:
			set.Union(returned.set);
			break;

		case 3:
			set.Intersection(returned.set);
			break;

		}

	}

	return set;

}

function Decide(tokens, pos) {

	var set = Set();

	console.log("Deciding on token:");
	console.log(tokens[pos.index]);

	if(tokens[pos.index].name.localeCompare("OPEN") == 0) {

		++pos.index;
		var set = AnalyzeRecursivly(tokens, pos);
		return { c: 4, set: set }

	} else if(tokens[pos.index].name.localeCompare("CLOSE") == 0) {
		++pos.index;
		return { c: 0, set: set };
	} else if(tokens[pos.index].name.localeCompare("AND") == 0) {

		++pos.index;
		
		var returned = Decide(tokens, pos);
		// console.log("intersecting");
		// console.log(JSON.stringify(returned));
		// console.log(JSON.stringify(set));
		// set.Intersection(returned.set);
		// console.log("HERE");
		return { c: 1, set: returned.set };

	} else if(tokens[pos.index].name.localeCompare("OR") == 0) {

		++pos.index;
		var returned = Decide(tokens, pos);
		// set.Union(returned.set);
		return { c: 2, set: returned.set };

	} else if(tokens[pos.index].name.localeCompare("NOT") == 0) {

		++pos.index;
		addWords = false;
		var returned = Decide(tokens, pos);
		// set.Subtract(returned.set);
		addWords = true;
		console.log("NOT");
		console.log(returned);
		return { c: 3, set: Set(allDocumnets).Subtract(returned.set) };

	} else if(tokens[pos.index].name.localeCompare("FULL") == 0) {
		// Figure it out
	} else {
		if(addWords == true) {
			critical.push(tokens[pos.index].value);
		}
		var set = GetRetievedWord(tokens[pos.index].value);
		++pos.index;
		return { c: 2, set: set };
	}

	// return { c: 1, set: set };

}

function AnalyzeNotRecursivly(tokens, set, pos) {

	if(tokens[pos.index].name.localeCompare("OPEN") == 0) {

	} else {
		if(tokens[pos.index].index == wordsIndex) {
			set = Exclude(set, tokens[pos.index]);
		} else {
			throw Error("Parsing the query has resulted in an error, incorrect symbol after NOT:" + 
				tokens[pos.index].value + 
				", in position:" + 
				pos.index);
		}
		
	}

	++pos.index;

	return set;

}

var Exclude = exports.Exclude = function(docs, word) {

	if(word == null) {
		return docs;
	}

	if((docs == null) || (docs.length == 0)) {
		return docs;
	} else {

		for(var i = 0; i < docs.length; ++i) {

			for(var j = 0; j < word.appearsIn.length; ++j) {
				if(docs[i].doc == word.appearsIn[j].doc) {
					docs.splice(i, 1);
					--i;
					break;
				}
			}

		}

	}

	return docs;

}

var AddInclusivly = exports.AddInclusivly = function (docs, word) {

	if(word == null) {
		return docs;
	}

	var retVal = [];

	if((docs == null) || (docs.length == 0)) {

		for(var i = 0; i < word.appearsIn.length; ++i) {
			retVal.push({ 
				doc: word.appearsIn[i].doc, 
				words: [ 
					{ 
						word: word._id, 
						total: word.total, 
						count: word.appearsIn[i].count, 
						positions: word.appearsIn[i].positions
					} 
				]
			});
		}

	} else {

		retVal = docs;

		for(var i = 0; i < retVal.length; ++i) {

			for(var j = 0; j < word.appearsIn.length; ++j) {
				if(retVal[i].doc == word.appearsIn[j].doc) {
					retVal[i].words.push({
						word: word._id, 
						total: word.total, 
						count: word.appearsIn[i].count, 
						positions: word.appearsIn[i].positions
					});
					break;
				}
			}

		}

	}

	return retVal;

}

var AddExclusivly = exports.AddExclusivly = function(docs, word) {

	if(word == null) {
		return docs;
	}

	var retVal = [];

	if((docs == null) || (docs.length == 0)) {

		for(var i = 0; i < word.appearsIn.length; ++i) {
			retVal.push({ 
				doc: word.appearsIn[i].doc, 
				words: [ 
					{ 
						word: word._id, 
						total: word.total, 
						count: word.appearsIn[i].count, 
						positions: word.appearsIn[i].positions
					} 
				]
			});
		}

	} else {

		retVal = docs;

		for(var i = 0; i < retVal.length; ++i) {

			var notFound = true;
			for(var j = 0; j < word.appearsIn.length; ++j) {
				if(retVal[i].doc == word.appearsIn[j].doc) {
					notFound = false;
					retVal[i].words.push({
						word: word._id, 
						total: word.total, 
						count: word.appearsIn[i].count, 
						positions: word.appearsIn[i].positions
					});
					break;
				}
			}

			if(notFound) {
				retVal.splice(i, 1);
				--i;
			}
		}

	}

	return retVal;

}
