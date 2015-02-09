
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
			module.lock("measure");
			// Measuring voltage

			module.emit( "measuring" );

			module.keithley.Sine( val, function( stab ) {

				console.log( stab );

				module.emit( "measurementDone", stab );
				module.unlock("measure");

			} );	
		}
	}
});

exports = module.exports = {
	Constructor: KeithleySourceV
}