var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var dev = ((process.env.DEV != null) ? "dev" : "");

var doc = new Schema({

	name: String,
	path: String,
	id: Number

}, { collection: dev + "files" });

exports.Schema = doc;
exports.type = "Document";