var fs = require('fs');
var express = require('express');
var mongoose = require('mongoose');
var url = require('url');
var path = require('path');
var multer  = require('multer');
var upload = multer({ dest: 'uploaded/' });
var bodyParser = require('body-parser');
var http = require("http");
var request = require('request');

var dbc = require('./myModules/DBController');
var tokenizer = require("./myModules/Tokenizer");
var stopList = require("./myModules/stopList");
var hash = require("./myModules/Hash");

var port = process.env.PORT || 8080;

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }))

function findExtension(path) {

	var pointIndex = path.lastIndexOf('.');
	var retVal = path.substring(pointIndex, path.length);
	return retVal;

}

function SendJson(object, res) {

	res.header('Access-Control-Allow-Methods', 'GET, POST');
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Content-Type, *');
	app.set('json spaces',4);
	res.set('Content-Type','application/json');
	res.status(200);
	// console.log(JSON.stringify(object));
	res.json(object);

}



app.use(function(req, res, next) {

	res.SendJson = function(object) {
		this.header('Access-Control-Allow-Methods', 'GET, POST');
		this.header('Access-Control-Allow-Origin', '*');
		this.header('Access-Control-Allow-Headers', 'Content-Type, *');
		this.set('json spaces',4);
		this.set('Content-Type','application/json');
		this.status(200);
		// console.log(JSON.stringify(object));
		this.json(object);
	}
	next();

});

