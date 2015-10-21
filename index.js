var fs = require('fs');
var express = require("express");
var mongoose = require("mongoose");
var url = require("url");
var path = require("path");
var multer  = require('multer');
var upload = multer({ dest: 'uploaded/' });

var port = process.env.PORT || 8080;

var app = express();

function findExtension(path) {

	var pointIndex = path.lastIndexOf('.');
	var retVal = path.substring(pointIndex, path.length);
	return retVal;

}

app.get("/", function(req, res) {
	res.send("Working !");
});

app.use("/upload", express.static('./public'));

var func = upload.array("doc", 10);

app.post("/submit", function(req, res) {
	func(req, res, function(err) {
		if(err) {
			console.log(err);
			res.send("Error ! -- " + err);
		} else {
			console.log(JSON.stringify(req.files));
			for(var i = 0; i < req.files.length; ++i) {
				fs.rename(req.files[i].path, req.files[i].path + findExtension(req.files[i].originalname));
			}
			res.send("Success !" + JSON.stringify(req.files));
		}
	});
});

app.listen(port);
console.log("listen on port " + port);