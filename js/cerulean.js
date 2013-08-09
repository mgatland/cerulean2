var Cerulean = function () {

	var GameWindow = function () {
		this.width = 1024;
		this.height = 768;
	}

	var GameConsts = {
		tileSize: 32,
		worldWidth: 280,
		worldHeight: 230
	};

	var Camera = function () {
		this.pos = new Pos();
	}

	var Renderer = function (gameWindow) {
		var canvas;
		var ctx;

		canvas = document.getElementById('gamescreen');
		ctx = canvas.getContext("2d");
		canvas.width = gameWindow.width;
		canvas.height = gameWindow.height;

		this.draw = function (playerPos, rooms, camera) {
			ctx.fillStyle = "#3f303f";
			ctx.fillRect(0,0, gameWindow.width, gameWindow.height);
			ctx.fillStyle = "white";
			ctx.font = '32px Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif';
			ctx.fillText("Cerulean 2…", 40, gameWindow.height - 32);

			var wallWidth = GameConsts.tileSize;
			rooms.forEach(function (room) {
				ctx.fillStyle = "#000000";
				ctx.fillRect(room.pos.x*GameConsts.tileSize-camera.pos.x, room.pos.y*GameConsts.tileSize-camera.pos.y,
					room.size.x*GameConsts.tileSize, room.size.y*GameConsts.tileSize);

				ctx.fillStyle = "#ccccff";
				ctx.fillRect((room.pos.x)*GameConsts.tileSize+wallWidth-camera.pos.x, (room.pos.y)*GameConsts.tileSize+wallWidth-camera.pos.y,
					(room.size.x)*GameConsts.tileSize-wallWidth*2, (room.size.y)*GameConsts.tileSize-wallWidth*2);

				ctx.fillStyle = "#ccecff";
				room.doors.forEach(function (door) {
					ctx.fillRect(door.pos.x*GameConsts.tileSize-camera.pos.x, door.pos.y*GameConsts.tileSize-camera.pos.y,
						GameConsts.tileSize, GameConsts.tileSize);
				});
			});
			ctx.fillStyle = "white";
			ctx.fillRect(playerPos.x-camera.pos.x, playerPos.y-camera.pos.y, 32, 32);
		}
	}

	this.start = function () {
		var gameWindow = new GameWindow();
		var renderer = new Renderer(gameWindow);
		var keyboard = new Keyboard();
		var camera = new Camera();
		var worldGenerator = new WorldGenerator(GameConsts);
		var desiredFps = 60;

		var rooms = worldGenerator.generate();
		var playerPos = rooms[0].getCenter();
		playerPos.x *= GameConsts.tileSize;
		playerPos.y *= GameConsts.tileSize;

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

			camera.pos.x = playerPos.x - gameWindow.width / 2 + GameConsts.tileSize / 2;
			camera.pos.y = playerPos.y - gameWindow.height / 2 + GameConsts.tileSize / 2;

			requestAnimationFrame(function() {
				renderer.draw(playerPos, rooms, camera);
			});
		}, 1000/desiredFps);
	}

}

window.onload = function () {
	var cerulean = new Cerulean();
	cerulean.start();
};