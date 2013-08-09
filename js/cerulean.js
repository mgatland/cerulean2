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

		this.draw = function (player, rooms, camera, roomsExplored) {
			ctx.fillStyle = "#3f303f";
			ctx.fillRect(0,0, gameWindow.width, gameWindow.height);

			var wallWidth = GameConsts.tileSize;
			rooms.forEach(function (room) {
				if (!room.explored) return;
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

				ctx.fillStyle = "#ff0f0f";
				room.enemies.forEach(function (enemy) {
					ctx.fillRect(enemy.pos.x-camera.pos.x, enemy.pos.y-camera.pos.y,
						enemy.size.x, enemy.size.y);
				});
			});
			ctx.fillStyle = "white";
			ctx.fillRect(player.pos.x-camera.pos.x, player.pos.y-camera.pos.y, player.size.x, player.size.y);

			ctx.fillStyle = "white";
			ctx.font = '32px Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif';
			ctx.fillText("Rooms explored: " + roomsExplored + " of " + rooms.length, 40, gameWindow.height - 32);
		}
	}

	var Player = function () {
	}

	var Enemy = function (pos) {
		this.pos = pos;
		this.size = new Pos(32, 32);
	}

	this.start = function () {
		var gameWindow = new GameWindow();
		var renderer = new Renderer(gameWindow);
		var keyboard = new Keyboard();
		var camera = new Camera();
		var worldGenerator = new WorldGenerator(GameConsts, Enemy);
		var desiredFps = 60;

		var roomsExplored = 0;
		var rooms = worldGenerator.generate();

		var player = new Player();
		player.pos = rooms[0].getCenter();
		player.pos.x *= GameConsts.tileSize;
		player.pos.y *= GameConsts.tileSize;
		player.room = rooms[0];
		player.size = new Pos(GameConsts.tileSize-4, GameConsts.tileSize-4);

		rooms[0].explored = true;
		roomsExplored++;

		var update = function () {
			if (keyboard.isKeyDown(KeyEvent.DOM_VK_RIGHT)) {
				player.pos.x += 4;
				while (player.room.isCollidingWith(player)) {
					player.pos.x -= 1;
				}
			} else if (keyboard.isKeyDown(KeyEvent.DOM_VK_LEFT)) {
				player.pos.x -= 4;
				while (player.room.isCollidingWith(player)) {
					player.pos.x += 1;
				}
			}
			if (keyboard.isKeyDown(KeyEvent.DOM_VK_UP)) {
				player.pos.y -= 4;
				while (player.room.isCollidingWith(player)) {
					player.pos.y += 1;
				}
			} else if (keyboard.isKeyDown(KeyEvent.DOM_VK_DOWN)) {
				player.pos.y += 4;
				while (player.room.isCollidingWith(player)) {
					player.pos.y -= 1;
				}
			}
			if (!player.room.containsAllOf(player)) {
				player.room.doors.forEach(function (door) {
					if (door.otherRoom.containsSomeOf(player)) {
						if (!door.otherRoom.explored) {
							door.otherRoom.explored = true;
							roomsExplored++;
						}
						if (door.otherRoom.containsCenterOf(player)) {
							player.lastRoom = player.room;
							player.room = door.otherRoom;
						} else {
							player.lastRoom = door.otherRoom;
						}
					}
				});
			}

			keyboard.update();
		}

		//cross browser hacks
		var requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame ||
		window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;
  		window.requestAnimationFrame = requestAnimationFrame;

		window.setInterval(function () {
			update();

			camera.pos.x = player.pos.x - gameWindow.width / 2 + GameConsts.tileSize / 2;
			camera.pos.y = player.pos.y - gameWindow.height / 2 + GameConsts.tileSize / 2;

			requestAnimationFrame(function() {
				renderer.draw(player, rooms, camera, roomsExplored);
			});
		}, 1000/desiredFps);
	}

}

window.onload = function () {
	var cerulean = new Cerulean();
	cerulean.start();
};