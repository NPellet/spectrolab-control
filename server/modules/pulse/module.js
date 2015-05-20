
var moduleProto = require('../../../display/form2/module'),
	extend = require('extend'),
	color = require("color"),
	fs = require('fs');


var AFGPulse = function( graphOptions ) {
	this.status = {
		formData: {
			bias: 0,
			type: 'v'
		},

		formHtml: fs.readFileSync( __dirname + "/form.tpl", 'utf-8' )
	}
};

AFGPulse.prototype = new moduleProto.Constructor();
AFGPulse.prototype = extend( AFGPulse.prototype, { } );

AFGPulse.prototype.streamOn.formChanged = function( data ) {

	this.pulselength = parseFloat( data.form.pulse ) * Math.pow( 10, parseInt( data.form.timebase_pulse ) );
	this.period = parseFloat( data.form.period ) * Math.pow( 10, parseInt( data.form.timebase_period ) );
	this.channel = parseInt( data.form.channel );
}


AFGPulse.prototype.setPulseFromAFG = function( AFG ) {

	var channel = this.getChannel();

	AFG.setShape( channel, "PULSE" );
	AFG.setPulseHold( channel , "WIDTH" );
	
	AFG.setPulseLeadingTime( 1, 9e-9 );
	AFG.setPulseTrailingTime( 1, 9e-9 );
	AFG.setPulseDelay( 1, 0 );
	AFG.setPulsePeriod( 1, this.getPeriod( ) );
	AFG.setPulseWidth( 1, this.getPulse( ) );

	return this;
}

AFGPulse.prototype.getPulse = function() {
	return this.pulselength;
}

AFGPulse.prototype.getPeriod = function() {
	return this.period;
}

AFGPulse.prototype.getChannel = function() {
	return this.channel;
}



exports = module.exports = {
	Constructor: AFGPulse
}
