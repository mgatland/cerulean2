var Pos = function (x, y) {
	this.x = x;
	this.y = y;

	this.toString = function () {
		return "(" + this.x + "," + this.y + ")";
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