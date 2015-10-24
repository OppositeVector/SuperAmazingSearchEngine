var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var dev = ((process.env.DEV != null) ? "dev" : "");

var config = Schema({

	_id: {type: String, required: true},
	data: {}

}, { collection: dev + "config" });

exports.Schema = config;