
"use strict";

var moduleProto = require('../../module'),
	extend = require('extend');

var KeithleyMeasureVoc = function() {
	this.title = "IV Sweep parameters";
};

KeithleyMeasureVoc.prototype = extend( {}, moduleProto, {

	assignKeithley: function( keithley ) {

		this.keithley = keithley;

		return this;
	},

	getMeasurementParams: function() {
		return this.getMeasurementParameters();
	},

	getMeasurementParameters: function() {
		return this.options;
	},

	streamOn: {

		'measure': function( val ) {

			var method;
			var options = {

				channel: val.channel,
				complianceI: 1,
				complianceV: 10,
				totaltime: val.totaltime,
				settlingtime: val.settlingtime,
				bias: val.bias
			},
			module = this;

			this.options = options;

			this.lock( "smu.measure" );
			module.emit( "measuring" );

			switch( val.biastype ) {

				case 'voltage':
					method = "CurrentStability";
				break;

				default:
				case 'current':
					method = "VoltageStability";
				break;
			}

			module.keithley[ method ]( options, function( stab ) {

				//module.streamOut( { message: 'iv', value: voc_time } );
				module.emit("measurementEnd", stab, options );
				module.unlock( "smu.measure" );
			} );

		}
	}
	
});

exports = module.exports = {
	Constructor: KeithleyMeasureVoc
}