
var exports = {};


var IgorFile = function() {

	this.waves = {};
	this.beginFile = "IGOR\n";
	this.endFile = "";
}

IgorFile.prototype = {

	newWave: function( name ) {

		if( name instanceof IgorWave ) {

			var w = name;
			if( this.waves[ w.getName( ) ] ) {
				throw "A wave with a similar name already exists";	
			}

			return this.waves[ w.getName( ) ] = w;
		}

		if( this.waves[ name ] ) {
			throw "A wave with a similar name already exists";
		}

		if( ! name ) {
			throw "Wave name must not be empty";
		}

		return this.waves[ name ] = new IgorWave( name );
	}

	
	getFile: function( filename ) {

		var string = "";
		string += this.beginFile;

		for( var i in this.waves ) {
			string += this.waves[ i ].getText( );
		}

		string += this.endFile;
		return string;
	}
};

var IgorWave = function( name ) {

	if( ! name ) {
		throw "Wave name must not be empty";
	}

	this.name = name;
}

IgorWave.prototype = {

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

	getText: function() {

		if( ! this.data ) {
			throw "Wave has no data";
		}

		var string = "";
		string += "WAVES/D	" + this.name + "\n";
		string += "BEGIN\n";
		string += this.data.join("\n");
		string += "\n";
		string += "END\n";

		SetScale/P x 0,3,"", colors

		if( this.xScaling || this.xUnit ) {

			var stringScaling = "x SetScale/";

			if( this.xScaling ) {
				switch( this.xScaling.mode ) {

					case 'delta':
						stringScaling += "/P x " + this.xScaling.x0 + "," + this.xScaling.xDelta; 
					break;


				}
			} else {
				stringScaling += "/P 0, 1";
			}
				
			stringScaling += ", \"" + (this.xUnit || "") + "\"";
			stringScaling += ", " + this.name + ";";
			stringScaling += "\n";

			string += stringScaling
		}
		
		if( this.yUnit ) {
			string += " SetScale y 0, 0,\"" + ( this.yUnit || "" ) + "\", " + this.name + ";\n";	
		}

		return string;
	},

	getName: function() {
		return this.name;
	}
}

exports.IgorSaver = IgorFile;
exports.IgorWave = IgorWave;

module.exports = exports;



