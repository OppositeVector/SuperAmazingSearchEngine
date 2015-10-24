var mongoose = require("mongoose");
var wordSchema = require("./WordSchema");
var docSchema = require("./DocSchema");
var configSchema = require("./ConfigSchema");
var analyzer = require("./Analyzer");
var ConfigHandler = require("./ConfigHandler");

mongoose.connect(process.env.MONGOLAB_URI);
var con = exports.connection = mongoose.connection;
var wordModel = mongoose.model("wordM", wordSchema.Schema);
var docModel = mongoose.model("docM", docSchema.Schema);

var TAG = "DBController";

con.once('open',function(err){

	if(err){
		console.log(err);
	}else{
		console.log('Successfully opened production db connection');
	}

});

exports.GetDocuments = function(docIds, callback) {

	if(callback == null) {
		console.log(TAG + ".GetDocuments didnt receive a callback");
		return;
	}

	if((docIds == null) || (docIds.length == 0)) {
		callback(TAG + ".GetDocuments received an empty docIds parameter");
		return;
	}

	docModel.find({_id: {$in: docIds}}, function(err, documents) {

		if(err) {
			callback(err);
			return;
		}

		var retVal = [];
		for(var i = 0; i < documents.length; ++i) {
			retVal.push(documents[i].path);
		}

		callback(null, retVal);

	});

}

exports.UpdateWords = function(words, docFile) {

	for(var i = 0; i < words.length; ++i) {

		wordModel.findOne().where("id").equals(words[i].id).exec(function(err, word) {

			if(err != null) {
				console.log(err);
				return;
			}

			var adj = [];
			for(var j = 0; j < words[i].adj.length; ++j) {
				adj.push(words[i].adj[j]);
			}
			word.total += words[i].count;
			word.appearsIn.push({ doc: docFile.id, count: words[i].count, adjacents: adj});
			word.markModified("appearsIn");

		});

	}

}

exports.InsertDocument = function(doc, callback) {

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
				return;
			}

			doc.id = config.data.index;
			docModel.create(doc, function(err, returnedDoc) {

				if(err) {
					callback(err);
					return;
				}
				analyzer.Analyze(returnedDoc, function(err, data) {

					if(err) {
						callback(err);
						return;
					}

					if((data == null) || (data.length == 0)) {
						callback("Analisis of the document didn't find any words");
						return;
					}

					UpdateWords(data)
					if(callback != null) {
						callback(null);
					}

				});

			});
		});

	});

}