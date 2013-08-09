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

		this.draw = function (player, rooms, camera, roomsExplored, currentFps) {
			ctx.fillStyle = "#3f303f";
			ctx.fillRect(0,0, gameWindow.width, gameWindow.height);

			var wallWidth = GameConsts.tileSize;
			rooms.forEach(function (room) {
				if (!room.explored) return;
				if ((room.pos.x + room.size.x) * GameConsts.tileSize < camera.pos.x) return;
				if ((room.pos.y + room.size.y) * GameConsts.tileSize < camera.pos.y) return;

				if (room.pos.x * GameConsts.tileSize > camera.pos.x + gameWindow.width) return;
				if (room.pos.y * GameConsts.tileSize > camera.pos.y + gameWindow.height) return;

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

				ctx.fillStyle = "#ff0f0f";
				room.shots.forEach(function (shot) {
					ctx.fillRect(shot.pos.x-camera.pos.x-5, shot.pos.y-camera.pos.y-5,
						10, 10);
				});
			});
			ctx.fillStyle = "white";
			ctx.fillRect(player.pos.x-camera.pos.x, player.pos.y-camera.pos.y, player.size.x, player.size.y);

			ctx.fillStyle = "white";
			ctx.font = '32px Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif';
			ctx.fillText("Rooms explored: " + roomsExplored + " of " + rooms.length, 40, gameWindow.height - 32);
			ctx.fillText("FPS: " + currentFps, 512, gameWindow.height - 32);
		}
	}

	var Player = function () {
		this.maxHealth = 5;
		this.health = 0;
		this.invlunerableTime = 0;
		this.shieldRechange = 0;
		this.home = null;
		this.isCollidingWith = function (point) {
			return (point.pos.x >= this.pos.x && point.pos.y >= this.pos.y
				&& point.pos.x < this.pos.x + this.size.x && point.pos.y < this.pos.y + this.size.y);
		}

		this.setHome = function (room) {
			this.home = room;
		}

		this.respawn = function () {
			this.health = this.maxHealth;
			this.pos = this.home.getCenter();
			this.pos.x *= GameConsts.tileSize;
			this.pos.y *= GameConsts.tileSize;
			this.room = this.home;
			this.lastRoom = null;
		}

		this.update = function () {
			if (this.invlunerableTime > 0) {
				this.invlunerableTime--;
			} else {
				if (this.health < this.maxHealth) {
					this.shieldRechange++;
					if (this.shieldRechange > 30) {
						this.shieldRechange = 0;
						this.health++;
					}
				}
			}
		}

		this.hit = function () {
			if (this.invlunerableTime > 0) return;
			this.health--;
			this.shieldRechange = 0;
			console.log('hit!');
			if (this.health > 0) {
				this.invlunerableTime = 15;
			} else {
				this.respawn();
			}

		}
	}

	var Shot = function (pos, room, angle) {
		this.angle = angle;
		this.pos = pos;
		this.speed = 1;
		this.live = true;
		this.update = function (player) {
			var xSpeed = (this.speed * Math.sin(3.14159 / 180.0 * this.angle));
			var ySpeed = (this.speed * -Math.cos(3.14159 / 180 * this.angle));
			this.pos.x += xSpeed;
			this.pos.y += ySpeed;
			if (room.isCollidingWith(this, true)) {
				this.live = false;
			}
			if (player.isCollidingWith(this)) {
				player.hit();
				this.live = false;
			}
		}
	}

	var Enemy = function (pos, room) {
		this.pos = pos;
		this.room = room;
		this.size = new Pos(32, 32);
		this.dest = null;
		this.refireTimer = 0;

		this._getCenter = function () {
			var x = Math.floor(this.pos.x + this.size.x / 2);
			var y = Math.floor(this.pos.y + this.size.y / 2);
			return new Pos(x, y);
		}

		this.update = function (player) {
			//move
			if (!this.dest) {
				this.dest = room.getRandomPointInside();
			}

			if (this.pos.x > this.dest.x) this.pos.x -= 1;
			if (this.pos.x < this.dest.x) this.pos.x += 1;
			if (this.pos.y > this.dest.y) this.pos.y -= 1;
			if (this.pos.y < this.dest.y) this.pos.y += 1;

			if (this.pos.distanceTo(this.dest) < 16) {
				this.dest = null;
			}
			//shoot
			if (this.refireTimer == 0) {
				console.log("shoot");
				var shot = new Shot(this._getCenter(), room, this.pos.angleTo(player.pos));
				room.shots.push(shot);
				this.refireTimer = 25;
			} else {
				this.refireTimer--;
			}
		}
	}

	this.start = function () {
		var gameWindow = new GameWindow();
		var renderer = new Renderer(gameWindow);
		var keyboard = new Keyboard();
		var camera = new Camera();
		var worldGenerator = new WorldGenerator(GameConsts, Enemy);
		var desiredFps = 60;

		//fps  counter
		var currentFps = 0;
		var framesThisSecond = 0;
		var thisSecond = 0;

		var roomsExplored = 0;
		var rooms = worldGenerator.generate();

		var player = new Player();
		player.size = new Pos(GameConsts.tileSize-4, GameConsts.tileSize-4);
		player.setHome(rooms[0]);
		player.respawn();

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

			player.update();
			player.room.update(player);
			if (player.lastRoom) player.lastRoom.update(player);

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
			} else {
				player.lastRoom = null;
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
				renderer.draw(player, rooms, camera, roomsExplored, currentFps);
				var newSecond = Math.floor(Date.now() / 1000);
				if (newSecond != thisSecond) {
					thisSecond = newSecond;
					currentFps = framesThisSecond;
					framesThisSecond = 0;
				}
				framesThisSecond++;
			});
		}, 1000/desiredFps);
	}

}

window.onload = function () {
	var cerulean = new Cerulean();
	cerulean.start();
};