var Cerulean = function () {

	var GameWindow = function () {
		this.width = 1024;
		this.height = 768;
	}

	var GameConsts = {
		tileSize: 32,
		worldWidth: 300,
		worldHeight: 300
	};

	var Renderer = function (gameWindow) {
		var canvas;
		var ctx;
		
		canvas = document.getElementById('gamescreen');
		ctx = canvas.getContext("2d");
		canvas.width = gameWindow.width;
		canvas.height = gameWindow.height;

		this.draw = function (playerPos, room) {
			ctx.fillStyle = "#3f303f";
			ctx.fillRect(0,0, gameWindow.width, gameWindow.height);
			ctx.fillStyle = "white";
			ctx.font = '32px Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif';
			ctx.fillText("Cerulean 2…", 40, gameWindow.height - 32);

			ctx.fillStyle = "#bbffbb";
			ctx.fillRect(room.pos.x*GameConsts.tileSize, room.pos.y*GameConsts.tileSize, 
				room.size.x*GameConsts.tileSize, room.size.y*GameConsts.tileSize);

			ctx.fillStyle = "white";
			ctx.fillRect(playerPos.x, playerPos.y, 32, 32);
		}
	}

	var Room = function (x, y, width, height) {
		this.pos = new Pos(x, y);
		this.size = new Pos(width, height);
	}

	this.start = function () {
		var gameWindow = new GameWindow();
		var renderer = new Renderer(gameWindow);
		var keyboard = new Keyboard();
		var desiredFps = 60;

		var room = new Room(2,2,5,5);
		var playerPos = new Pos(0,0);

		var update = function () {
			if (keyboard.isKeyDown(KeyEvent.DOM_VK_RIGHT)) {
				playerPos.x++;
			} else if (keyboard.isKeyDown(KeyEvent.DOM_VK_LEFT)) {
				playerPos.x--;
			}
			if (keyboard.isKeyDown(KeyEvent.DOM_VK_UP)) {
				playerPos.y--;
			} else if (keyboard.isKeyDown(KeyEvent.DOM_VK_DOWN)) {
				playerPos.y++;
			}
			keyboard.update();
		}

		//cross browser hacks
		var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  		window.requestAnimationFrame = requestAnimationFrame;

		window.setInterval(function () {
			update();
			requestAnimationFrame(function() {
				renderer.draw(playerPos, room);
			});
		}, 1000/desiredFps);
	}

}

window.onload = function () {
	var cerulean = new Cerulean();
	cerulean.start();
};