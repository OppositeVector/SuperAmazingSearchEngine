var mongoose = require("mongoose");
var wordSchema = require("./WordSchema");
var docSchema = require("./DocSchema");
var analyzer = require("./Analyzer");
var ConfigHandler = require("./ConfigHandler");
var stopList = require('./StopList');

mongoose.connect(process.env.MONGOLAB_URI);
var con = exports.connection = mongoose.connection;
var wordModel = mongoose.model("wordM", wordSchema.Schema);
var docModel = mongoose.model("docM", docSchema.Schema);

var TAG = "DBController";

var verbose = false;

function GetNewDocId(callback) {

	ConfigHandler.GetConfig(mongoose, docSchema.type, function(err, config) {

		if(err) {
			callback(err);
			return;
		}

		if(config.data == null) {
			config.data = {};
		}

		if(config.data.index == null) {
			config.data.index = -1;
		}

		config.data.index += 1;
		config.markModified("data");
		config.save(function(err) {

			if(err) {
				callback(err);
			} else {
				callback(null, config.data.index);
			}
			
		});

	});

}

con.once('open',function(err){

	if(err){
		console.log(err);
	}else{
		console.log('Successfully opened production db connection');
	}

});

exports.GetDocuments = function(docIds, callback) {

	var getAll = false;

	if(callback == null) {
		callback = docIds;
		getAll = true;
	} else {

		if((docIds == null) || (docIds.length == 0)) {
			callback(TAG + ".GetDocuments received an empty docIds parameter");
			return;
		}

	}

	docModel.find((getAll ? { deleted: 0 } : { $and: [ { id: { $in: docIds } }, { deleted: 0 } ] }), function(err, documents) {

		if(err) {
			callback(err);
			return;
		}

		callback(null, documents);

	});

}

exports.AssignDocuments = function(docs, callback) {

	var ids = [];
	for(var i = 0; i < docs.length; ++i) {
		ids.push(docs[i].doc);
	}

	docModel.find({ id: { $in: ids } }, function(err, documents) {

		if(err) {
			callback(err);
			return;
		}

		for(var i = 0; i < documents.length; ++i) {
			for(var j = 0; j < docs.length; ++j) {
				if(documents[i].id == docs[j].doc) {
					if(documents[i].deleted == 1) {
						docs.splice(j, 1);
						--j;
						documents.splice(i, 1);
					} else {
						docs[j].docData = documents[i];
					}
					
					break;
				}
			}
		}

		callback(null, docs);

	});

}

var UpdateWords = exports.UpdateWords = function(words, doc, callback) {

	var wordIds = []
	for(var i = 0 ; i < words.length; ++i) {
		wordIds.push(words[i].id);
	}

	wordModel.find({ _id: {$in: wordIds}}, function(err, data) {

		if(err) {
			if(callback != null) {
				callback("Error retriving words from DB: " + err);
			}
			return;
		}

		var unfoundWords = [];

		for(var i = 0; i < words.length; ++i) {

			if(verbose == true) {
				console.log("Checking word:" + words[i].id);
			}
			var found = false;
			for(var j = 0; j < data.length; ++j) {

				if(words[i].id.localeCompare(data[j]._id) == 0) {

					found = true;
					data[j].total += words[i].count;
					data[j].appearsIn.push({ doc: doc.id, count: words[i].count, positions: words[i].positions });
					data[j].save(function(err, data) {
						if(err) {
							console.log("Could not save word to DB: " + err);
						} else {
							if(verbose == true) {
								console.log("Saved Word " + JSON.stringify(data._id));
							}
						}
					});
					break;

				}

			}
			if(!found) {
				unfoundWords.push(words[i]);
			}

		}

		for(var i = 0; i < unfoundWords.length; ++i) {

			if(verbose == true) {
				console.log("Inserting: " + unfoundWords[i].id);
			}
			wordModel.create({
				_id: unfoundWords[i].id, 
				total: unfoundWords[i].count, 
				appearsIn: [ {
					doc: doc.id,
					count: unfoundWords[i].count,
					positions: unfoundWords[i].positions
				} ]
			}, function(err, data) {
				if(err) {
					console.log("Failed to create new words in DB: " + err);
				}
			});

		}

		if(callback != null) {
			callback(null);
		}

	});

}

