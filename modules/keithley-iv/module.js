
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
					var totaltime = ( val.stopV - val.startV ) / ( val.scanspeed / 1000 );
					var nbsteps = Math.ceil( ( val.stopV - val.startV ) / ( val.step / 1000 ) );

					var settlingTime = totaltime / nbsteps;

					var options = {
						startV: val.startV,
						stopV: val.stopV,
						channel: val.channel,
						settlingTime: settlingTime,
						timeDelay: val.timeDelay,
						complianceI: val.complianceI,
						nbPoints: nbsteps + 1
					};

					this.lock();

					module.keithley.sweepIV( options, function( iv ) {

						module.streamOut( { message: 'iv', value: iv } );
						module.emit("sweepEnd", iv );

						module.unlock();
					} );

				break;


			}
		}
	}
});

exports = module.exports = {
	Constructor: KeithleySourceV
}