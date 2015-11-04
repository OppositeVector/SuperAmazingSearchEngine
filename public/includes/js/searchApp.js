var app = angular.module("searchApp", ['ngSanitize']);

var model = {
	searchQuery: "",
	results: [],
	resultsRelevantSearchQuesry: "",
	answers: []
}

var lo = new LoadingOverlay();

app.run(function() {
	lo.Clear();
	console.log("HERE");
});

app.controller("BodyController", ["$scope", "$http", "$location", "$sanitize", function($scope, $http, $location, $sanitize) {

	$scope.model = model;

	$scope.SearchClicked = function() {
		lo.Obscure();
		console.log(model.searchQuery);
		$http.get("./query?query=" + model.searchQuery).then(function(res) {
			console.log(res);
			if(res.data.result == 1) {
				model.results = res.data.data;
				if(model.results.length == 0) {
					model.answers = [ { str: "No results were found" } ];
				} else {
					model.answers = [];
				}
			} else {
				console.log(res.data.data);
				model.answers = [ { str: "Error retriving query: " + res.data.data } ];
			}
			lo.Clear();
		}, function(err) {
			console.log(err);
			model.answer = [ { str: "Error communicating with the server:" + err } ];
			lo.Clear();
		});
	}

	$scope.ResultClicked = function(doc) {
		location.path(doc.docData.path);
	}

	$scope.Obscure = function() {
		lo.Obscure();
	}

	$scope.Clear = function() {
		lo.Clear();
	}

}]);