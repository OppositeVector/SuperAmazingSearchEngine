
// Legend:
// 0 - Unary
// 1 - Binary
// 2 - Encasing

function KMPPartialMatchBuild(str) {

	var retVal = [];
	var ii = 0;
	var i = 2;

	retVal.push(-1);
	retVal.push( 0);

	while(i < str.length) {
		if(str[ii] == str[i - 1]) {
			++ii;
			retVal.push(ii);
			++i;
		} else if(ii > 0) {
			ii = retVal[ii];
		} else {
			retVal.push(0);
			++i;
		}
	}

	return retVal;

}

exports.buildTest = KMPPartialMatchBuild;

function KMPSearch(str, searchTerm, partialMatch) {

	if(partialMatch == null) {
		partialMatch = KMPPartialMatchBuild(searchTerm);
	}

	var i = 0;
	var ii = 0;

	while((i + ii) < str.length) {

		if(searchTerm[i] == str[i + ii]) {
			if(ii == searchTerm.length) {
				return i;
			}
			++ii;
		} else {
			if(partialMatch[ii] > -1) {
				i = i + ii - partialMatch[ii];
				ii = partialMatch[ii];
			} else {
				ii = 0;
				++i;
			}
		}

	}

	return -1;

}

var rules = [
	{ 
		token: /AND/,
		type: 1
	},
	{
		token: /OR/,
		type: 1
	},
	{
		token: /NOT/,
		type: 0
	},
	{
		token: /\((.*?)\)/, // Match any parenthesis
		type: 2
	},
]

function Expression() {

}

function Operation() {

}

exports.Tokenize = function(str) {

	var ret = ParseParenthesis(str);

	return rules[3].token.exec(str);

}

function ParseParenthesis(st, current) {

	// Returned array contains objecsts with notations, 
	// t = 'a' means its an array, t = 's' means its a string
	// d is the actual data contained

	var lowest = false;
	if(current == null) {
		current = { i: 0, depth: 0 }
		lowest = true;
	}

	var retVal = [];
	var currentSentence = "";

	while(current.i < st.length) {

		if(st[current.i] == "(") {
			if(currentSentence.length > 0) {
				retVal.push({ t: 's', d: currentSentence });
				currentSentence = "";
			}
			++current.i;
			++current.depth;
			retVal.push({ t: 'a', d: ParseParenthesisTerm(st, current) });
		} else if(st[current.i] == ")") {
			if(currentSentence.length > 0) {
				retVal.push({ t: 's', d: currentSentence });
			}
			--current.depth;
			return retVal;
		} else {
			currentSentence += st[current.i];
		}

		console.log("index:" + current.i + ", depth:" + current.depth + " char:" + st[current.i] + ", currentSentence:" + currentSentence);

		++current.i;

	}

	if(currentSentence.length > 0) {
		retVal.push({ t: 's', d: currentSentence });
	}

	if(lowest) {
		if(current.depth == 0) {
			return { result: 1, data: retVal };
		} else {
			return { result: 0, data: "Parenthesis depth didnt patch" };
		}
	}
	return retVal;

}

// Tokenizer written by Eli Bendersky's
// http://eli.thegreenplace.net/2013/06/25/regex-based-lexical-analysis-in-python-and-javascript

var Tokenizer = exports.Tokenizer = function(rules, skipWhiteSpace) {

	if(skipWhiteSpace == null) {
		skipWhiteSpace = true;
	}

	this.rules = rules;
	var regex_parts = [];
	for (var i = 0; i < this.rules.length; ++i) {
		regex_parts.push('(' + rules[i].pattern + ')');
	}
	console.log(regex_parts.join("|"));
	this.regex = new RegExp(regex_parts.join('|'), 'g');
	this.skipWhiteSpace = skipWhiteSpace ? new RegExp('\\S', 'g') : null;
	this.buf = '';

}

// Initialize the Lexer's buffer. This resets the lexer's internal state and
// subsequent tokens will be returned starting with the beginning of the new
// buffer.
Tokenizer.prototype.Input = function(buf) {
	this.buf = buf;
	this.regex.lastIndex = 0;
	infini = 0;
}

var infini = 0 ;

// Get the next token from the current buffer. A token is an object with
// the following properties:
// - name: name of the pattern that this token matched (taken from rules).
// - value: actual string value of the token.
// - pos: offset in the current buffer where the token starts.
//
// If there are no more tokens in the buffer, returns null.
// In case of an error, throws Error.
Tokenizer.prototype.Next = function() {
	// End of input?
	if ((this.regex.lastIndex >= this.buf.length) || (infini >= 100)) {
		return null;
	}

	++infini;

	// console.log(this.regex.lastIndex);

	if (this.skipWhiteSpace) {
		this.skipWhiteSpace.lastIndex = this.regex.lastIndex;
		var match = this.skipWhiteSpace.exec(this.buf);
		if (match) {
	  		this.regex.lastIndex = match.index;
		} else {
		  	return null;
		}
	}

	var result = this.regex.exec(this.buf);
	// console.log(result);
	if (result === null) {
		throw Error('Cannot match a token at position ' + this.regex.lastIndex);
	} else {
		for (var i = 0; i < this.rules.length; i++) {
			// Find the matching rulea SO question
			if (result[i + 1] !== undefined) {
				return {
					name: this.rules[i].name,
					ruleIndex: i,
			        value: result[0].toLowerCase(), 
			        pos: result.index
			    };
			}
		}
		// Shouldn't get here, because at least one rule matched.
		throw Error('Internal error');
	}
}