var HudOverlay = function(overlayId, gameWindow) {
	var canvas2 = document.getElementById(overlayId);
	canvas2.width = gameWindow.width;
	canvas2.height = gameWindow.height;
	var ctx2 = canvas2.getContext("2d");

	this.drawHud = function(bitscore, roomsExplored, roomsInTotal, fps) {

		ctx2.clearRect(0, gameWindow.height - 128, gameWindow.width, 128);

		ctx2.fillStyle = "#5DE100";
		ctx2.font = '32px "Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace';
		//ctx.font = '32px "Lucida Sans Typewriter", "Lucida Console", Monaco, "Bitstream Vera Sans Mono", monospace';
		ctx2.fillText("BITSCORE: " + bitscore, 40, gameWindow.height - 64);
		ctx2.fillText("ROOMS EXPLORED: " + roomsExplored + " OF " + roomsInTotal, 350, gameWindow.height - 64);
		ctx2.fillText("FPS: " + fps, 850, gameWindow.height - 64);
	}
}
