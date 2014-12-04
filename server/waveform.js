
var Waveform = function() { };

Waveform.prototype = {

	setData: function( data ) {	
		this.data = data;
	},

	setDataFromArray: function( a, index ) {
		var a2 = [];
		for( var i = 0, l = a.length; i < l ; i ++ ) {
			a2.push( a[ i ][ index ] );
		}

		this.data = a2;
	},

	setXUnit: function( xUnit ) {
		this.xUnit = xUnit;
	},

	setYUnit: function( yUnit ) {
		this.yUnit = yUnit;
	},

	setXScalingDelta: function( x0, xDelta ) {
		this.xScaling = {
			mode: 'delta',
			x0: x0,
			xDelta: xDelta
		};
	},

	hasXScaling: function() {
		return ! ! this.xScaling;
	},

	hasXUnit: function() {
		return ! ! this.xUnit;
	},

	hasYUnit: function() {
		return ! ! this.yUnit;
	},

	getXUnit: function() {
		return this.xUnit;
	},

	getYUnit: function() {
		return this.yUnit;
	},

	getXScaling: function() {
		return this.xScaling;
	},

	getXScalingMode: function() {
		return this.xScaling ? this.xScaling.mode : false
	},

	getData: function() {
		return this.data;
	}
}

module.exports = Waveform;