function ParseParenthesisTerm(st, current) {

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

function ParseSentences(prethesisBlock) {



}

function TestRegexp(str) {
	var regexp = /df/g;
	return regexp.exec(str);
}

app.use('/', express.static('./public'));
app.use('/manage', express.static('./public/manage'));
app.use('/documents', express.static('./uploaded'));

var func = upload.array('file', 10);

app.post('/submit', function(req, res) {

	func(req, res, function(err) {

		if(err) {
			console.log(err);
			res.send('Error ! -- ' + err);
			return;
		}

		// console.log(JSON.stringify(req.files));
		for(var i = 0; i < req.files.length; ++i) {

			finalPath = req.files[i].path + findExtension(req.files[i].originalname);
			fs.rename(req.files[i].path, finalPath);
			dbc.InsertDocument({ path: finalPath, name: req.files[i].originalname }, function(err, doc) {

				if(err) {
					console.log(err);
					SendJson({ result: 0, data: err }, res);
				} else {
					SendJson({ result: 1, data: { id: doc.id, name: doc.name, path: doc.path.replace("uploaded\\", "documents/") } }, res);
				}
				
			});

		}

	});

});

app.post("/submitHtml", function(req, res) {

	console.log(req.body);

	var protocolRegex = /https?:\/\//;
	var i = 0;
	var htmlInfo = [];

	function GetHtmls() {

		if(i < req.body.data.length) {

			var current = { path: req.body.data[i] };
			htmlInfo.push(current);

			if(!protocolRegex.test(current.path)) {
				current.path = "http://" + current.path;
			}

			request.get(current.path, function(err, response, body) {

				if(err) {

					console.log(err);
					current.data = err;

				} else {

					current.data = body;
					dbc.InsertWebDocumnet(current.path, current.data, function(err, wordsData) {

						if(err) {
							current.data = err;
						} else {
							current.data = wordsData;
						}

						++i;
						GetHtmls();

					});

				}

			});

		} else {
			SendJson(htmlInfo, res);
		}

	}

	GetHtmls();

	// for(var i = 0; i < req.body.length; ++i) {

	// 	if(!protocolRegex.test(htmlUrl)) {
	// 		htmlUrl = "http://" + htmlUrl;
	// 	}

	// 	request.get(htmlUrl, function(err, response, body) {

	// 		if(err) {
	// 			console.log(err);
	// 			SendJson({ result: 0, data: err }, res);
	// 			return;
	// 		}
	// 	});

	// }

});

app.post('/remove', function(req, res) {

	dbc.RemoveDocument(req.body.data.id, function(err) {

		if(err) {
			SendJson({ result: 0, data: err }, res);
		} else {
			SendJson({ result: 1 }, res);
		}

	});
	
});

app.use('/getallfiles', function(req, res) {

	dbc.GetDocuments(function(err, docs) {

		if(err) {
			console.log(err);
			res.send(err);
			return;
		}

		console.log(docs);

		var retVal = [];
		for(var i = 0; i < docs.length; ++i) {

			var obj = {
				id: docs[i].id,
				name: docs[i].name
			}
			if(docs[i].type == 0) {
				obj.path = docs[i].path.replace("uploaded\\", "../documents/");
			} else {
				obj.path = docs[i].path;
			}
			retVal.push(obj);

		}

		SendJson(retVal, res);

	});

});

app.get("/search", function(req, res) {

	var searchTerm = url.parse(req.url,true).query.searchTerm;

	console.log("Term: " + searchTerm);

	var ret = tokenizer.buildTest(searchTerm);

	console.log(ret);


	SendJson(ret, res);
	return;

	try {
		SendJson(ParseParenthesisTerm(searchTerm), res);
	} catch(ex) {
		SendJson({ result: 0, data: ex }, res);
	}
	

});

var analyzer = require("./myModules/Analyzer");

app.get("/test", function(req, res) {

	var htmlUrl = url.parse(req.url,true).query.url;
	var protocolRegex = /https?:\/\//;

	if(!protocolRegex.test(htmlUrl)) {
		htmlUrl = "http://" + htmlUrl;
	}

	request.get(htmlUrl, function(err, response, body) {

		if(err) {
			console.log(err);
			SendJson({ result: 0, data: err }, res);
			return;
		}

		// console.log(body);

		try {

			analyzer.AnalyzeHtml(body, function(err, words) {

				// var stack = new Error().stack;
				// console.log("HERE:" + err + " " + words + " stack call:\n" + stack);

				if(err) {
					SendJson({ result: 0, data: err, additional: body }, res);
					return;
				}
				SendJson({ result: 1, data: words, additional: body }, res);

			});

		} catch(err) {
			console.log("here " + err + "\n" + err.stack);
			SendJson({ result: 0, data: err, additional: body }, res);
		}

		
	});

});

app.get("/hashTest", function(req, res) {

	var count = url.parse(req.url,true).query.count;

	var hash = analyzer.SimpleHash(str);

	SendJson({ result: 1, data: hash }, res);

});

app.get("/docTest", function(req, res) {

	var idsString = url.parse(req.url,true).query.ids;

	var ids = JSON.parse(idsString);

	dbc.GetDocuments(ids, function(err, docs) {

		if(err) {
			res.SendJson({ result: 0, data: err });
			return;
		}

		res.SendJson({ result: 1, data: docs})

	});

});

app.get("/wordTest", function(req, res) {

	var wordsString = url.parse(req.url,true).query.words;

	var words = JSON.parse(wordsString);

	dbc.GetWords(words, function(err, docs) {

		if(err) {
			res.SendJson({ result: 0, data: err });
			return;
		}

		res.SendJson({ result: 1, data: docs});

	});

});

function CalculatePageRanks(words, docs) {

	// Find clusters

	var clusterRange = 300;

	for(var i = 0; i < docs.length; ++i) {

		var positions = [];

		if(docs[i].rank == null) {
			docs[i].rank = 0;
		}

		for(var j = 0; j < docs[i].words.length; ++j) {
			docs[i].rank += (docs[i].words[j].count / docs[i].words[j].total) * clusterRange * 10;
			for(var k = 0; k < docs[i].words[j].positions.length; ++k) {
				positions.push({ p: docs[i].words[j].positions[k], w: hash.HashString(docs[i].words[j].word) });
			}
		}

		positions.sort(function(a, b) {
			return a.p - b.p;
		});

		var clusters = [];
		var currentCluster = { d: clusterRange, a: [] };

		for(var j = 0; j < positions.length; ++j) {

			if(currentCluster.a.length == 0) {
				currentCluster.a.push(positions[j]);
				// console.log("adding " + positions[j] + " to currentCluster 1");
			} else {
				if((positions[j].p - currentCluster.a[0].p) < clusterRange) {
					var found = false;
					for(var k = 0; k < currentCluster.a.length; k++) {
						if(currentCluster.a[k].w == positions[j].w) {
							found = true;
						}
					}
					if(found = false) {
						currentCluster.a.push(positions[j]);
					}
					// console.log("adding " + positions[j] + " to currentCluster 2");
				} else {
					if(currentCluster.a.length > 1) {

						currentCluster.d = currentCluster.a[currentCluster.a.length -1].p - currentCluster.a[0].p;

						if(clusters.length == 0) {
							clusters.push(currentCluster);
						} else {
							if(clusters[0].a.length < currentCluster.a.length) {
								clusters.unshift(currentCluster);
							} else {
								clusters.push(currentCluster);
							}
						}
					}
					currentCluster = { d: clusterRange, a: [] };
					// console.log("Clearing currentCluster");
				}
			}

		}

		// console.log("new doc");

		docs[i].clusters = clusters;
		for(var j = 0; j < docs[i].clusters.length; ++j) {
			docs[i].rank += clusterRange - docs[i].clusters[j].d;
		}

	}

}

function ClearHtml(words, str) {

	var retVal = "";
	var tag = false;

	for(var i = 0; i < str.length; ++i) {

		if(tag == true) {
			if(str[i] == ">") {
				tag = false;
			}
		} else {
			if(str[i] == ">") {
				retVal = "";
			} else if(str[i] == "<") {
				tag = true;
			} else {
				retVal += str[i];
			}
		}

	}

	// var regex = new RegExp( '(' + word + ')', 'gi' );
 //     return line.replace( regex, "<b>$1</b>" );
	for(var i = 0; i < words.length; ++i) {
		var regex = new RegExp( '(' + words[i] + ')', 'gi' );
		retVal = retVal.replace(regex, "<b>$1</b>");
	}

	return retVal;

}

function FindSpaceBack(str, index) {

	while((index > 0) && (str[index] != " ")) {
		--index;
	}

	return index;

}

function FindSpaceForwad(str, index) {

	while((index < str.length) && (str[index] != " ")) {
		++index;
	}

	return index;

}

app.get("/query", function(req, res) {

	var query = url.parse(req.url, true).query.query;
	query = query.toLowerCase();
	var words = query.split(" ");

	for(var i = 0; i < words.length; ++i) {
		if(stopList.check(words[i])) {
			words.splice(i, 1);
			--i;
		}
	}

	dbc.GetWordsOr(words, function(err, data) {
		if(err) {
			res.SendJson({ result: 0, data: err});
			return;
		} else {

			CalculatePageRanks(words, data);

			dbc.AssignDocuments(data, function(err, docs) {

				if(err) {
					console.log("Error assigning documents:" + err);
					return;
				}

				var i = 0;

				function GetBriefs() {

					request.get(docs[i].docData.path, function(err, response, body) {

						if(err) {

							console.log(err);
							data.brief = data;

						} else {

							if(docs[i].clusters.length > 0) {
								docs[i].brief = body.substr(FindSpaceBack(body, docs[i].clusters[0].a[0].p - 100), 1200);
							} else {
								docs[i].brief = body.substr(FindSpaceBack(body, docs[i].words[0].positions[0] - 300), 1000);
							}

							docs[i].brief = ClearHtml(words, docs[i].brief) + " ...";

							++i;

							if(i < docs.length) {
								GetBriefs();
							} else {
								docs.sort(function(a, b) {
									return b.rank - a.rank;
								});
								res.SendJson({ result: 1, data: docs });
							}
							
						}

					});

				}

				if(i < docs.length) {
					GetBriefs();
				}
				

			});
			
		}
	});

});

app.get("/cquery", function(req, res) {

	var query = url.parse(req.url, true).query.query;

	var index = 0;
	var depth = -1;

	function BreakComplex(complex) {

		if(complex == null) {
			complex = [];
		}

		++depth;
		var retVal = [];
		// if(query[index] == "("){
		// 	complex.push({ t: 1, v: [] })
		// } else {
		// 	complex.push({ t: 0, v: "" });
		// }
		var i = 0;

		var keepGoing = true;

		while((index < query.length) && (keepGoing == true)) {

			if(i == complex.length) {

				if(query[index] == "(") {
					complex.push({ t: 1, v: [] });
					++index;
					complex[i].v = BreakComplex();
					++i;
				} else if(query[index] == ")") {
					keepGoing = false;
				} else {
					complex.push({ t: 0, v: "" });
				}
				
			} else {

				if(query[index] == "(") {
					++i;
				} else if(query[index] == ")") {
					keepGoing = false;
					++index;
				} else {
					complex[i].v += query[index];
					++index;
				}

			}

		}

		--depth;

		return complex;

	}

	var complex = BreakComplex();
	var operatorsRegex = /(AND)|(OR)|(NOT)/;

	function ParseOperators(complex) {

		for(var i = 0; i < complex.length; ++i) {
			if(complex[i].t == 0) {
				console.log("HERE");
				complex[i].v = complex[i].v.split(operatorsRegex);
				for(var j = 0; j < complex[i].v.length; ++j) {
					if(complex[i].v[j] == null) {
						complex[i].v.splice(j, 1);
						--j;
					} else {
						console.log(JSON.stringify(complex[i].v[j]));
						var split = complex[i].v[j].split(" ");
						if(split.length > 1) {
							complex[i].v.splice(j, 1, split);
							--j;
						}
					}
				}
			} else {
				ParseOperators(complex[i].v);
			}
		}

	}

	ParseOperators(complex);

	res.SendJson(complex);

});

app.get("/aquery", function(req, res) {



});

app.listen(port);
console.log('listen on port ' + port);