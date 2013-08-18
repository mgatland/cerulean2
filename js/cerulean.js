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

	var Player = function () {
		this.maxHealth = 5;
		this.health = 0;
		this.invlunerableTime = 0;
		this.shieldRechange = 0;
		this.home = null;
		this.items = 0;

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
			if (this.room) this.room.cleanUp();
			if (this.lastRoom) this.lastRoom.cleanUp();
			this.room = this.home;
			this.lastRoom = null;
		}

		//duplicate code with Enemy.getCenter
		this.getCenter = function () {
			var x = Math.floor(this.pos.x + this.size.x / 2);
			var y = Math.floor(this.pos.y + this.size.y / 2);
			return new Pos(x, y);
		}

		this._moveInDir = function (dir, maxSpeed) {
			var speed = maxSpeed ? Math.min(maxSpeed, 4) : 4;
			this.pos.moveInDir(dir, speed);
			while (this.room.isCollidingWith(this)) {
				this.pos.moveInDir(dir, -1);
			}
		}

		//horizontal or vertical
		this._moveTowards = function (destination, moveType) {
			var center = this.getCenter();
			if (moveType == "horizontal") {
				var distance = Math.abs(destination.x - center.x);
				if (distance == 0) return;
				if (destination.x < center.x) {
					this._moveInDir(Dir.LEFT, distance);
				} else {
					this._moveInDir(Dir.RIGHT, distance);
				}
			} else if (moveType == "vertical") {
				var distance = Math.abs(destination.y - center.y);
				if (distance == 0) return;
				if (destination.y < center.y) {
					this._moveInDir(Dir.UP, distance);
				} else {
					this._moveInDir(Dir.DOWN, distance);
				}
			}
		}

		this._autoMove = function (moveType) {
			var player = this;
			var myDoor = this.room.doors.filter(function (d) {
				return d.overlaps(player);
			});
			if (myDoor.length > 0) {
				var door = myDoor[0];
				var doorCenter = door.getCenter();
				if (moveType == "vertical" && door.direction.isHorizontal) {
					this._moveTowards(doorCenter, "vertical");
				} else if (moveType == "horizontal" && !door.direction.isHorizontal) {
					var doorCenter = door.getCenter();
					this._moveTowards(doorCenter, "horizontal");
				}
			}
		}

		this._updateControls = function (keyboard) {
			if (this.health <= 0) return;

			if (keyboard.isKeyDown(KeyEvent.DOM_VK_SPACE)) {
				isChargingAttack = true;
			} else {
				isChargingAttack = false;
			}

			var up = keyboard.isKeyDown(KeyEvent.DOM_VK_UP);
			var down = keyboard.isKeyDown(KeyEvent.DOM_VK_DOWN);
			var left = keyboard.isKeyDown(KeyEvent.DOM_VK_LEFT);
			var right = keyboard.isKeyDown(KeyEvent.DOM_VK_RIGHT);

			var oldPos = this.pos.clone();

			if (right) {
				this._moveInDir(Dir.RIGHT);
			} else if (left) {
				this._moveInDir(Dir.LEFT);
			}

			if (up) {
				this._moveInDir(Dir.UP);
			} else if (down) {
				this._moveInDir(Dir.DOWN);
			}

			//If we're running into a wall, make an automove.
			if (oldPos.x == this.pos.x && (left || right)) this._autoMove("vertical");
			if (oldPos.y == this.pos.y && (up || down)) this._autoMove("horizontal");

		}

		this.attack = function (roomToAttack) {
			var player = this;
			roomToAttack.flashing = Math.floor(Math.max(3, 25 * player.attackCharge / player.maxAttackCharge));
			roomToAttack.enemies.forEach(function (enemy) {
				enemy.shocked(player.attackPowerOn(enemy));
			});
			roomToAttack.shots.forEach(function (shot) {
				shot.shocked(player.attackPowerOn(shot));
			});

		}

		this.update = function (keyboard, audioUtil, roomsExplored) {
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

			audioUtil.setCharging(isChargingAttack);

			if (this.invlunerableTime > 0) {
				this.invlunerableTime--;
			} else {
				if (this.health <= 0) {
					track("respawned", ""+roomsExplored);
					this.respawn();
				}

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
				isChargingAttack = false;
				this.attackCharge = 0;
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
		this.update = function (player, audioUtil) {
			var xSpeed = (this.speed * Math.sin(3.14159 / 180.0 * this.angle));
			var ySpeed = (this.speed * -Math.cos(3.14159 / 180 * this.angle));
			this.pos.x += xSpeed;
			this.pos.y += ySpeed;
			if (room.isCollidingWith(this, true)) {
				this.live = false;
			}
			if (player && player.isCollidingWith(this)) {
				player.hit();
				audioUtil.shotHitPlayer();
				this.live = false;
			}

			//update highlight status
			if (player && player.attackPowerOn(this) > this.health) {
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
				room.items.push(new Item(this.pos));
			}
		}
	}

	var Item = function (pos) {
		this.live = true;
		this.pos = pos;

		this.update = function (player) {
			if (player) {
				var distance = this.pos.distanceTo(player.getCenter());
				if (distance < 128) {
					var angle = this.pos.angleTo(player.getCenter());
					var speed = 6 * (128 - distance) / 128;
					var xSpeed = (speed * Math.sin(3.14159 / 180.0 * angle));
					var ySpeed = (speed * -Math.cos(3.14159 / 180 * angle));
					this.pos.x += xSpeed;
					this.pos.y += ySpeed;
				}
				if (distance < player.size.x / 2 || distance < player.size.y / 2) {
					this.live = false;
					player.items++;
				}
			}
		};
	}

	var Enemy = function (pos, room, type) {
		this.pos = pos;
		this.room = room;
		this.dest = null;
		this.refireTimer = 0;
		this.health = 20;
		this.live = true;
		this.angle = 0;
		this.fireAngle = Math.floor(Math.random() * 360);
		this.type = type;

		if (this.type == 0) { //fires at player square
			this.size = new Pos(25, 25);
			this.speed = 0.3;
			this.health = 20;
		} else if (this.type == 1) { //fires in a spiral horizontal line
			this.size = new Pos(35, 20);
			this.speed = 0.0;
			this.health = 15;
		} else if (this.type == 2) { //fires 5 shots at player (big square)
			this.size = new Pos(44, 44);
			this.speed = 0.2;
			this.health = 30;
		} else if (this.type == 3) {//rapidfire left and right of player (vertical line)
			this.size = new Pos(20, 35);
			this.speed = 0.3;
			this.health = 10;
		} else { //fires radially
			this.size = new Pos(44, 30); //big horziontal line
			this.speed = 0.0;
			this.health = 10;
		}

		this.getCenter = function () {
			var x = Math.floor(this.pos.x + this.size.x / 2);
			var y = Math.floor(this.pos.y + this.size.y / 2);
			return new Pos(x, y);
		}

		this.update = function (player, audioUtil) {
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
				if (player) {

					if (this.type == 0) {
						//the seeking shot
						var angle = this.pos.angleTo(player.pos);
						var shot = new Shot(this.getCenter(), room, angle);
						room.shots.push(shot);
						this.refireTimer = 15;
					} else if (this.type == 1) {
						//the spinner shot
						this.fireAngle += 25;
						if (this.fireAngle > 360) this.fireAngle -= 360;
						var shot2 = new Shot(this.getCenter(), room, this.fireAngle);
						room.shots.push(shot2);
						this.refireTimer = 7;
					} else if (this.type == 2) {
						var angle = this.pos.angleTo(player.pos);
						for (var i = -2; i <= 2; i++) {
							room.shots.push(new Shot(this.getCenter(), room, angle + 10*i));
						}
						this.refireTimer = 15;
					} else if (this.type == 3) {
						var angle = this.pos.angleTo(player.pos);
						for (var i = -1; i <= 1; i+= 2) {
							room.shots.push(new Shot(this.getCenter(), room, angle + 40*i));
						}
						this.refireTimer = 8;
					} else {
						var angle = this.fireAngle;
						for (var i = 0; i < 360; i+= 30) {
							room.shots.push(new Shot(this.getCenter(), room, angle + i));
						}
						this.refireTimer = 30;
						this.fireAngle += 5;
						if (this.fireAngle > 360) this.fireAngle -= 360;
					}

				audioUtil.enemyAttack();

				}

			} else {
				this.refireTimer--;
			}

			//duplicate code from Shot
			//update highlight status
			if (player && player.attackPowerOn(this) > this.health) {
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
				for (var x = this.pos.x; x < this.pos.x + this.size.x; x += 5) {
					for (var y = this.pos.y; y < this.pos.y + this.size.y; y += 5) {
						this.room.items.push(new Item(new Pos(x, y)));
					}
				}
			}
		}
	}

	this.load = function () {

		var audioUtil = new AudioUtil();
		loadFiles(['shaders/fragment.glsl', 'shaders/vertex.glsl'], function (shaders) {
			start(shaders, audioUtil);
		}, function (url) {
		    alert('Failed to download "' + url + '"');
		});
	}

	var start = function (shaders, audioUtil) {
		var gameWindow = new GameWindow();
		var renderer = new Renderer(gameWindow, GameConsts, shaders);
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
		player.size = new Pos(20, 20);
		player.setHome(rooms[0]);
		player.respawn();

		rooms[0].explored = true;
		roomsExplored++;

		var update = function () {
			player.room.update(player, audioUtil);
			if (player.lastRoom) player.lastRoom.update(player, audioUtil);

			player.update(keyboard, audioUtil, roomsExplored); //roomsExplored is just for analytics

			if (!player.room.containsAllOf(player)) {
				player.attackCharge = 0; //discharge attack when between rooms
				player.room.doors.forEach(function (door) {
					if (door.otherRoom.containsSomeOf(player)) {
						if (!door.otherRoom.explored) {
							door.otherRoom.explored = true;
							roomsExplored++;
							if (roomsExplored % 10 == 0) {
								track("explored", ""+roomsExplored);
							}

							//Hack to hide instructions
							if (roomsExplored == 10) {
								document.getElementById('instructions').style.display = "none";
							}
						}
						if (door.otherRoom.containsCenterOf(player)) {
							var oldRoom = player.lastRoom;
							player.lastRoom = player.room;
							player.room = door.otherRoom;
							if (oldRoom && oldRoom != player.lastRoom && oldRoom != player.room) {
								oldRoom.cleanUp();
							}
						} else {
							var oldRoom = player.lastRoom;
							player.lastRoom = door.otherRoom;
							if (oldRoom && oldRoom != player.lastRoom && oldRoom != player.room) {
								oldRoom.cleanUp();
							}
						}
					}
				});
			} else {
				//we're fully inside one room now.
				if (player.lastRoom) {
					player.lastRoom.cleanUp();
					player.lastRoom = null;
				}
			}

			keyboard.update();
			audioUtil.update();
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
	cerulean.load();
};