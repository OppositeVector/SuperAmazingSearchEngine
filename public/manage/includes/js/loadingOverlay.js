$.styleSheetContains = function (f) {
    var hasstyle = false;
    var fullstylesheets = document.styleSheets;
    for (var sx = 0; sx < fullstylesheets.length; sx++) {
        var sheetclasses = fullstylesheets[sx].rules || document.styleSheets[sx].cssRules;
        for (var cx = 0; cx < sheetclasses.length; cx++) {
            if (sheetclasses[cx].selectorText == f) {
                hasstyle = true; break;
                //return classes[x].style;              
            }
        }
    }
    return hasstyle;
};

// This block requires jquery to work, tested with 2.1.1, so any higher version should work

function Spinny(parent, color, speed, size) {

	var height;
	var width;

	// Validate size
	if(size != null) {

		if($.isArray(size)) {
			width = size[0];
			height = size[1];
		} else {

			if(size.h != null) {
				height = size.h;
			} else if(size.height != null) {
				height = size.height;
			} else if(size.y != null) {
				height = size.y;
			} else {
				height = 100;
			}

			if(size.w != null) {
				width = size.w;
			} else if(size.width != null) {
				width = size.width;
			} else if(size.x != null) {
				width = size.x;
			} else {
				width = 100;
			}
		}

	} else {
		height = 100;
		width = 100;
	}
	// Validate size END

	// Prepare initial values
	var idName = "victor-spinner-cascading";
	var canvas = $("<canvas id='" + idName + "' width='" + width + "' height='" + height + "'></canvas>");
	parent.prepend(canvas);
	if(!$.styleSheetContains("#" + idName)) {
		canvas.css({
			margin: "0", 
			position: "absolute",
			top: "50%",
			left: "50%",
			transform: "translate(-50%, -50%)"
		});
	}
	var ctx = canvas[0].getContext("2d");

	var halter = false;
	if(speed == null) {
		speed = 360;
	}
	var sAngle = 0;
	var eAngle = 0;
	var stage = 0;
	var waited = 0;
	var targetFps = 60;

	if(color == null) {
		ctx.strokeStyle = '#ff7058';
	} else {
		ctx.strokeStyle = color;
	}
	ctx.lineWidth=5;

	var center = { x: canvas.width() / 2, y: canvas.height() / 2 };
	console.log(canvas.width() + " " + canvas.height());
	var rect = { size: (((canvas.width() > canvas.height()) ? canvas.height() : canvas.width()) - ctx.lineWidth) }
	rect.x = center.x - (rect.size / 2);
	rect.y = center.y - (rect.size / 2);

	var centerX = 100 + ctx.lineWidth;
	var centerY = 100 + ctx.lineWidth;

	var prevFrame = 0;
	var deltaTime = 0;
	// Prepare inital values END

	function Draw(timeStamp) {

		setTimeout(function() {

			deltaTime = (timeStamp - prevFrame) / 1000;
			prevFrame = timeStamp;

			if(isNaN(deltaTime)) {
				deltaTime = 0;
			}

			// console.log(deltaTime, eAngle);

			if(halter) {
				halter = false;
			} else {
				window.requestAnimationFrame(Draw);
			}

			ctx.clearRect(0, 0, canvas.width(), canvas.height());
			ctx.beginPath();
			ctx.arc(center.x, center.y, rect.size / 2, sAngle, eAngle);
			ctx.stroke();

			if(stage == 0) {
				eAngle += Math.PI * ((speed * deltaTime) / 180);
				if(eAngle >= (2*Math.PI)) {
					stage = 1;
					eAngle = 2 * Math.PI;
				}
			} else if(stage == 1) {
				sAngle += Math.PI * ((speed * deltaTime) / 180);
				if(sAngle >= (2*Math.PI)) {
					sAngle = 0;
					eAngle = 0;
					stage = 2;
				}
			} else {
				waited += Math.PI * ((speed * deltaTime) / 180);
				if(waited > 1) {
					stage = 0;
					waited = 0;
				}
			}

		}, 1000 / targetFps);

		
	}

	this.Spin = function() {
		Draw();
	}

	this.Stop = function() {
		halter = true;
	}

}

function LoadingOverlay(parent, size) {

	var idName = "victor-loading-overlay";
	var overlay = $("#" + idName);
	if(overlay.length == 0) {
		overlay = $("<div id='" + idName + "'></div>");
		if(parent == null) {
			parent = $("body");
		}
	} else {
		if(parent == null){
			parent = overlay.parent()[0];
		}
	}
	
	if(!$.styleSheetContains("#" + idName)) {
		overlay.css({
			height: "100%",
			width: "100%",
			backgroundColor: "#000000",
			position: "fixed",
			zIndex: "9999",
			opacity: "0.4"
		});
	}

	parent.prepend(overlay);
	var spinny = new Spinny(overlay, "#ff0000", null, size);

	var fadeInSemahpore = false;
	var fadeOutSemaphore = false;
	var present = true;

	this.fadeTime = 500;
	this.opacity = 0.6;

	this.Obscure = function() {
		if(fadeInSemahpore) {
			return;
		} else if(fadeOutSemaphore) {
			overlay.stop(true);
			fadeOutSemaphore = false;
		}

		fadeInSemahpore = true;
		present = true;

		var calculatedTime = this.fadeTime * (1 - (parseFloat(overlay.css("opacity")) / this.opacity));

		parent.prepend(overlay);
		spinny.Spin();
		overlay.animate({
			opacity: this.opacity.toString(),
		}, calculatedTime, function() {
			fadeInSemahpore = false;
		});

	}

	this.Clear = function() {

		if(fadeOutSemaphore) {
			return;
		} else if(fadeInSemahpore) {
			overlay.stop(true);
			fadeInSemahpore = false;
		} else if(!present) {
			return;
		}

		fadeOutSemaphore = true;

		var calculatedTime = this.fadeTime * (parseFloat(overlay.css("opacity")) / this.opacity);

		overlay.animate({
			opacity: "0",
		}, calculatedTime, function() {
			overlay.remove();
			spinny.Stop();
			fadeOutSemaphore = false;
			present = false;
		});

	}

	this.Clear();

}