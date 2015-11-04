var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dev = ((process.env.DEV != null) ? "dev" : "");

var doc = new Schema({

	name: String,
	path: String,
	id: Number,
	type: Number, // 0 for standard doc, 1 for web doc
	deleted: Boolean

}, { collection: dev + "files" });

exports.Schema = doc;
exports.type = "Document";