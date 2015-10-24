var configSchema = require("./ConfigSchema");

var n = "ConfigHandler"
var configModel;

exports.GetConfig = function(mongooseCon, type, callback) {

	if(callback == null) {
		console.log(n + " didnt recieve a callback");
		return;
	}

	if(mongooseCon == null) {
		callback(n + " didnt recieve a mongooseCon parameter");
		return;
	}

	if(type == null) {
		callback(n + " didnt recieve a type parameter");
		return;
	}

	if(configModel == null) {
		configModel = mongooseCon.model("configM", configSchema.Schema);
	}

	configModel.findOne(type, function(err, config) {

		if(err) {
			callback(err);
		}

		if(config == null) {

			configModel.create({ _id: type, data: { } }, function(err, newCnfig) {

				if(err) {
					callback(err);
				} else {
					callback(null, newConfig);
				}

			});

		} else {
			callback(null, config);
		}

	});

}