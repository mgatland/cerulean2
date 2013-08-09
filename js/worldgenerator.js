var WorldGenerator = function (gameConsts, Enemy) {

	var Dir = {UP: 0, DOWN: 1, LEFT:2, RIGHT: 3};

	var Door = function (x, y, otherRoom) {
		this.pos = new Pos(x,y);
		this.otherRoom = otherRoom;
	}

	var Room = function (x, y, width, height) {
		this.pos = new Pos(x, y);
		this.size = new Pos(width, height);
		this.doors = [];
		this.enemies = [];

		this.addDoor = function (x, y, otherRoom) {
			this.doors.push(new Door(x,y, otherRoom));
		}

		this.getCenter = function () {
			var x = this.pos.x + this.size.x / 2;
			var y = this.pos.y + this.size.y / 2;
			return new Pos(Math.floor(x), Math.floor(y));
		}

		this.toString = function () {
			return "Room " + this.pos + "|" + this.size;
		};

		this._isCollidingWithPoint = function (x, y) {
			var gridX = Math.floor(x / gameConsts.tileSize);
			var gridY = Math.floor(y / gameConsts.tileSize);
			if (gridX == this.pos.x || gridX == this.pos.x + this.size.x - 1
				|| gridY == this.pos.y || gridY == this.pos.y + this.size.y - 1) {

				//it's wall unless it's a door.
				return !(this.doors.some(function (door) {
					return (gridX == door.pos.x && gridY == door.pos.y);
				}));
			}
			return false;
		}

		this._containsPos = function (x, y) {
			var gridX = Math.floor(x / gameConsts.tileSize);
			var gridY = Math.floor(y / gameConsts.tileSize);
			return (this.pos.x <= gridX && this.pos.x + this.size.x > gridX
				&& this.pos.y <= gridY && this.pos.y + this.size.y > gridY);
		}

		this.containsCenterOf = function (player) {
			return (this._containsPos(player.pos.x+player.size.x/2, player.pos.y+player.size.y/2));
		}

		this.containsAllOf = function (player) {
			if (!this._containsPos(player.pos.x, player.pos.y)) return false;
			if (!this._containsPos(player.pos.x+player.size.x, player.pos.y)) return false;
			if (!this._containsPos(player.pos.x+player.size.x, player.pos.y+player.size.y)) return false;
			if (!this._containsPos(player.pos.x, player.pos.y+player.size.y)) return false;
			return true;
		}

		this.containsSomeOf = function (player) {
			if (this._containsPos(player.pos.x, player.pos.y)) return true;
			if (this._containsPos(player.pos.x+player.size.x, player.pos.y)) return true;
			if (this._containsPos(player.pos.x+player.size.x, player.pos.y+player.size.y)) return true;
			if (this._containsPos(player.pos.x, player.pos.y+player.size.y)) return true;
			return false;
		}

		this.isCollidingWith = function (player) {
			//check each corner. This only works for objects one tile large or smaller.
			if (this._isCollidingWithPoint(player.pos.x, player.pos.y)) return true;
			if (this._isCollidingWithPoint(player.pos.x+player.size.x, player.pos.y)) return true;
			if (this._isCollidingWithPoint(player.pos.x+player.size.x, player.pos.y+player.size.y)) return true;
			if (this._isCollidingWithPoint(player.pos.x, player.pos.y+player.size.y)) return true;
			return false;
		}

		this.getRandomPointInside = function () {
			var x = rand(this.pos.x + 1, this.pos.x + this.size.x - 2);
			var y = rand(this.pos.y + 1, this.pos.y + this.size.y - 2);
			return new Pos(x * gameConsts.tileSize, y * gameConsts.tileSize);
		}
	}

	var addDoorsBetween = function (room, newRoom, direction) {
		var minX;
		var maxX;
		switch (direction) {
			case Dir.UP:
			case Dir.DOWN:
				minX = Math.max(newRoom.pos.x + 1, room.pos.x + 1);
				maxX = Math.min(newRoom.pos.x + newRoom.size.x - 2, room.pos.x + room.size.x - 2);
				break;
			case Dir.LEFT:
				minX = room.pos.x;
				maxX = minX;
				break;
			case Dir.RIGHT:
				minX = room.pos.x + room.size.x - 1;
				maxX = minX;
				break;
			break;
		}
		var minY;
		var maxY;
		switch (direction) {
			case Dir.LEFT:
			case Dir.RIGHT:
				minY = Math.max(newRoom.pos.y + 1, room.pos.y + 1);
				maxY = Math.min(newRoom.pos.y + newRoom.size.y - 2, room.pos.y + room.size.y - 2);
				break;
			case Dir.UP:
				minY = room.pos.y;
				maxY = minY;
				break;
			case Dir.DOWN:
				minY = room.pos.y + room.size.y - 1;
				maxY = minY;
				break;
			break;
		}
		var x = Math.floor(minX + Math.random() * (maxX - minX));
		var y = Math.floor(minY + Math.random() * (maxY - minY));
		room.addDoor(x, y, newRoom);
		switch (direction) {
			case Dir.LEFT:
				x--;
				break;
			case Dir.RIGHT:
				x++;
				break;
			case Dir.UP:
				y--;
				break;
			case Dir.DOWN:
				y++;
				break;
		}
		newRoom.addDoor(x, y, room);
	};

	var roomCollidesWith = function (room, x, y, width, height) {
		return (room.pos.x < x + width && room.pos.x + room.size.x > x
			&& room.pos.y < y + height  && room.pos.y + room.size.y > y);
	}

	var rand = function (min, max) {
		return Math.floor(Math.random() * (max-min) + min);
	}

	var addRoom = function (startRoom, direction, openRooms, closedRooms, worldWidth, worldHeight) {
		if (closedRooms.length > 2000) {
			console.log("Too many rooms!");
			return; //abort
		}

		var width;
		var height;
		var maxExpansions;
		var hallway = false;

		var randRoomValue = rand(0, 100);
		if (randRoomValue < 95) { //normal or jumbo rooms
			width = 5;
			height = 5;
			maxExpansions = rand(0,100) < 70 ? rand(5,6) : 15;
		} else { //hallway rooms
			hallway = true;
			if (rand(0,2) == 1) {
				width = 3;
				height = 6;
			} else {
				width = 6;
				height = 3;
			}
			maxExpansions = 9;
		}

		var x;
		var y;
		switch (direction) {
			case Dir.UP:
				x = rand(startRoom.pos.x-width+3, startRoom.pos.x + startRoom.size.x - 3);
				y = startRoom.pos.y - height;
			break;
			case Dir.DOWN:
				x = rand(startRoom.pos.x-width+3, startRoom.pos.x + startRoom.size.x - 3);
				y = startRoom.pos.y + startRoom.size.y;
			break;
			case Dir.LEFT:
				x = startRoom.pos.x - width;
				y = rand(startRoom.pos.y-height+3, startRoom.pos.y + startRoom.size.y - 3);
			break;
			case Dir.RIGHT:
				x = startRoom.pos.x + startRoom.size.x;
				y = rand(startRoom.pos.y-height+3, startRoom.pos.y + startRoom.size.y - 3);
			break;
		}
		if (x < 0 || y < 0 || x > worldWidth || y > worldHeight) return;

		var nearbyClosedRooms = closedRooms.filter(function (room) {
			return roomCollidesWith(room, x-maxExpansions-1, y-maxExpansions-1, width+maxExpansions*2+2, height+maxExpansions*2+2);
		});
		var nearbyOpenRooms = openRooms.filter(function (room) {
			return roomCollidesWith(room, x-maxExpansions-1, y-maxExpansions-1, width+maxExpansions*2+2, height+maxExpansions*2+2);
		});
		var nearbyRooms = nearbyOpenRooms.concat(nearbyClosedRooms);

		//Are we already colliding? If so, abort, this room will never fit.
		if (nearbyRooms.some(function (room) {
			return roomCollidesWith(room, x, y, width, height);
		})) return;

		//direction we can expand:
		var expansions = [Dir.LEFT, Dir.RIGHT, Dir.UP, Dir.DOWN];

		//special rules for hallways - never get wider
		if (hallway) {
			if (width > height) {
				expansions = [Dir.LEFT, Dir.RIGHT];
			} else {
				expansions = [Dir.UP, Dir.DOWN];
			}
		}

		var expansionCount = 0;
		while (expansions.length > 0 && expansionCount < maxExpansions) {
			var rnd = rand(0, expansions.length);
			var rndDir = expansions[rnd];
			switch(rndDir) {
				case Dir.UP:
					if (nearbyRooms.some(function (room) {
						return roomCollidesWith(room, x, y - 1, width, 1);
					}) || y == 0) {
						expansions = expansions.filter(function (e) {return e != rndDir});
					} else {
						y--;
						height++;
						expansionCount++;
					}
					break;
				case Dir.DOWN:
					if (nearbyRooms.some(function (room) {
						return roomCollidesWith(room, x, y + height, width, 1);
					}) || y + height == worldHeight) {
						expansions = expansions.filter(function (e) {return e != rndDir});
					} else {
						height++;
						expansionCount++;
					}
					break;
				case Dir.LEFT:
					if (nearbyRooms.some(function (room) {
						return roomCollidesWith(room, x-1, y, 1, height);
					}) || x == 0) {
						expansions = expansions.filter(function (e) {return e != rndDir});
					} else {
						x--;
						width++;
						expansionCount++;
					}
					break;
				case Dir.RIGHT:
					if (nearbyRooms.some(function (room) {
						return roomCollidesWith(room, x+width, y, 1, height);
					}) || x + width == worldWidth) {
						expansions = expansions.filter(function (i) {i != rndDir});
					} else {
						width++;
						expansionCount++;
					}
					break;
				default:
					console.log("Weird expansion dir " + rndDir);
			}
		}

		var newRoom = new Room(x, y, width, height);
		//addDoorsBetween(startRoom, newRoom, direction);

		//Find rooms to add doorways to
		nearbyRooms.filter(function (room) {
			return roomCollidesWith(room, x - 1, y+2, 1, height-4);
		}).forEach(function (room) {
			addDoorsBetween(newRoom, room, Dir.LEFT);
		});

		nearbyRooms.filter(function (room) {
			return roomCollidesWith(room, x + width, y+2, 1, height-4);
		}).forEach(function (room) {
			addDoorsBetween(newRoom, room, Dir.RIGHT);
		});

		nearbyRooms.filter(function (room) {
			return roomCollidesWith(room, x+2, y-1, width-4, 1);
		}).forEach(function (room) {
			addDoorsBetween(newRoom, room, Dir.UP);
		});

		nearbyRooms.filter(function (room) {
			return roomCollidesWith(room, x+2, y+height, width-4, 1);
		}).forEach(function (room) {
			addDoorsBetween(newRoom, room, Dir.DOWN);
		});

		openRooms.push(newRoom);

		//set up enemies in room
		var area = (width - 2) * (height - 2);
		if (area < 16) return;
		if (area <= 20) {
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
		} else if (area < 40) {
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
		} else if (area < 60) {
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
		} else {
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
			newRoom.enemies.push(new Enemy(newRoom.getRandomPointInside()));
		}
	}

	this.generate = function () {
		var worldWidth = gameConsts.worldWidth;
		var worldHeight = gameConsts.worldHeight;
		var openRooms = [];
		var closedRooms = [];
		var firstRoom = new Room(Math.floor(worldWidth / 2)-5, Math.floor(worldHeight / 2)-5, 11, 11);
		openRooms.push(firstRoom);

		while (openRooms.length > 0) {
			var room = (Math.random() > 0.5) ? openRooms.shift() : openRooms.pop();
			closedRooms.push(room);
			addRoom(room, Dir.UP, openRooms, closedRooms, worldWidth, worldHeight);
			addRoom(room, Dir.LEFT, openRooms, closedRooms, worldWidth, worldHeight);
			addRoom(room, Dir.DOWN, openRooms, closedRooms, worldWidth, worldHeight);
			addRoom(room, Dir.RIGHT, openRooms, closedRooms, worldWidth, worldHeight);
		}
		console.log("Room count: " + closedRooms.length);
		return closedRooms;
	}
}