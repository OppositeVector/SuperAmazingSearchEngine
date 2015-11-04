var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dev = ((process.env.DEV != null) ? "dev" : "");

var appearsInSchema = new Schema({

	doc: Number,
	count: Number,
	positions: [Number],

});

var word = new Schema({

	_id: { type: String, required: true },
	total: Number,
	appearsIn: [appearsInSchema]


}, { collection: dev + "words" });

exports.Schema = word;
exports.type = "Word";