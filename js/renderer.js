var Renderer = function (gameWindow, gameConsts, shaders) {
	var flicker = false;
	var flickerCounter = 0;

	var black = {r: 0, g:0, b:0}
	var red = {r: 1, b:0.06, g:0.06};
	var green = {r:0.365, g:0.882, b:0};

	container = document.getElementById('gamecontainer');
	container.style.width = gameWindow.width;
	container.style.height = gameWindow.height;

	var canvas = document.getElementById('gamescreen');
	canvas.width = gameWindow.width;
	canvas.height = gameWindow.height;
	var gl = initWebGL(canvas);

	var squareVerticesBuffer;
	var vertexPositionAttribute;
	var shaderProgram;
	var squareVerticesColorBuffer;
	var vertexColorAttribute;
	var vertexCount = 0;
	var frameValueLocation; //used to give the shader the frame counter

	initShaders(shaders);
	//initBuffers(); now called every frame

	var hudOverlay = new HudOverlay("hudoverlay", gameWindow, gameConsts);
	this.overlay = hudOverlay; //hack to expose this so it can be used by Message

	function drawScene() {
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
	  gl.vertexAttribPointer(vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

	  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
  	  gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

	  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
	}

	function initWebGL(canvas) {
	  // Initialize the global variable gl to null.
	  var gl = null;

	  try {
	    // Try to grab the standard context. If it fails, fallback to experimental.
	    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
	  }
	  catch(e) {
	  	console.log(e.message);
	  }

	  // If we don't have a GL context, give up now
	  if (!gl) {
	    alert("Unable to initialize WebGL. Your browser may not support it.");
	  }
	  return gl;
	}

	function initShaders(shaders) {
	  var fragmentShader = getShader(gl, shaders[0], "fragment");
	  var vertexShader = getShader(gl, shaders[1], "vertex");

	  // Create the shader program

	  shaderProgram = gl.createProgram();
	  gl.attachShader(shaderProgram, vertexShader);
	  gl.attachShader(shaderProgram, fragmentShader);
	  gl.linkProgram(shaderProgram);

	  // If creating the shader program failed, alert

	  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
	    alert("Unable to initialize the shader program.");
	  }

	  gl.useProgram(shaderProgram);

	  frameValueLocation = gl.getUniformLocation(shaderProgram, "frameValue");

	  vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
	  gl.enableVertexAttribArray(vertexPositionAttribute);
	  vertexColorAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
	  gl.enableVertexAttribArray(vertexColorAttribute);
	}

	function getShader(gl, theSource, type) {
	  var theSource, shader;

	if (type == "fragment") {
	    shader = gl.createShader(gl.FRAGMENT_SHADER);
	  } else if (type == "vertex") {
	    shader = gl.createShader(gl.VERTEX_SHADER);
	  } else {
	     // Unknown shader type
	     return null;
	  }

	gl.shaderSource(shader, theSource);

	  // Compile the shader program
	  gl.compileShader(shader);

	  // See if it compiled successfully
	  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
	      alert("An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader));
	      return null;
	  }

	  return shader;
	}

	function addParticles() {

	}

	//p means 'in pixels'
	function addRectWithCamera(vertices, colors, pX, pY, pWidth, pHeight, color, camera) {
		addRect(vertices, colors, pX-camera.pos.x, pY-camera.pos.y, pWidth, pHeight, color);
	}

	function addQuad(vertices, colors, pX, pY, pX2, pY2, color) {
	  // Draw rectangles as two triangles:
	  // 2--1       5\ (repeat of 2)
	  //  \ |       | \
	  //   \3       6--4 (repeat of 3)

	  //invert Y
	  pY = gameWindow.height - pY;
	  pY2 = gameWindow.height - pY2; 

	  //convert to screen coords
	  var x = pX / gameWindow.width * 2 - 1;
	  var y = pY / gameWindow.height * 2 - 1;

	  var x2 = pX2 / gameWindow.width * 2 - 1;
	  var y2 = pY2 / gameWindow.height * 2 - 1;

	  //top triangle
	  vertices.push(
	  	x2, y2,
	  	x, y2,
	  	x2, y);
	  //bottom triangle
	  vertices.push(
	  	x2, y,
	  	x, y2,
	  	x, y);

	  for (var i = 0; i < 6; i++) {
	  	colors.push(color.r, color.g, color.b, 1);
	  }
	}

	//p means 'in pixels'
	function addRect(vertices, colors, pX, pY, pWidth, pHeight, color) {
		addQuad(vertices, colors, pX, pY, pX+pWidth, pY+pHeight, color);
	}

	var frameValue = 0;

	var wandCounter = 0;
	var wandOffset = 0;

	this.draw = function (player, companion, rooms, camera, fps) {

		hudOverlay.clear();

		if(player.story.mode != "intro") {
			hudOverlay.drawHud(player.items, player.roomsExplored, rooms.length, fps);
		}

		flickerCounter ++;
		if (flickerCounter == 4) flickerCounter = 0;
		flicker = (flickerCounter <= 1);

		frameValue++;
		if (frameValue > 100) frameValue = 0;

		squareVerticesBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);

		var vertices = [];
		var colors = [];

		//Draw a big black rectangle over the background, so that the noise shader is applied
		addRect(vertices, colors, 0, 0, gameWindow.width, gameWindow.height, black);

		//Red lines in background
		var lineColor = (player.story.mode=="intro") ? green : red;
		for (var y = 0; y < gameWindow.height + gameConsts.tileSize*2; y+= gameConsts.tileSize*2) {
			var y2 = (player.story.shaking==true) ? y + Math.random() * gameConsts.tileSize*2 : y;
			addRect(vertices, colors, 0, y2 - camera.pos.y % (gameConsts.tileSize*2), gameWindow.width, 1, lineColor);
		}

		rooms.forEach(function (room) {

			if (!room.explored) return;
			if ((room.pos.x + room.size.x) * gameConsts.tileSize < camera.pos.x) return;
			if ((room.pos.y + room.size.y) * gameConsts.tileSize < camera.pos.y) return;
			if (room.pos.x * gameConsts.tileSize > camera.pos.x + gameWindow.width) return;
			if (room.pos.y * gameConsts.tileSize > camera.pos.y + gameWindow.height) return;

			var messageWaiting = (room === player.room && player.messageWaiting);
			hudOverlay.drawMessages(room, camera, messageWaiting);

			var pX = (room.pos.x * gameConsts.tileSize - camera.pos.x);
			var pY =  (room.pos.y * gameConsts.tileSize - camera.pos.y);
			var pWidth = room.size.x * gameConsts.tileSize;
			var pHeight = room.size.y * gameConsts.tileSize;

			addRect(vertices, colors, pX, pY, pWidth, pHeight, green);
			var wallWidth = gameConsts.wallWidth;
			addRect(vertices, colors, pX+wallWidth, pY+wallWidth, pWidth-wallWidth*2, pHeight-wallWidth*2, black);

			room.doors.forEach(function (door) {
				addRect(vertices, colors, door.pos.x*gameConsts.tileSize-camera.pos.x, door.pos.y*gameConsts.tileSize-camera.pos.y,
					gameConsts.tileSize, gameConsts.tileSize, black);
			});

			if (room.flashing) {
				for (var y = room.pos.y*gameConsts.tileSize; y < (room.pos.y + room.size.y)*gameConsts.tileSize; y+= 16) {
					var lineStart = (Math.random() * room.size.x * gameConsts.tileSize);
					var lineWidth = Math.random() * (room.size.x * gameConsts.tileSize - lineStart);
					addRectWithCamera(vertices, colors, room.pos.x * gameConsts.tileSize + lineStart, y, lineWidth, 1, green, camera);
				}
			}

			if (room != player.room && room != player.lastRoom) return;

			room.items.forEach(function (item) {
				if (item.special) {
					addRectWithCamera(vertices, colors, item.pos.x-16, item.pos.y-16, 32, 32, red, camera);
					addRectWithCamera(vertices, colors, item.pos.x-15, item.pos.y-15, 30, 30, green, camera);
					addRectWithCamera(vertices, colors, item.pos.x-14, item.pos.y-14, 28, 28, black, camera);
				} else {
					addRectWithCamera(vertices, colors, item.pos.x-2, item.pos.y-2, 4, 4, green, camera);
				}
			});

			//Draw companion attack effects in the correct room
			if (companion && companion.room == room) {
				var wandColor = green;
				//Draw attack beam
				if (companion.stunTarget && companion.stunTarget.live) {
					var pos = companion.getCenter();
					var end = companion.stunTarget.getCenter();
					var angle = pos.angleTo(end);
					var distanceToEnd = pos.distanceTo(end);
					var stepDist = 7;

					wandOffset++;
					if (wandOffset == 7) wandOffset = 0;

					pos.moveAtAngle(angle, wandOffset);
					for (var i = 0; i < distanceToEnd; i+= stepDist) {
						addRectWithCamera(vertices, colors, pos.x-2, pos.y-2, 4, 4, wandColor, camera);
						addRectWithCamera(vertices, colors, pos.x-1, pos.y-1, 2, 2, black, camera);
						pos.moveAtAngle(angle, stepDist);
					}
				} else {
					//Draw wand
					if (companion.wandTarget) {
						var pos = companion.getCenter();
						var end = companion.wandTarget.pos;
						var angle = pos.angleTo(end);
						wandCounter++;
						if (wandCounter >= 2) {
							wandCounter = 0;
							wandOffset++;
							if (wandOffset == 7) wandOffset = 0;
						}
						pos.moveAtAngle(angle, wandOffset);
						for (var i = 0; i < 6; i++) {
							addRectWithCamera(vertices, colors, Math.floor(pos.x), Math.floor(pos.y), 2, 2, wandColor, camera);
							pos.moveAtAngle(angle, 7);
						}
						pos.moveAtAngle(angle, -2 - wandOffset);
						pos.floor();
						//big rectangle at the end
						addRectWithCamera(vertices, colors, pos.x-2, pos.y-2, 5, 5, wandColor, camera);
						addRectWithCamera(vertices, colors, pos.x-1, pos.y-1, 3, 3, black, camera);
					}
				}
			}

			room.enemies.forEach(function (enemy) {
				var color = null;
				if (enemy.targetted && flicker) {
					color = green;
				} else {
					color = red;
				}

				if (enemy.stunned) {
					addRectWithCamera(vertices, colors, enemy.pos.x-4, enemy.pos.y-4,
					enemy.size.x+8, enemy.size.y+8, green, camera);
					addRectWithCamera(vertices, colors, enemy.pos.x-3, enemy.pos.y-3,
					enemy.size.x+6, enemy.size.y+6, black, camera);
				}

				addRectWithCamera(vertices, colors, enemy.pos.x, enemy.pos.y,
					enemy.size.x, enemy.size.y, color, camera);
			});

			room.shots.forEach(function (shot) {
				var color = null;
				if (shot.targetted && flicker) {
					color = green;
				} else {
					color = red;
				}
				addRectWithCamera(vertices, colors, shot.pos.x-5, shot.pos.y-5, 10, 10, color, camera);
			});

		});

		//draw player
		var playerColor = (player.invlunerableTime > 0 && flicker) ? black : green;
		addRectWithCamera(vertices, colors, player.pos.x, player.pos.y, player.size.x, player.size.y, playerColor, camera);

		//Draw companion
		if (companion) {
			var playerColor = (companion.invlunerableTime > 0 && flicker) ? black : green;
			addRectWithCamera(vertices, colors, companion.pos.x, companion.pos.y, companion.size.x, companion.size.y, playerColor, camera);
		}

		var insetX = player.pos.x + 2;
		var insetY = player.pos.y + 2;
		var insetSizeX = player.size.x - 4;
		var insetSizeY = player.size.y - 4;
		if (player.health < 5) addRectWithCamera(vertices, colors, insetX, insetY, insetSizeX/2, insetSizeY/2, black, camera);
		if (player.health < 4) addRectWithCamera(vertices, colors, insetX+insetSizeX/2, insetY+insetSizeY/2, insetSizeX/2, insetSizeY/2, black, camera);
		if (player.health < 3) addRectWithCamera(vertices, colors, insetX+insetSizeX/2, insetY, insetSizeX/2, insetSizeY/2, black, camera);
		if (player.health < 2) addRectWithCamera(vertices, colors, insetX, insetY+insetSizeY/2, insetSizeX/2, insetSizeY/2, black, camera);

		//attack charge particles
		addParticles(vertices, colors);

		//attack charge bar:
		var width = Math.floor(gameWindow.width * player.attackCharge / player.maxAttackCharge);
		addRect(vertices, colors, 0, gameWindow.height - 32, width, 32, green);

		//end of drawing objects code.

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		squareVerticesColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

		vertexCount = vertices.length / 2;

		gl.uniform1f(frameValueLocation, frameValue);

		//end of 'initbuffers'

		drawScene();
		return;
	}
}
