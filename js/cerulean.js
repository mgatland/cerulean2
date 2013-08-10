var Cerulean = function () {

	var GameWindow = function () {
		this.width = 1024;
		this.height = 768;
	}

	var GameConsts = {
		tileSize: 32,
		worldWidth: 280,
		worldHeight: 230,
		wallWidth: 8
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

			var wallWidth = GameConsts.wallWidth;
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

				if (room != player.room && room != player.lastRoom) return;

				room.enemies.forEach(function (enemy) {
					if (enemy.targetted) {
						ctx.fillStyle = "#00ff00";
					} else {
						ctx.fillStyle = "#ff0f0f";
					}
					ctx.fillRect(enemy.pos.x-camera.pos.x, enemy.pos.y-camera.pos.y,
						enemy.size.x, enemy.size.y);
				});

				ctx.fillStyle = "#ff0f0f";
				room.shots.forEach(function (shot) {
					if (shot.targetted) {
						ctx.fillStyle = "#00ff00";
					} else {
						ctx.fillStyle = "#ff0f0f";
					}
					ctx.fillRect(shot.pos.x-camera.pos.x-5, shot.pos.y-camera.pos.y-5,
						10, 10);
				});
			});

			//drawplayer
			if (player.invlunerableTime > 0) {
				ctx.fillStyle = "#ffff00";
			} else {
				ctx.fillStyle = "white";
			}
			ctx.fillRect(player.pos.x-camera.pos.x, player.pos.y-camera.pos.y, player.size.x, player.size.y);

			//draw attack attackCharge

			ctx.fillStyle = "#ffff00";
			var width = Math.floor(gameWindow.width * player.attackCharge / player.maxAttackCharge);
			ctx.fillRect(0, gameWindow.height - 32, width, 32);

			ctx.fillStyle = "white";
			ctx.font = '32px Calibri, Candara, Segoe, "Segoe UI", Optima, Arial, sans-serif';
			ctx.fillText("Rooms explored: " + roomsExplored + " of " + rooms.length, 40, gameWindow.height - 64);
			ctx.fillText("FPS: " + currentFps, 512, gameWindow.height - 64);
		}
	}

	var Player = function () {
		this.maxHealth = 5;
		this.health = 0;
		this.invlunerableTime = 0;
		this.shieldRechange = 0;
		this.home = null;

		this.attackCharge = 0;
		this.maxAttackCharge = 5 * 60;
		var isChargingAttack = false;

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

		//duplicate code with Enemy.getCenter
		this.getCenter = function () {
			var x = Math.floor(this.pos.x + this.size.x / 2);
			var y = Math.floor(this.pos.y + this.size.y / 2);
			return new Pos(x, y);
		}

		this._updateControls = function (keyboard) {
			if (this.health <= 0) return;

			if (keyboard.isKeyDown(KeyEvent.DOM_VK_SPACE)) {
				isChargingAttack = true;
			} else {
				isChargingAttack = false;
			}

			if (keyboard.isKeyDown(KeyEvent.DOM_VK_RIGHT)) {
				this.pos.x += 4;
				while (this.room.isCollidingWith(this)) {
					this.pos.x -= 1;
				}
			} else if (keyboard.isKeyDown(KeyEvent.DOM_VK_LEFT)) {
				this.pos.x -= 4;
				while (this.room.isCollidingWith(this)) {
					this.pos.x += 1;
				}
			}
			if (keyboard.isKeyDown(KeyEvent.DOM_VK_UP)) {
				this.pos.y -= 4;
				while (this.room.isCollidingWith(this)) {
					this.pos.y += 1;
				}
			} else if (keyboard.isKeyDown(KeyEvent.DOM_VK_DOWN)) {
				this.pos.y += 4;
				while (this.room.isCollidingWith(this)) {
					this.pos.y -= 1;
				}
			}
		}

		this.attack = function (roomToAttack) {
			var player = this;
			roomToAttack.enemies.forEach(function (enemy) {
				enemy.shocked(player.attackPowerOn(enemy));
			});
			roomToAttack.shots.forEach(function (shot) {
				shot.shocked(player.attackPowerOn(shot));
			});

		}

		this.update = function (keyboard) {
			this._updateControls(keyboard);

			if (this.health > 0) {
				if (isChargingAttack) {
					this.attackCharge++;
					if (this.attackCharge > this.maxAttackCharge) {
						this.attackCharge = this.maxAttackCharge;
					}
				} else {
					if (this.attackCharge > 0) {
						this.attack(this.room);
						if (this.lastRoom) this.attack(this.lastRoom);
					}
					this.attackCharge = 0;
				}
			}

			if (this.invlunerableTime > 0) {
				this.invlunerableTime--;
			} else {
				if (this.health <= 0) this.respawn();

				if (this.health < this.maxHealth) {
					this.shieldRechange++;
					if (this.shieldRechange > 60) {
						this.shieldRechange = 0;
						this.health++;
					}
				}
			}
		}

		this.hit = function () {
			if (this.invlunerableTime > 0 || this.health <= 0) return;
			this.health--;
			this.shieldRechange = 0;
			console.log('hit!');
			if (this.health > 0) {
				this.invlunerableTime = 2;
			} else {
				this.invlunerableTime = 60; //we won't respawn until this wears off
			}
		}

		this.attackPowerOn = function (enemy) {
			var dist = this.getCenter().distanceTo(enemy.getCenter());
			return Math.floor(100 * this.attackCharge / this.maxAttackCharge - dist/10);
		}
	}

	var Shot = function (pos, room, angle) {
		this.angle = angle;
		this.pos = pos;
		this.speed = 2;
		this.live = true;
		this.targetted = false;
		this.health = 1;
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

			//update highlight status
			if (player.attackPowerOn(this) > this.health) {
				this.targetted = true;
			} else {
				this.targetted = false;
			}
		}

		this.getCenter = function () {
			return this.pos;
		}

		this.shocked = function (damage) {
			if (!this.live) return;
			if (damage > this.health) {
				this.health = 0;
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
		this.health = 20;
		this.live = true;
		this.angle = 0;
		this.speed = 0.3;
		this.fireAngle = Math.floor(Math.random() * 360);
		this.type = Math.floor(Math.random() * 2);

		this.getCenter = function () {
			var x = Math.floor(this.pos.x + this.size.x / 2);
			var y = Math.floor(this.pos.y + this.size.y / 2);
			return new Pos(x, y);
		}

		this.update = function (player) {
			//move
			if (!this.dest) {
				this.dest = room.getRandomPointInside();
				this.angle = this.pos.angleTo(this.dest);
			}

			var xSpeed = (this.speed * Math.sin(3.14159 / 180.0 * this.angle));
			var ySpeed = (this.speed * -Math.cos(3.14159 / 180 * this.angle));
			this.pos.x += xSpeed;
			this.pos.y += ySpeed;

			if (this.pos.distanceTo(this.dest) < 16) {
				this.dest = null;
			}
			//shoot
			if (this.refireTimer == 0) {
				console.log("shoot");

				if (this.type == 0) {
					//the seeking shot
					var angle = this.pos.angleTo(player.pos);
					var shot = new Shot(this.getCenter(), room, angle);
					room.shots.push(shot);
					this.refireTimer = 15;
				} else {
					//the spinner shot
					this.fireAngle += 25;
					if (this.fireAngle > 360) this.fireAngle -= 360;
					var shot2 = new Shot(this.getCenter(), room, this.fireAngle);
					room.shots.push(shot2);
					this.refireTimer = 7;
				}

			} else {
				this.refireTimer--;
			}

			//duplicate code from Shot
			//update highlight status
			if (player.attackPowerOn(this) > this.health) {
				this.targetted = true;
			} else {
				this.targetted = false;
			}
		}

		//duplicate code from Shot
		this.shocked = function (damage) {
			if (!this.live) return;
			if (damage > this.health) {
				this.health = 0;
				this.live = false;
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
			player.update(keyboard);
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
							player.attackCharge = 0; //discharge attack
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