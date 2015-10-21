var express = require("express");
var mongoose = require("mongoose");
var url = require("url");

var port = process.env.PORT || 8080;

var app = express();

app.get("/", function(req, res) {
	res.send("Working !");
});

app.listen(port);
console.log("listen on port " + port);