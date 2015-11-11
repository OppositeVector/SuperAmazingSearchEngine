var fs = require('fs');
var hash = require("./Hash");

var verbose = true;

// function HashCode(str) {
	
//     var hash = 0;
//     if (str.length == 0) return hash;
//     for (var i = 0; i < str.length; i++) {
//         var character = str.charCodeAt(i);
//         hash = ((hash<<5)-hash)+character;
//         hash = hash & hash; // Convert to 32bit integer
//     }
//     return hash;

// }

exports.SimpleHash = function(str) {

	var hash = 5318;
	var m = 33;
	for(var i = 0; i < str.length; ++i) {
		hash = (m * hash) + str.charCodeAt(i);
	}

	return hash;

}

var charArray = [ 	
					"a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", 
					"n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z", 
					"0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
				];

exports.HashTest = function(count) {

	console.log("started");

	var currentValue = "";
	var indexArray = [];
	for(var i = 0; i < count; ++i) {
		currentValue += charArray[0];
		indexArray.push(0);
	}

	var lastIndex = count - 1;
	var end = false;

	while(indexArray[0] < charArray.length) {

		++indexArray[lastIndex];
		currentValue = "";

		for(var i = lastIndex; i >= 0; --i) {
			if(indexArray[i] == charArray.length) {
				if(i == 0) {
					console.log("Finished Test");
					return;
				} else {
					++indexArray[i-1];
				}
				indexArray[i] = 0;
			}
			currentValue += charArray[indexArray[i]];
		}

		// console.log(currentValue + " " + indexArray);

	}

	

}

function FindWord(arr, word) {

	for(var i = 0; i < arr.length; ++i) {
		if(arr[i].id.localeCompare(word) == 0) {
			return i;
		}
	}

	return -1;

}

function CheckPartOfWord(char) {

	var code = char.charCodeAt(0);

	return (((code >= 48) && (code <= 57)) || // Numbers
			((code >= 65) && (code <= 90)) || // A-Z
			((code >= 97) && (code <= 122))); // a-z

}

function AddWord(arr, word, position) {

	var index = FindWord(arr, word);
	if(index > -1) {
		++arr[index].count;
		arr[index].positions.push(position);
	} else {
		arr.push({ id: word, count: 1, positions: [position]});
	}

}

exports.Analyze = function(doc, callback) {

	fs.readFile(doc.path, 'utf-8', function(err, data) {

		var words = data.split(/,. /);
		var i = 0;

		// Change this to ommit an additional seperators and html tags

		retVal = {
			title: "",
			words: []
		}
		// var analyzedWords = [];

		var position = 0;

		while(i < words.length) {

			var currentWord = '';
			var j = 0;
			while(j < words[i].length) {

				if(CheckPartOfWord(words[i][j])) {
					currentWord += words[i][j];
				} else {
					if(currentWord.length > 0) {
						AddWord(retVal.words, currentWord, position - currentWord.length);
						currentWord = '';
					}
				}
				++position;
				++j;
			}

			if(currentWord.length > 0) {
				AddWord(retVal.words, currentWord, position - currentWord.length);
			}
			++position;
			++i;
		}

		if(callback != null) {
			callback(null, retVal);
		}

	});

}

var ignoreTags = [
	hash.HashString("cite"),
	hash.HashString("meta"),
	hash.HashString("link")
]

var hardIgnoreTags = [
	hash.HashString("script"),
	hash.HashString("style"),
	hash.HashString("code"),
]

function CheckIfCritical(str) {

	// console.log("Checking if criticl:" + str);

	var code = hash.HashString(str.toLowerCase());

	for(var i = 0; i < ignoreTags.length; ++i) {
		// console.log("comparing word " + str + " hash.HashString:" + code + ", width hash.HashString:" + criticalTags[i]);
		if(ignoreTags[i] == code) {
			return 0;
		}

	}

	for(var i = 0; i < hardIgnoreTags.length; ++i) {
		// console.log("comparing word " + str + " hash.HashString:" + code + ", width hash.HashString:" + criticalTags[i]);
		if(hardIgnoreTags[i] == code) {
			return 0;
		}

	}

	return 1;

}

var closingNotRequired = [
	hash.HashString("area"),
	hash.HashString("base"),
	hash.HashString("br"),
	hash.HashString("col"),
	hash.HashString("command"),
	hash.HashString("embed"),
	hash.HashString("hr"),
	hash.HashString("img"),
	hash.HashString("input"),
	hash.HashString("link"),
	hash.HashString("meta"),
	hash.HashString("param"),
	hash.HashString("source"),
	hash.HashString("td"),
	hash.HashString("th"),
	hash.HashString("tr"),
	hash.HashString("thead"),
	hash.HashString("tbody"),
	hash.HashString("tfoot"),
	hash.HashString("colgroup"),
	hash.HashString("li")
]

