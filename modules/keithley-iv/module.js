
var moduleProto = require('../../module'),
	extend = require('extend');

var KeithleySourceV = function() {};

KeithleySourceV.prototype = extend( {}, moduleProto, {

	assignKeithley: function( keithley ) {

		this.keithley = keithley;
		this.sweepEnd = [];

		return this;
	},

	streamIn: function( message ) {

		var module = this;

		if( message.method ) {

			switch( message.method ) {

				case 'sweep':

					var val = message.value;
					var totaltime = Math.ceil( ( val.stopV - val.startV ) / val.scanspeed );
					var nbsteps = Math.ceil( ( val.stopV - val.startV ) / val.step );

					var settlingTime = Math.ceil( totaltime / nbsteps );

					var options = {
						startV: val.startV * 1000,
						stopV: val.stopV * 1000,
						channel: val.channel,
						settlingTime: settlingTime,
						timeDelay: val.timeDelay,
						complianceI: val.complianceI,
						nbPoints: nbsteps
					};

					module.keithley.sweepIV( options, function( iv ) {

						module.streamOut( { message: 'iv', value: iv } );

						module.sweepEnd.map( function( callback ) {
							callback( iv );
						} );
					} );

				break;
			}
		}
	},

	onSweepEnd: function( callback ) {

		this.sweepEnd.push( callback );
		return this;
	}
});

exports = module.exports = {
	Constructor: KeithleySourceV
}