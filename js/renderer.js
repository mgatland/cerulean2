var Renderer = function (gameWindow, gameConsts, shaders) {
	var canvas;
	var ctx;
	var flicker = false;
	var flickerCounter = 0;

	var black = {r: 0, g:0, b:0}
	var red = {r: 1, b:0.06, g:0.06};
	var green = {r:0.365, g:0.882, b:0};

	container = document.getElementById('gamecontainer');
	container.style.width = gameWindow.width;
	container.style.height = gameWindow.height;

	canvas = document.getElementById('gamescreen');
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

	ctx = canvas.getContext("2d");

	var hudOverlay = new HudOverlay("hudoverlay", gameWindow);

	this.fillRect = function (x, y, width, height, camera) {
		ctx.fillRect(x-camera.pos.x, y-camera.pos.y, width, height);
	}

	function drawScene() {
	  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	  perspectiveMatrix = makePerspective(45, canvas.width/canvas.height, 0.1, 100.0);

	  loadIdentity();
	  mvTranslate([-0.0, 0.0, -6.0]);

	  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesBuffer);
	  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	  gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
  	  gl.vertexAttribPointer(vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);

  	  setMatrixUniforms();
	  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
	}

	function loadIdentity() {
	  mvMatrix = Matrix.I(4);
	}

	function multMatrix(m) {
	  mvMatrix = mvMatrix.x(m);
	}

	function mvTranslate(v) {
	  multMatrix(Matrix.Translation($V([v[0], v[1], v[2]])).ensure4x4());
	}

	function setMatrixUniforms() {
	  var pUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
	  gl.uniformMatrix4fv(pUniform, false, new Float32Array(perspectiveMatrix.flatten()));

	  var mvUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
	  gl.uniformMatrix4fv(mvUniform, false, new Float32Array(mvMatrix.flatten()));
	}

	//
	// gluPerspective
	//
	function makePerspective(fovy, aspect, znear, zfar)
	{
	    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
	    var ymin = -ymax;
	    var xmin = ymin * aspect;
	    var xmax = ymax * aspect;

	    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
	}

	//
	// glFrustum
	//
	function makeFrustum(left, right,
	                     bottom, top,
	                     znear, zfar)
	{
	    var X = 2*znear/(right-left);
	    var Y = 2*znear/(top-bottom);
	    var A = (right+left)/(right-left);
	    var B = (top+bottom)/(top-bottom);
	    var C = -(zfar+znear)/(zfar-znear);
	    var D = -2*zfar*znear/(zfar-znear);

	    return $M([[X, 0, A, 0],
	               [0, Y, B, 0],
	               [0, 0, C, D],
	               [0, 0, -1, 0]]);
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

	//p means 'in pixels'
	function addRectWithCamera(vertices, colors, pX, pY, pWidth, pHeight, color, camera) {
		addRect(vertices, colors, pX-camera.pos.x, pY-camera.pos.y, pWidth, pHeight, color);
	}

	//p means 'in pixels'
	function addRect(vertices, colors, pX, pY, pWidth, pHeight, color) {

	  // Draw rectangles as two triangles:
	  // 2--1       5\ (repeat of 2)
	  //  \ |       | \
	  //   \3       6--4 (repeat of 3)

	  var glScreenWidth = 6.633;
	  var glScreenHeight = 4.975;

	  var x = pX / gameWindow.width * glScreenWidth - glScreenWidth/2;
	  var y = pY / gameWindow.height * glScreenHeight - glScreenHeight/2;
	  var width = pWidth / gameWindow.width * glScreenWidth;
	  var height = pHeight / gameWindow.height * glScreenHeight;

	  //invert y
	  y = -y - height;

	  //top triangle
	  vertices.push(
	  	x+width, y+height, 0,
	  	x, y+height, 0,
	  	x+width, y, 0);
	  //bottom triangle
	  vertices.push(
	  	x+width, y, 0,
	  	x, y+height, 0,
	  	x, y, 0);

	  for (var i = 0; i < 6; i++) {
	  	colors.push(color.r, color.g, color.b, 1);
	  }
	}

	var frameValue = 0;

	this.draw = function (player, companion, rooms, camera, fps) {

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

			room.enemies.forEach(function (enemy) {
				var color = null;
				if (enemy.targetted && flicker) {
					color = green;
				} else {
					color = red;
				}
				addRect(vertices, colors, enemy.pos.x-camera.pos.x, enemy.pos.y-camera.pos.y,
					enemy.size.x, enemy.size.y, color);
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
		var playerColor = null;
		if (player.invlunerableTime > 0 && flicker) {
			playerColor = black;
		} else {
			playerColor = green;
		}
		addRectWithCamera(vertices, colors, player.pos.x, player.pos.y, player.size.x, player.size.y, playerColor, camera);

		if (companion) {
			var playerColor = null;
			if (companion.invlunerableTime > 0 && flicker) {
				playerColor = black;
			} else {
				playerColor = green;
			}
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

		//attack charge:
		var width = Math.floor(gameWindow.width * player.attackCharge / player.maxAttackCharge);
		addRect(vertices, colors, 0, gameWindow.height - 32, width, 32, green);

		//end of drawing objects code.

		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		squareVerticesColorBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, squareVerticesColorBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

		vertexCount = vertices.length / 3;

		gl.uniform1f(frameValueLocation, frameValue);

		//end of 'initbuffers'

		drawScene();
		return;
	}
}

// augment Sylvester some
Matrix.Translation = function (v)
{
  if (v.elements.length == 2) {
    var r = Matrix.I(3);
    r.elements[2][0] = v.elements[0];
    r.elements[2][1] = v.elements[1];
    return r;
  }

  if (v.elements.length == 3) {
    var r = Matrix.I(4);
    r.elements[0][3] = v.elements[0];
    r.elements[1][3] = v.elements[1];
    r.elements[2][3] = v.elements[2];
    return r;
  }

  throw "Invalid length for Translation";
}

Matrix.prototype.flatten = function ()
{
    var result = [];
    if (this.elements.length == 0)
        return [];


    for (var j = 0; j < this.elements[0].length; j++)
        for (var i = 0; i < this.elements.length; i++)
            result.push(this.elements[i][j]);
    return result;
}

Matrix.prototype.ensure4x4 = function()
{
    if (this.elements.length == 4 &&
        this.elements[0].length == 4)
        return this;

    if (this.elements.length > 4 ||
        this.elements[0].length > 4)
        return null;

    for (var i = 0; i < this.elements.length; i++) {
        for (var j = this.elements[i].length; j < 4; j++) {
            if (i == j)
                this.elements[i].push(1);
            else
                this.elements[i].push(0);
        }
    }

    for (var i = this.elements.length; i < 4; i++) {
        if (i == 0)
            this.elements.push([1, 0, 0, 0]);
        else if (i == 1)
            this.elements.push([0, 1, 0, 0]);
        else if (i == 2)
            this.elements.push([0, 0, 1, 0]);
        else if (i == 3)
            this.elements.push([0, 0, 0, 1]);
    }

    return this;
};

Matrix.prototype.make3x3 = function()
{
    if (this.elements.length != 4 ||
        this.elements[0].length != 4)
        return null;

    return Matrix.create([[this.elements[0][0], this.elements[0][1], this.elements[0][2]],
                          [this.elements[1][0], this.elements[1][1], this.elements[1][2]],
                          [this.elements[2][0], this.elements[2][1], this.elements[2][2]]]);
};

Vector.prototype.flatten = function ()
{
    return this.elements;
};

function mht(m) {
    var s = "";
    if (m.length == 16) {
        for (var i = 0; i < 4; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*4+0].toFixed(4) + "," + m[i*4+1].toFixed(4) + "," + m[i*4+2].toFixed(4) + "," + m[i*4+3].toFixed(4) + "]</span><br>";
        }
    } else if (m.length == 9) {
        for (var i = 0; i < 3; i++) {
            s += "<span style='font-family: monospace'>[" + m[i*3+0].toFixed(4) + "," + m[i*3+1].toFixed(4) + "," + m[i*3+2].toFixed(4) + "]</font><br>";
        }
    } else {
        return m.toString();
    }
    return s;
}

//
// gluLookAt
//
function makeLookAt(ex, ey, ez,
                    cx, cy, cz,
                    ux, uy, uz)
{
    var eye = $V([ex, ey, ez]);
    var center = $V([cx, cy, cz]);
    var up = $V([ux, uy, uz]);

    var mag;

    var z = eye.subtract(center).toUnitVector();
    var x = up.cross(z).toUnitVector();
    var y = z.cross(x).toUnitVector();

    var m = $M([[x.e(1), x.e(2), x.e(3), 0],
                [y.e(1), y.e(2), y.e(3), 0],
                [z.e(1), z.e(2), z.e(3), 0],
                [0, 0, 0, 1]]);

    var t = $M([[1, 0, 0, -ex],
                [0, 1, 0, -ey],
                [0, 0, 1, -ez],
                [0, 0, 0, 1]]);
    return m.x(t);
}

//
// glOrtho
//
function makeOrtho(left, right,
                   bottom, top,
                   znear, zfar)
{
    var tx = -(right+left)/(right-left);
    var ty = -(top+bottom)/(top-bottom);
    var tz = -(zfar+znear)/(zfar-znear);

    return $M([[2/(right-left), 0, 0, tx],
               [0, 2/(top-bottom), 0, ty],
               [0, 0, -2/(zfar-znear), tz],
               [0, 0, 0, 1]]);
}

//
// gluPerspective
//
function makePerspective(fovy, aspect, znear, zfar)
{
    var ymax = znear * Math.tan(fovy * Math.PI / 360.0);
    var ymin = -ymax;
    var xmin = ymin * aspect;
    var xmax = ymax * aspect;

    return makeFrustum(xmin, xmax, ymin, ymax, znear, zfar);
}

//
// glFrustum
//
function makeFrustum(left, right,
                     bottom, top,
                     znear, zfar)
{
    var X = 2*znear/(right-left);
    var Y = 2*znear/(top-bottom);
    var A = (right+left)/(right-left);
    var B = (top+bottom)/(top-bottom);
    var C = -(zfar+znear)/(zfar-znear);
    var D = -2*zfar*znear/(zfar-znear);

    return $M([[X, 0, A, 0],
               [0, Y, B, 0],
               [0, 0, C, D],
               [0, 0, -1, 0]]);
}

//
// glOrtho
//
function makeOrtho(left, right, bottom, top, znear, zfar)
{
    var tx = - (right + left) / (right - left);
    var ty = - (top + bottom) / (top - bottom);
    var tz = - (zfar + znear) / (zfar - znear);

    return $M([[2 / (right - left), 0, 0, tx],
           [0, 2 / (top - bottom), 0, ty],
           [0, 0, -2 / (zfar - znear), tz],
           [0, 0, 0, 1]]);
}

