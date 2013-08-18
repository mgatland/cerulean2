var Renderer = function (gameWindow, gameConsts) {
	var canvas;
	var ctx;
	var flicker = false;
	var flickerCounter = 0;
	var blackColor = "#000000";

	container = document.getElementById('gamecontainer');
	container.style.width = gameWindow.width;
	container.style.height = gameWindow.height;

	canvas = document.getElementById('gamescreen');
	ctx = canvas.getContext("2d");
	canvas.width = gameWindow.width;
	canvas.height = gameWindow.height;

	var overlay = new Overlay("overlay", gameWindow);

	this.fillRect = function (x, y, width, height, camera) {
		ctx.fillRect(x-camera.pos.x, y-camera.pos.y, width, height);
	}

	this.draw = function (player, rooms, camera, roomsExplored, currentFps) {
		overlay.draw();
		flickerCounter ++;
		if (flickerCounter == 4) flickerCounter = 0;
		flicker = (flickerCounter <= 1);
		ctx.fillStyle = blackColor;
		ctx.fillRect(0,0, gameWindow.width, gameWindow.height);
		ctx.fillStyle = "#ff0f0f";
		for (var y = 0; y < gameWindow.height + gameConsts.tileSize*2; y+= gameConsts.tileSize*2) {
			ctx.fillRect(0, y - camera.pos.y % (gameConsts.tileSize*2), gameWindow.width, 1);
		}

		var wallWidth = gameConsts.wallWidth;

		var renderer = this;
		rooms.forEach(function (room) {
			if (!room.explored) return;
			if ((room.pos.x + room.size.x) * gameConsts.tileSize < camera.pos.x) return;
			if ((room.pos.y + room.size.y) * gameConsts.tileSize < camera.pos.y) return;

			if (room.pos.x * gameConsts.tileSize > camera.pos.x + gameWindow.width) return;
			if (room.pos.y * gameConsts.tileSize > camera.pos.y + gameWindow.height) return;

			ctx.fillStyle = "#5DE100";
			ctx.fillRect(room.pos.x*gameConsts.tileSize-camera.pos.x, room.pos.y*gameConsts.tileSize-camera.pos.y,
				room.size.x*gameConsts.tileSize, room.size.y*gameConsts.tileSize);


			ctx.fillStyle = blackColor;
			ctx.fillRect((room.pos.x)*gameConsts.tileSize+wallWidth-camera.pos.x, (room.pos.y)*gameConsts.tileSize+wallWidth-camera.pos.y,
				(room.size.x)*gameConsts.tileSize-wallWidth*2, (room.size.y)*gameConsts.tileSize-wallWidth*2);

			ctx.fillStyle = blackColor;
			room.doors.forEach(function (door) {
				ctx.fillRect(door.pos.x*gameConsts.tileSize-camera.pos.x, door.pos.y*gameConsts.tileSize-camera.pos.y,
					gameConsts.tileSize, gameConsts.tileSize);
			});

			if (room.flashing) {
				ctx.fillStyle = "#5DE100";
				for (var y = room.pos.y*gameConsts.tileSize; y < (room.pos.y + room.size.y)*gameConsts.tileSize; y+= 16) {
					var lineStart = (Math.random() * room.size.x * gameConsts.tileSize);
					var lineWidth = Math.random() * (room.size.x * gameConsts.tileSize - lineStart);
					renderer.fillRect(room.pos.x * gameConsts.tileSize + lineStart, y, lineWidth, 1, camera);
				}
			}

			if (room != player.room && room != player.lastRoom) return;

			room.items.forEach(function (item) {
				ctx.fillStyle = "#5DE100";
				renderer.fillRect(item.pos.x-2, item.pos.y-2, 4, 4, camera);
			});

			room.enemies.forEach(function (enemy) {
				if (enemy.targetted && flicker) {
					ctx.fillStyle = "#00ff00";
				} else {
					ctx.fillStyle = "#ff0f0f";
				}
				ctx.fillRect(enemy.pos.x-camera.pos.x, enemy.pos.y-camera.pos.y,
					enemy.size.x, enemy.size.y);
			});

			room.shots.forEach(function (shot) {
				if (shot.targetted && flicker) {
					ctx.fillStyle = "#00ff00";
				} else {
					ctx.fillStyle = "#ff0f0f";
				}
				renderer.fillRect(shot.pos.x-5, shot.pos.y-5, 10, 10, camera);
			});

		});

		//drawplayer
		if (player.invlunerableTime > 0 && flicker) {
			ctx.fillStyle = blackColor;
		} else {
			ctx.fillStyle = "#5DE100";
		}
		this.fillRect(player.pos.x, player.pos.y, player.size.x, player.size.y, camera);
		ctx.fillStyle = blackColor;
		var insetX = player.pos.x + 2;
		var insetY = player.pos.y + 2;
		var insetSizeX = player.size.x - 4;
		var insetSizeY = player.size.y - 4;
		if (player.health < 5) this.fillRect(insetX, insetY, insetSizeX/2, insetSizeY/2, camera);
		if (player.health < 4) this.fillRect(insetX+insetSizeX/2, insetY+insetSizeY/2, insetSizeX/2, insetSizeY/2, camera);
		if (player.health < 3) this.fillRect(insetX+insetSizeX/2, insetY, insetSizeX/2, insetSizeY/2, camera);
		if (player.health < 2) this.fillRect(insetX, insetY+insetSizeY/2, insetSizeX/2, insetSizeY/2, camera);

		//draw attack attackCharge

		ctx.fillStyle = "#5DE100";
		var width = Math.floor(gameWindow.width * player.attackCharge / player.maxAttackCharge);
		ctx.fillRect(0, gameWindow.height - 32, width, 32);

		ctx.fillStyle = "#5DE100";
		ctx.font = '32px "Courier New", Courier, "Lucida Sans Typewriter", "Lucida Typewriter", monospace';
		//ctx.font = '32px "Lucida Sans Typewriter", "Lucida Console", Monaco, "Bitstream Vera Sans Mono", monospace';
		ctx.fillText("BITSCORE: " + player.items, 40, gameWindow.height - 64);
		ctx.fillText("ROOMS EXPLORED: " + roomsExplored + " OF " + rooms.length, 350, gameWindow.height - 64);
		ctx.fillText("FPS: " + currentFps, 850, gameWindow.height - 64);
	}
}