function CheckIfClosingNotRequired(str) {

	var code = hash.HashString(str.toLowerCase());

	for(var i = 0; i < closingNotRequired.length; ++i) {
		// console.log("comparing word " + str + " hash.HashString:" + code + ", width hash.HashString:" + closingNotRequired[i]);
		if(closingNotRequired[i] == code) {
			return true;
		}

	}

	return false;

}

exports.AnalyzeHtml = function (rawData, callback) {

	var i = 0;
	var tagStack = [];
	var input = "";
	var failiure = { check: false, msg: "" };
	var currentTag = 0;
	var titleCode = hash.HashString("title");

	var retVal = {
		title: "",
		words: []
	}

	// Helper functions

	function PushStack(str) {

		if(verbose == true) {
			console.log("Pushing " + str);
		}
		
		tagStack.push(str);
		currentTag = hash.HashString(str);

		if(verbose == true) {
			console.log("current tag:" + str);
		}

	}

	function PopStack(str) {

		var poped = "";

		do {

			poped = tagStack.pop();
			if(verbose == true) {
				console.log("Poped: " + poped + ", looking for:" + str);
			}

		} while((poped != null) && (poped.localeCompare(str) != 0));

		if(poped == null) {

			var prox = "";
			var j = 0;
			while(((i + j) < rawData.length) && (j < 30)) {
				prox += rawData[i + j];
				j++;
			}
			if(failiure.check == false) {
				callback("The tag </" + str + "> in position " + i + " was located in the wrong place, in proximity of:" + prox);
			}
			failiure.check = true;
			failiure.msg = "Failed on poping action"
			end = true;

		} else {
			if(tagStack.length > 0) {
				var ct = tagStack[tagStack.length - 1];
				currentTag = hash.HashString(ct);
				if(verbose == true) {
					console.log("current tag:" + ct);
				}
			}
		}

		/*
		var end = false;
		do {

			var poped = tagStack.pop();
			console.log("Poping: " + poped);
			if(str.localeCompare(poped) != 0) {

				if(!CheckIfClosingNotRequired(poped)) {

					var prox = "";
					var j = 0;
					while(((i + j) < rawData.length) && (j < 30)) {
						prox += rawData[i + j];
						j++;
					}
					callback("The tag </" + str + "> in position " + i + " was located in the wrong place, in proximity of:" + prox);
					failiure.check = true;
					failiure.msg = "Failed on poping action"
					end = true;

				}

			} else {
				end = true;
			}

		} while(!end);
		*/

	}

	// Reads the next word or tag, return: 
	// 0 if its a word
	// 1 if its an opening tag
	// 2 if its a closing tag
	function ReadBlock(asIs) {

		var end = false;

		// Skip white spaces
		while((i < rawData.length) && (rawData[i] == " ")) {
			++i;
		}

		input = "";
		var type = 0;
		var v = { active: verbose, d: "" };
		v.d += "Verbose block reading:|";

		while((input.length == 0) && (type != -1)) {

			if(i == rawData.length) {
				type = -1;
			} else {

				// console.log("in block with letter:'" + rawData[i] + "' position:" + i);

				if(rawData[i] == "<") {
					v.d += rawData[i];
					++i;
					if(i == rawData.length) {
						type = -1;
					} else if(rawData[i] == "/") {
						v.d += rawData[i];
						++i;
						ReadText(false, v);
						if(ScanPastTagClose(v) == true) {
							input = "";
						} else {
							type = 2;
						}
					} else if(rawData[i] == "!") {
						++i;
						ScanCommentEnd();
					} else {
						ReadText(false, v);
						if(ScanPastTagClose(v) == true) {
							input = "";
						} else {
							type = 1;
						}
					}
					
				} else {
					ReadText(asIs, v);
					type = 0;
				}

			}

		}

		v.d += "|";
		if(v.active == true) {
			console.log(v.d);
		}

		return type;

	}

	// Reads the next word into input
	function ReadText(asIs, v) {

		var end = false;
		var specialFlag = false;
		input = "";
		do {

			if(i < rawData.length) {

				var checked = rawData[i];

				if(asIs == true) {

					if(checked == "<") {
						return;
					} else if(checked == ">") {

					} else {
						input += checked;
					}

				} else {

					if(input.length == 0) {

						if(checked == "&") {
							specialFlag = true;
						} else if(checked == "<") {
							return;
						} else if(CheckPartOfWord(checked)) {
							input += checked;
						}

					} else {

						if(specialFlag && (checked == ";")) {
							input = "";
						} else if((checked == "'") || CheckPartOfWord(checked)) {
							input += checked;
						} else {
							return;
						}

					}

				}

				v.d += rawData[i];
				++i;

			} else {
				return;
			}

		} while(!end);

	}

	// Scans untill the next tag opening bracket is found
	function ScanNextTag() {

		while((i < rawData.length) && (rawData[i] != "<")) {
			++i;
		}

	}

	function ScanCommentEnd() {

		var found = 0;

		if(rawData.length > (i + 7)) {

			if(CheckWordAtCurrent("doctype")) {

				while(rawData[i] != ">") {
					++i;
				}

				return;
			}

		}

		while((i < rawData.length) && (found < 3)) {

			if(found == 0) {
				if(rawData[i] == "-") {
					found = 1;
				}
			} else if(found == 1) {
				if(rawData[i] == "-") {
					found = 2;
				} else {
					found = 0;
				}
			} else if(found == 2) {
				if(rawData[i] == ">") {
					found = 3;
				} else {
					if(rawData != "-") {
						found = 0;
					}
				}
			}

			++i;

		}

	}

	// Scans untill the next tag closing bracket is found
	function ScanPastTagClose(v) {

		while((i < rawData.length) && (rawData[i] != ">")) {
			v.d += rawData[i];
			++i;
		}

		if(i < rawData.length) {
			v.d += rawData[i];
			++i;
			if(rawData[i-2] == "/") {
				return true;
			}
		} else {
			
		}

		return false;

	}

	// Scans untill the next end tag is found
	function ScanTagEnd() {

		var end = false;
		while(!end) {

			if(i > rawData.length) {
				end = true;
			} else {
				if(rawData[i] == "<") {
					++i;
					if(i > rawData.length) {
						end = true;
					} else {
						if(rawData[i] == "/") {
							++i;
							end = true;
						} else {
							ScanNextTag();
						}
					}
				} else {
					ScanNextTag();
				}
			}

		}

	}

	// Scans untill the closing tag of the tagStage top is found, the top tag is poped fro the stack
	function ScanPastTopTagEnd() {

		var depth = tagStack.length;
		// var topTag = tagStack[tagStack.length - 1];
		var end = false;
		while(!end) {

			if(i > rawData.length) {
				end = true;
			} else {

				ScanNextTag();
				var res = ReadBlock();
				if(res == 1) {
					PushStack(input);
				} else if(res == 2) {
					PopStack(input);
					if(tagStack.length < depth) {
						end = true;
					}
				}

			}

			if(failiure.check) {
				return;
			}

		}

	}

	function CheckWordAtCurrent(str) {

		var internal = str.toLowerCase();

		for(var j = 0; j < internal.length; ++j) {
			if(rawData[i+j].toLowerCase() != internal[j]) {
				return false;
			}
		}

		return true;

	}

	var type = -1;

	// Might want to make something more robust for finding the begining then
	// a simple tag search as there might be some php before the page
	do {
		type = ReadBlock();
		if(verbose == true) {
			console.log("found block: " + i + " " + input);
		}
	} while((type != 1) || (input.localeCompare("html") != 0));

	PushStack(input);

	var firstTitle = true;

	while(tagStack.length > 0) {

		if(i >= rawData.length) {
			callback("Could not completly parse the html");
			return;
		}

		type = ReadBlock(currentTag == titleCode);

		switch(type) {

		case 0:
			if(currentTag == titleCode) {
				if(firstTitle) {
					retVal.title = input;
					firstTitle = false;
				} else {
					retVal.title += " " + input;
				}
				
			} else {
				var normalized = input.toLowerCase();
				var index = FindWord(retVal.words, normalized);
				if(index > -1) {
					retVal.words[index].count++;
					retVal.words[index].positions.push(i - normalized.length);
				} else {
					retVal.words.push({ id: normalized, count: 1, positions: [i - normalized.length] });
				}
			}
			break;

		case 1:
			PushStack(input);
			if(!CheckIfCritical(input)) {
				var keep = input;
				if(verbose == true) {
					console.log("Scanning past:" + keep);
				}
				ScanPastTopTagEnd();
				if(verbose == true) {
					console.log("Finished scanning for end of " + keep);
				}
			}
			break;

		case 2:
			PopStack(input);
			break;

		}

	}

	if(failiure.check == false) {
		callback(null, retVal);
	}
	
}