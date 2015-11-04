
function Spinny(elementId, color, speed) {

	var canvas = document.getElementById(elementId);
	var ctx = canvas.getContext("2d");

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

	var center = { x: canvas.width / 2, y: canvas.height / 2 };
	var rect = { size: (((canvas.width > canvas.height) ? canvas.height : canvas.width) - ctx.lineWidth) }
	rect.x = center.x - (rect.size / 2);
	rect.y = center.y - (rect.size / 2);

	var centerX = 100 + ctx.lineWidth;
	var centerY = 100 + ctx.lineWidth;

	var prevFrame = 0;
	var deltaTime = 0;

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

			ctx.clearRect(0, 0, canvas.width, canvas.height);
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

	this.Spin();

}