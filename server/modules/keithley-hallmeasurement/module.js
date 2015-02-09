
var moduleProto = require('../../module'),
	extend = require('extend');

var KeithleySourceV = function() {
	this.title = "IV Sweep parameters";
};

KeithleySourceV.prototype = extend( {}, moduleProto, {

	assignKeithley: function( keithley ) {

		this.keithley = keithley;
		this.sweepEnd = [];

		return this;
	},

	streamOn: {

		'measure': function( val ) {

			module = this;

			// Measuring voltage
			module.keithley.HallMeasurement( { 
				channel: val.channel,
				bias: val.current / ( 1e9 )

			}, function( stab ) {
console.log( stab );
				module.emit( "measurementDone", extend( stab ) )

			} );	
		}
	}
});

exports = module.exports = {
	Constructor: KeithleySourceV
}