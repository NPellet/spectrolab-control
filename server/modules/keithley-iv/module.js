
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

	measure: function( options ) {

		var module = this;
		this.counter++;

		options.startV = - options.startV;
		options.stopV = - options.stopV;


console.log( options );


		this.keithley.sweepIV( options, function( iv ) {

			module.streamOut( "iv", iv );
			module.emit("sweepDone", iv );

			if( module.counter < 10 ) {
				module.measure( options );
			}
			
		} );


	},

	streamOn: {

		'sweep': function( val ) {

			var module = this;
			var totaltime = ( val.stopV - val.startV ) / ( val.scanspeed / 1000 );
			var nbsteps = Math.ceil( ( val.stopV - val.startV ) / ( val.step / 1000 ) );

			var settlingTime = totaltime / nbsteps;

			var options = {
				startV: val.startV,
				stopV: val.stopV,
				channel: val.channel,
				settlingTime: settlingTime,
				timeDelay: val.timeDelay,
				complianceI: 1,
				nbPoints: nbsteps + 1
			};

			this.lock( "measuring" );
			this.counter = 0;
			this.measure( options );

		}
	}
});

exports = module.exports = {
	Constructor: KeithleySourceV
}