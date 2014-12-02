

var IgorSaver = function() {

	this.igorString = "IGOR\n";
}

IgorSaver.prototype = {

	addWave: function( a, name, x0, xDelta, xunit, yunit ) {

		this.igorString += "WAVES/D	" + name + "\n";
		this.igorString += "BEGIN\n";
		this.igorString += a.join("\n");
		this.igorString += "\n";
		this.igorString += "END\n";

		this.igorString += "x SetScale/P x " + x0 + "," + xDelta + ",\"" + xunit + "\", " + name + "; SetScale y " + 0 + "," + 0 + ",\"" + yunit + "\", " + name + "\n";
	},

	addWaveFromArray: function( a, index, name, x0, xDelta, xunit, yunit ) {

		var a2 = [];
		for( var i = 0, l = a.length; i < l ; i ++ ) {
			a2.push( a[ i ][ index ] );
		}

		this.addWave( a2, name, x0, xDelta, xunit, yunit );
	},

	getFile: function( filename ) {

		return this.igorString;
	}
}

module.exports = IgorSaver;