exports.InsertDocument = function(doc, callback) {

	GetNewDocId(function(err, id) {

		if(err) {
			callback(err);
			return;
		}

		doc.id = id;
		doc.deleted = 0;
		doc.type = 0;
		docModel.create(doc, function(err, returnedDoc) {

			if(err) {
				callback(err);
				return;
			}

			try {
				callback(null, returnedDoc);
			} catch(err) {
				console.log(err);
			}

			analyzer.Analyze(returnedDoc, function(err, data) {

				if(err) {
					console.log(err);
					return;
				}

				if((data == null) || (data.words.length == 0)) {
					console.log("Analisis of the document didn't find any words");
					return;
				}

				UpdateWords(data.words, returnedDoc);

			});

		});

	});

}

exports.InsertWebDocumnet = function(url, docData, callback) {

	GetNewDocId(function(err, id) {

		if(err) {
			callback(err);
			return;
		}

		var doc = {
			id: id,
			path: url,
			type: 1,
			deleted: 0
		}

		docModel.create(doc, function(err, returnedDoc) {

			if(err) {
				callback(err);
				return;
			}

			// try {
			// 	callback(null, returnedDoc);
			// } catch(err) {
			// 	console.log(err);
			// }

			analyzer.AnalyzeHtml(docData, function(err, data) {

				if(err) {
					callback(err);
					return;
				}

				if((data == null) || (data.words.length == 0)) {
					callback("Analisis of the document didn't find any words");
					return;
				}

				returnedDoc.name = data.title;
				returnedDoc.save(function(err) {

					if(err) {
						callback(err);
						return;
					}

					UpdateWords(data.words, returnedDoc, function(err) {
						try {
							callback(err, data);
						} catch (errr) {
							console.log(errr);
						}
					});

				});

				
			});

		});

	});

}

exports.RemoveDocument = function(docId, callback) {

	docModel.findOne({id: docId}, function(err, doc) {

		if(err) {
			callback(err);
			return;
		}
		doc.deleted = 1;
		doc.save(function(err) {
			if(err) {
				callback(err);
				return;
			}
			callback(null);
		});
	})

}

exports.GetWords = function(words, callback) {

	if(callback != null) {

		wordModel.find({ _id: {$in: words } }, function(err, data) {

			if(err) {
				callback(err);
				return;
			}

			callback(null, data);

		});

	} else {
		console.log("No callback supplied");
	}

}

var AddExclusivly = exports.AddExclusivly = function AddExclusivly(docs, word) {

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

// function ExclusiveArrayJoin(baseWord, cutoffWord) {

// 	var retVal = [];

// 	for(var i = 0; i < baseWord.appearsIn.length; ++i) {

// 		var found = false;
// 		for(var j = 0; j < cutoffWord.appearsIn.length; ++j) {

// 			if(baseWord.appearsIn[i].doc == cutoffWord.appearsIn[j].doc) {
// 				found = true;
// 				break;
// 			}

// 		}

// 		if(!found) {
// 			baseWord.appearsIn.splice(i, 1);
// 		}

// 	}

// 	return retVal;

// }

exports.GetWordsAnd = function(words, callback) {

	if(callback != null) {

		wordModel.find({ _id: { $in: words } }, function(err, wordsData) {

			if(err) {
				callback(err);
				return;
			}

			if(wordsData.length == 0) {
				callback("No documents found");
			}

			if(wordsData.length > 1) {

				var docs;

				for(var i = 0; i < wordsData.length; ++i) {
					docs = AddExclusivly(docs, wordsData[i]);
				}

				// var docs = ExclusiveArrayJoin(wordsData[0].appearsIn, wordsData[1].appearsIn);

				// for(var i = 2; i < wordsData.length; ++i) {
				// 	docs.concat(ExclusiveArrayJoin(docs, wordsData[i]));
				// }

				callback(null, docs);

			} else {
				console.log(wordsData);
				callback(null, AddExclusivly(null, wordsData[0]));
			}
			

		});

	} else {
		console.log("No callback supplied");
	}

}

exports.GetWordsOr = function(words, callback) {

	if(callback != null) {

		wordModel.find({ _id: { $in: words } }, function(err, wordsData) {

			if(err) {
				callback(err);
				return;
			}

			if(wordsData.length == 0) {
				callback("No documents found");
			}

			if(wordsData.length > 1) {

				var docs;

				for(var i = 0; i < wordsData.length; ++i) {
					docs = AddInclusivly(docs, wordsData[i]);
				}

				// var docs = ExclusiveArrayJoin(wordsData[0].appearsIn, wordsData[1].appearsIn);

				// for(var i = 2; i < wordsData.length; ++i) {
				// 	docs.concat(ExclusiveArrayJoin(docs, wordsData[i]));
				// }

				callback(null, docs);

			} else {
				console.log(wordsData);
				callback(null, AddExclusivly(null, wordsData[0]));
			}
			

		});

	} else {
		console.log("No callback supplied");
	}

}