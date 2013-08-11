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
	}

	this.distanceTo = function (other) {
		var xDiff = this.x - other.x;
		var yDiff = this.y - other.y;
		return Math.floor(Math.sqrt(xDiff * xDiff + yDiff * yDiff));
	}

	this.clone = function () {
		return new Pos(this.x, this.y);
	}

	this.angleTo = function (other) {
		var angle = (Math.atan2(other.y - this.y, other.x - this.x) * 180 / Math.PI);
		angle += 90;
		return angle;
	}
}

var track = function (action, label, number) {
	console.log("_trackEvent: " + action + ", " + label + ", " + number);
	try {
		_gaq.push(['_trackEvent',"cerulean", action, ""+label, number]);;
	} catch (e) {

	}
}