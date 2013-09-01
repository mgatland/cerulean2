var Dir = {};
Dir.UP = {isHorizontal: false};
Dir.DOWN = {isHorizontal: false};
Dir.LEFT = {isHorizontal: true};
Dir.RIGHT = {isHorizontal: true};

Dir.UP.reverse = Dir.DOWN;
Dir.DOWN.reverse = Dir.UP;
Dir.LEFT.reverse = Dir.RIGHT;
Dir.RIGHT.reverse = Dir.LEFT;

var Pos = function (x, y) {
	this.x = x;
	this.y = y;

	this.toString = function () {
		return "(" + this.x + "," + this.y + ")";
	}

	this.moveInDir = function (dir, distance) {
		switch (dir) {
			case Dir.UP: this.y -= distance; break;
			case Dir.DOWN: this.y += distance; break;
			case Dir.LEFT: this.x -= distance; break;
			case Dir.RIGHT: this.x += distance; break;
		}
        return this; //For chaining - this method does NOT clone
	}

	this.distanceTo = function (other) {
		var xDiff = this.x - other.x;
		var yDiff = this.y - other.y;
		return Math.floor(Math.sqrt(xDiff * xDiff + yDiff * yDiff));
	}

	this.clone = function () {
		return new Pos(this.x, this.y);
	}

	this.multiply = function (value) {
		return new Pos(this.x*value, this.y*value);
	}

	this.angleTo = function (other) {
		var angle = (Math.atan2(other.y - this.y, other.x - this.x) * 180 / Math.PI);
		angle += 90;
		return angle;
	}

    this.moveAtAngle = function (angle, speed) {
        var xSpeed = (speed * Math.sin(3.14159 / 180.0 * angle));
        var ySpeed = (speed * -Math.cos(3.14159 / 180 * angle));
        this.x += xSpeed;
        this.y += ySpeed;
    }

    this.floor = function () {
        this.x = Math.floor(this.x);
        this.y = Math.floor(this.y);
        return this; //For chaining - this does not clone!
    }

    this.moveXY = function (x, y) {
        this.x += x;
        this.y += y;
    }
}

var track = function (action, label, number) {
	console.log("_trackEvent: " + action + ", " + label + ", " + number);
	try {
		_gaq.push(['_trackEvent',"cerulean", action, ""+label, number]);;
	} catch (e) {

	}
}

//From David Roe on StackOverflow http://stackoverflow.com/questions/4878145/javascript-and-webgl-external-scripts
function loadFile(url, data, callback, errorCallback) {
    // Set up an asynchronous request
    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    // Hook the event that gets called as the request progresses
    request.onreadystatechange = function () {
        // If the request is "DONE" (completed or failed)
        if (request.readyState == 4) {
            // If we got HTTP status 200 (OK)
            if (request.status == 200) {
                callback(request.responseText, data)
            } else { // Failed
                errorCallback(url);
            }
        }
    };

    request.send(null);
}

function loadFiles(urls, callback, errorCallback) {
    var startTime = Date.now();
    console.log("Loading files...");
    var numUrls = urls.length;
    var numComplete = 0;
    var result = [];

    // Callback for a single file
    function partialCallback(text, urlIndex) {
        result[urlIndex] = text;
        numComplete++;

        // When all files have downloaded
        if (numComplete == numUrls) {
            console.log(numUrls + " files loaded in " + (Date.now() - startTime) + " ms.");
            callback(result);
        }
    }

    for (var i = 0; i < numUrls; i++) {
        loadFile(urls[i], i, partialCallback, errorCallback);
    }
}

function extend(destination, source) {
  for (var k in source) {
    if (source.hasOwnProperty(k)) {
      destination[k] = source[k];
    }
  }
  return destination;
}