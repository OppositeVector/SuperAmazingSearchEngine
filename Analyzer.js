
var fs = require("fs");

exports.Analyze = function(doc, callback) {

	fs.readFile(doc.path, "utf-8", function(err, data) {
		// console.log(JSON.stringify(data));
	});

	if(callback != null) {
		callback(null, { words: [] });
	}

}