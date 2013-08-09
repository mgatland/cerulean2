var Pos = function (x, y) {
	this.x = x;
	this.y = y;

	this.toString = function () {
		return "(" + this.x + "," + this.y + ")";
	}

	this.distanceTo = function (other) {
		return (Math.abs(this.x - other.x) + Math.abs(this.y - other.y));
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