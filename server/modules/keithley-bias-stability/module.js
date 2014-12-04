
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

	streamIn: function( message ) {

		var module = this;
		var method;

		if( message.method ) {

			switch( message.method ) {

				case 'measure':

					var val = message.value;

					var options = {

						channel: val.channel,
						complianceI: 1,
						complianceV: 10,
						totaltime: val.totaltime,
						settlingtime: val.settlingtime,
						bias: val.bias
					};

					this.options = options;

					this.lock( "smu.measure" );
					module.emit( "measuring" );

					switch( val.biastype ) {

						case 'voltage':
							method = "CurrentStability";
						break;


						case 'current':
							method = "VoltageStability";
						break;
					}

					module.keithley[ method ]( options, function( stab ) {

						//module.streamOut( { message: 'iv', value: voc_time } );
						module.emit("measurementEnd", stab, options );
						module.unlock( "smu.measure" );
					} );

				break;


			}
		}
	}
});

exports = module.exports = {
	Constructor: KeithleyMeasureVoc
}