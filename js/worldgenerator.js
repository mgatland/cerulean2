var WorldGenerator = function () {

	var Dir = {UP: 0, DOWN: 1, LEFT:2, RIGHT: 3};

	var Door = function (x, y) {
		this.pos = new Pos(x,y);
	}

	var Room = function (x, y, width, height) {
		this.pos = new Pos(x, y);
		this.size = new Pos(width, height);
		this.doors = [];
		this.addDoor = function (x, y) {
			this.doors.push(new Door(x,y));
		}

		this.toString = function () {
			return "Room " + this.pos + "|" + this.size;
		};
	}

	var addRoom = function (startRoom, direction, openRooms, closedRooms, worldWidth, worldHeight) {
		if (closedRooms.length > 200) {
			console.log("Too many rooms!");
			return; //abort
		}
		var width = 10;
		var height = 10;
		var x;
		var y;
		switch (direction) {
			case Dir.UP:
				x = startRoom.pos.x;
				y = startRoom.pos.y - height;
			break;
			case Dir.DOWN: 
				x = startRoom.pos.x;
				y = startRoom.pos.y + startRoom.size.y;
			break;
			case Dir.LEFT: 
				x = startRoom.pos.x - width;
				y = startRoom.pos.y;
			break;
			case Dir.RIGHT: 
				x = startRoom.pos.x + startRoom.size.x;
				y = startRoom.pos.y;
			break;
		}
		if (x < 0 || y < 0 || x > worldWidth || y > worldWidth) return;
		if (closedRooms.some(function (room) {
			return (room.pos.x < x + width && room.pos.x + room.size.x > x
				&& room.pos.y < y + height  && room.pos.y + room.size.y > y);
		})) return; //we overlap with another room
		var newRoom = new Room(x, y, width, height);
		openRooms.push(newRoom);
	}

	this.generate = function (worldWidth, worldHeight) {
		var openRooms = [];
		var closedRooms = [];
		var firstRoom = new Room(Math.floor(worldWidth / 2)-5, Math.floor(worldHeight / 2)-5, 10, 10);
		openRooms.push(firstRoom);

		while (openRooms.length > 0) {
			var room = openRooms.pop();
			closedRooms.push(room);
			addRoom(room, Dir.UP, openRooms, closedRooms, worldWidth, worldHeight);
			addRoom(room, Dir.DOWN, openRooms, closedRooms, worldWidth, worldHeight);
			addRoom(room, Dir.LEFT, openRooms, closedRooms, worldWidth, worldHeight);
			addRoom(room, Dir.RIGHT, openRooms, closedRooms, worldWidth, worldHeight);
		}
		console.log("Room count: " + closedRooms.length);
		return closedRooms;
	}
}