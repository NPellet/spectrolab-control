
var moduleProto = require('../../module'),
	extend = require('extend');

var GraphDisplay = function() {};

GraphDisplay.prototype = extend( {}, moduleProto, {

	assignKeithley: function( k ) {
		this.smu = k;
		return this;
	},
	
	update: function( message, type ) {

		this.streamOut( "status", { message: message, type: type, date: Date.now() } );
	},

	streamOn: {

		"currentExpected": function( currentExpected ) {
			this.expected = currentExpected;
		},

		"measure": function() {

			this.measure();
		}
	},

	setOneSunValue: function( val ) {
		this.expected = val;
	},

	measure: function() {
			
		if( ! this.smu ) {
			throw "No keithley assigned"
		}

		if( ! this.expected ) {
			throw "Assign a value for one sun";
		}

		var oneSun = this.expected;

		var options = {
			channel: 'smua',
			complianceI: 0.1,
			complianceV: 0.1,
			totaltime: 2,
			settlingtime: 0.1,
			bias: 0
		},
		module = this;

		this.options = options;

		this.lock( "smu.measure" );
		module.emit( "measuring" );

		return module.smu.CurrentStability( options, function( stab ) {

			var average = stab.getAverage();
			
			module.emit("measurementEnd", average / oneSun, options );
			
			module.unlock( "smu.measure" );

			module.out("referenceMeasured", { 
				measured: average,
				sunIntensity: Math.round( average / oneSun * 100 )
			} );

		} );
	}

} );

exports = module.exports = {
	Constructor: GraphDisplay
}