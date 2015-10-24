var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dev = ((process.env.DEV != null) ? "dev" : "");

var word = new Schema({

	_id: { type: String, required: true },
	total: Number,
	appearsIn: [{}] // [ { doc: -1, count: -1, adjacents: [ {before: "", after: "", } ] } ]


}, { collection: dev + "words" });

exports.Schema = word;
exports.type = "Word";