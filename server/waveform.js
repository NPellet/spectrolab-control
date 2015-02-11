
var extend = require('extend');

var Waveform = function() {
	this.data = [];
};

Waveform.prototype = {

	setData: function( data ) {	
		
		this.data = data;
		this.length = this.data.length;

		this._checkScalingWave();
	},

	setDataFromArray: function( a, index, startAt ) {
		var a2 = [];
		startAt = startAt || 0;
		for( var i = startAt, l = a.length; i < l ; i ++ ) {
			a2.push( a[ i ][ index ] );
		}

		this.data = a2;
		this.length = this.data.length;

		this._checkScalingWave();
	},

	get: function( index ) {
		return this.data[ index ]; 
	},

	set: function( index, value ) {
		this.data[ index ] = value;
	},

	push: function( value ) {
		this.data.push( value );
	},

	setXUnit: function( xUnit ) {
		this.xUnit = xUnit;
	},

	setYUnit: function( yUnit ) {
		this.yUnit = yUnit;
	},

	setXScaling: function( x0, xDelta ) {
		this.xScaling = {
			mode: 'delta',
			x0: x0,
			xDelta: xDelta
		};
	},

	duplicate: function() {
		var w = new Waveform();
		w.setData(this.data.slice(0) );
		w.xScaling = extend({}, this.xScaling );
		w.yUnit = this.yUnit;
		w.xUnit = this.xUnit;
		return w;
	},

	setXWave: function( w ) {

		if( ! w instanceof Waveform ) {
			throw "X wave must be a waveform"
		}

		this.xScaling = {
			mode: 'wave',
			wave: w
		}
	},

	_checkScalingWave: function() {

		if( ! this.hasXScaling() || ! this.xScaling.mode == "wave" ) {
			return;
		}

		if( this.length != this.xScaling.wave.length ) {
			this.warn("Mismatch in x wave dimension.");
		}
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
	},

	getDataLength: function() {
		return this.data.length;
	},

	searchBinary: function( val, interpolate ) {

		var k1 = 0,
			k2 = this.data.length - 1,
			kint,
			asc = this.data[ k1 ] < val;

		if( this.hasXScaling() && this.xScaling.mode !== 'delta' ) {
			this.error("Cannot perform binary search on a non linearly increasing x axis");
		}

		// Problem, the two boundaries are on the same side.
		if( ( this.data[ k1 ] > val && this.data[ k2 ] > val ) || ( this.data[ k1 ] < val && this.data[ k2 ] < val ) ) {
			throw "Binary search cannot be performed as the needle is out of range."
			return false;
		}

		while( true ) {

			kint = Math.ceil( ( k2 - k1 ) / 2 );

			if( kint == k2 || kint == k1 && k2 - k1 > 1 ) {
				throw "Error in binary search";
			}

			// kint is the new k1
			if( ( this.data[ kint ] < val && asc ) || ( this.data[ kint ] > val && ! asc ) ) {
				k1 = kint
			} else {
				k2 = kint;
			}

			// Converged
			if( k2 - k1 == 1 ) {

				var d = val - this.data[ k2 ] / ( this.data[ k1 ] - this.data[ k2 ] );
				if( ! interpolate ) {
					
					if( d < 0.5 ) {
						return k1;
					} else {
						return k2;
					}
				} else {
					return k2 + ( d * ( k1 - k2 ) );
				}
			}
		}
	},



	getValueAt: function( p ) {

		if( this.data.length - 1 < p ) {
			throw "Cannot access index " + p + ". Index is out of range";
		}

		return this.data[ p ];
	},

	getIndexFromX: function( x ) {

		switch( this.getXScalingMode() ) {

			case 'delta':
				return Math.round( ( x - this.xScaling.x0 ) / ( this.xScaling.xDelta ) );
			break;

			case 'wave':
				return this.xScaling.wave.searchBinary( x );
			break;
		}
	},

	getXFromIndex: function( p ) {

		switch( this.getXScalingMode() ) {

			case 'delta':
				return ( p * this.xScaling.xDelta + this.xScaling.x0 );
			break;

			case 'wave':
				return this.xScaling.wave.getValueAt( p );
			break;
		}
	},

	getXDeltaBetween: function( p1, p2 ) {

		switch( this.getXScalingMode() ) {

			case 'delta':
				if( p1 >= 0 && p2 >= 0 && p1 < this.data.length && p2 < this.data.length ) {
					return this.getXFromIndex( p1 ) - this.getXFromIndex( p2 );
				}

				return false;
			break;


			case 'wave':
				
				return this.xScaling.getXFromIndex( p1 ) - this.xScaling.getXFromIndex( p2 );
			break;
		}	
	},

	getAverageP: function( from, to ) {

		var sum = this._integrateP( from, to );
		
		return sum[ 0 ] / sum[ 2 ];
	},

	getAverageX: function( from, to ) {

		var sum = this._integrateX( from, to );
		return sum[ 0 ] / sum[ 2 ];
	},

	subset: function( p0, p1 ) {
		var w = new Waveform();
		for( var i = p0; i <= p1; i+= 1 ) {
			w.push( this.data[ i ] );
		}
		return w;
	},

	average: function( p0, p1 ) {
		return this.getAverageP( p0, p1 );
	},

	mean: function() {
		return this.average( 0, this.data.length - 1 );
	},

	median: function() {
		var dupl = this.data.slice( 0 );
		dupl.sort();

		return dupl[ Math.ceil( dupl.length / 2 ) - 1 ];
	},

	stdDev: function() {
		var i = 0, l = this.data.length;
		var mean = this.mean();
		var sdev = 0;

		for( ; i < l ; i ++ ) {
			sdev += Math.pow( ( this.data[ i ] - mean ), 2 );
		}

		sdev /= l;

		return Math.pow( sdev, 0.5 );
	},

	subtract: function( val ) {

		if( typeof val == "function" ) {

			for( var i = 0; i < this.data.length; i ++ ) {

				this.data[ i ] -= val( this.getXFromIndex( i ), this.data[ i ] );
			}

		} else {

			for( var i = 0; i < this.data.length; i ++ ) {
				
				this.data[ i ] -= val;
			}
		}
	},

	_integrateX: function( xFrom, xTo ) {

		var from, to;

		if( from == undefined ) {
			from = 0;
		} else {
			from = this.getIndexFromX( xFrom );
		}
		
		if( to == undefined ) {
			to = this.data.length;
		} else {
			to = this.getIndexFromX( xTo );
		}

		return this._integrateP( from, to );
	},

	_integrateP: function( from, to ) {

		var l = to - from + 1;
		var sum = 0, delta;

		if( this.hasXScaling() ) {

			var deltaTot = this.getXDeltaBetween( to, from - 1 );
			// Temporary fix
			deltaTot = this.xScaling.xDelta * l;

			for( ; from <= to ; from ++ ) {

				delta = this.xScaling.xDelta;//this.getXDeltaBetween( from, from - 1 );

				if( delta !== false ) {
					sum += this.data[ from ] * delta;
				}
			}
		} else {

			var deltaTot = this.data.length;
			
			for( ; from <= to ; from ++ ) {
			
				sum += this.data[ from ];
			}
		
			
		}
		
		return [ sum, l, deltaTot ];
	},

	integrateX: function( from, to ) {
		var val = this._integrate( from, to );
		return val[ 0 ];
	},

	integrateP: function( from, to ) {
		var val = this._integrateP( from, to );
		return val[ 0 ];
	},

	integrateToWave: function() {
		
		var w = this.duplicate();

		var from = 0, to = this.data.length;

		for( ; from <= to ; from ++ ) {

			delta = this.getXDeltaBetween( from, from - 1 );

			if( delta !== false ) {
				sum += this.data[ from ] * delta;
				this.set( from, sum );
			} else {
				throw "Integration error"
			}
		}

		return w;
	},

	divideBy: function( val ) {

		if( typeof val == "function" ) {

			for( var i = 0; i < this.data.length; i ++ ) {

				this.data[ i ] /= val( this.getXFromIndex( i ), this.data[ i ] );

			}
		} else if( val instanceof Waveform ) {

			if( val.getDataLength() == this.getDataLength() ) {

				for( var i = 0; i < this.data.length; i ++ ) {
					this.data[ i ] /= val.get( i );
				}

			} else {
				throw "Cannot divide two waves with unequal number of points";
			}

		} else {

			for( var i = 0; i < this.data.length; i ++ ) {

				this.data[ i ] /= val;
			}
		}

		return this;
	},

	multiplyBy: function( val ) {


		if( typeof val == "function" ) {

			for( var i = 0; i < this.data.length; i ++ ) {

				this.data[ i ] *= val( this.getXFromIndex( i ), this.data[ i ] );

			}
		} else if( val instanceof Waveform ) {

			if( val.getDataLength() == this.getDataLength() ) {

				for( var i = 0; i < this.data.length; i ++ ) {
					this.data[ i ] *= val.get( i );
				}
				
			} else {
				throw "Cannot multiply two waves with unequal number of points";
			}

		} else {

			for( var i = 0; i < this.data.length; i ++ ) {

				this.data[ i ] *= val;
			}
		}

		return this;
	},


	divide: function() {
		return this.divideBy.apply( this, arguments )
	},

	multiply: function() {
		return this.multiplyBy.apply( this, arguments );
	},

	// Find the first level in the specified range
	findLevel: function( level, options ) {

		options = extend( {
			
			box: 1,
			edge: 'ascending',
			rounding: 'before',
			rangeP: [ 0, this.data.length ]

		}, options );

		if( options.rangeX ) {
			options.rangeP = options.rangeX.map( this.getIndexFromX );
		}

		var value,
			below;

		var box = options.box;

		if( box % 2 == 0 ) {
			box ++;
		}

		for( var i = options.rangeP[ 0 ]; i < options.rangeP[ 1 ]; i ++ ) {

			if( i < options.rangeP[ 0 ] + ( box - 1 ) / 2 ) {
				continue;
			}

			if( i > options.rangeP[ 1 ] - ( box - 1 ) / 2 ) {
				break;
			}

			value = this.getAverageP( i - ( box - 1 ) / 2 , i + ( box - 1 ) / 2 );

			if( below === undefined ) {
				below = value < level;
				continue;
			}

			// Crossing up
			if( value > level && below ) {

				below = false;

				if( options.edge == 'ascending' ) {
					// Found something
					for( j = i + ( box - 1 ) / 2 ; j >= i - ( box - 1 ) / 2 ; j -- ) {

						if( this.data[ j ] > level && this.data[ j - 1 ] < level ) { // Find a crossing

							return options.rounding == "before" ? j - 1 : j;
						}
					}
				}

			} else if( value < level && ! below ) {

				below = true;

				if( options.edge == 'descending' ) {

				
					for( j = i + ( box - 1 ) / 2 ; j >= i - ( box - 1 ) / 2 ; j -- ) {

						if( this.data[ j ] < level && this.data[ j - 1 ] > level ) { // Find a crossing

							return options.rounding == "before" ? j - 1 : j;
						}
					}
				}
			}
		}

		
	}
}

module.exports = Waveform;