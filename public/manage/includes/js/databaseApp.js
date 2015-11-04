var databaseApp = angular.module("databaseApp", []);

var model = { files: [], urls: [ { path: "" } ] };
var scope;
var lo = new LoadingOverlay();

databaseApp.directive('fileModel', ['$parse', function ($parse) {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            var model = $parse(attrs.fileModel);
            var modelSetter = model.assign;
            
            element.bind('change', function(){
                scope.$apply(function(){
                    modelSetter(scope, element[0].files[0]);
                });
            });
        }
    };
}]);

databaseApp.service('fileUpload', ['$http', function ($http) {
    this.uploadFileToUrl = function(file, uploadUrl, callback){
        var fd = new FormData();
        fd.append('file', file);
        $http.post(uploadUrl, fd, {
            transformRequest: angular.identity,
            headers: {'Content-Type': undefined}
        })
        .success(function(res){
        	if(callback != null) {
        		callback(res);
        	}
        })
        .error(function(err){
        	console.log(err);
        });
    }
}]);

function Refresh($http, callback) {

	lo.Obscure();
    model.files = [];
	$http.get("../getallfiles").then(function(data) {
		model.files = data.data;
		if(callback != null) {
			callback();
		}
		lo.Clear();
	}, function(err) {
        console.log(err);
        lo.Clear();
    });

	angular.forEach(angular.element("input[type='file']"), function(inputElem) {
      	angular.element(inputElem).val(null);
    });

    model.urls = [{ path: "" }];

}

databaseApp.run(function($http) {
	Refresh($http);
});

databaseApp.controller("BodyController", ["$scope", "fileUpload", "$http", function($scope, fileUpload, $http) {

	scope = $scope;
	$scope.model = model;
	$scope.RemoveClicked = function(file) {
		lo.Obscure();
		$http.post("../remove", {data: { id: file.id }}).success(function(res) {

			if(res.result == 0) {
				res.log("Error occured while removing document: " + res.data);
				lo.Clear;
				return;
			}
			console.log(res);
			Refresh($http);

		});
	}

	$scope.UploadFile = function() {
		lo.Obscure();
        var file = $scope.fileToUpload;
        console.log(file);
        var uploadUrl = "../submit";
        fileUpload.uploadFileToUrl(file, uploadUrl, function(res) {

        	console.log(res);
        	Refresh($http, function() {
        		var found = false;
	        	for(var i = 0; i < model.files.length; ++i) {
	        		if(model.files[i].id == res.data.id) {
	        			found = true;
	        			break;
	        		}
	        	}
	        	if(!found) {
	        		model.files.push(res.data);
	        	}
        	});

        });
    };

    $scope.AddUrlSpace = function() {
        model.urls.push({ path: "" });
    }

    $scope.InsertHtmls = function() {

        lo.Obscure();
        console.log(model.urls);
        var dataToSend = [];
        for(var i = 0; i < model.urls.length; ++i) {
            dataToSend.push(model.urls[i].path);
        }
        $http.post("../submitHtml", { data: dataToSend }).then(function(res) {

            console.log(res);
            lo.Clear();
            Refresh($http);

        }, function(err) {

            console.log(err);
            lo.Clear();
            Refresh($http);

        });

    }

    $scope.FadeIn = function() {
    	lo.Obscure();
    }

    $scope.FadeOut = function() {
    	lo.Clear();
    }

}]);