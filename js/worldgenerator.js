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
		room.addDoor(x, y);
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
		newRoom.addDoor(x, y);
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
		var width = rand(3, 11);
		var height = rand(3, 11);
		if (width == 3) height = Math.max(5, height); //passageways should be long
		if (height == 3) width = Math.max(5, width);
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

		if (closedRooms.some(function (room) {
			return roomCollidesWith(room, x, y, width, height);
		})) return;
		if (openRooms.some(function (room) {
			return roomCollidesWith(room, x, y, width, height);
		})) return;

		var newRoom = new Room(x, y, width, height);
		addDoorsBetween(startRoom, newRoom, direction);
		openRooms.push(newRoom);
	}

	this.generate = function (worldWidth, worldHeight) {
		var openRooms = [];
		var closedRooms = [];
		var firstRoom = new Room(Math.floor(worldWidth / 2)-5, Math.floor(worldHeight / 2)-5, 11, 11);
		openRooms.push(firstRoom);

		while (openRooms.length > 0) {
			var room = (Math.random() > 0.5) ? openRooms.shift() : openRooms.pop();
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