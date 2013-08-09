var Pos = function (x, y) {
	this.x = x;
	this.y = y;

	this.toString = function () {
		return "(" + this.x + "," + this.y + ")";
	}

	this.distanceTo = function (other) {
		return (Math.abs(this.x - other.x) + Math.abs(this.y - other.y));
	}
}