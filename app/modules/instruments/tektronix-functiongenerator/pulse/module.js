
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

	this.pulselength = Math.round( parseFloat( data.form.pulse ) * 100 ) / 100 * Math.pow( 10, parseInt( data.form.timebase_pulse ) );
	this.period = Math.round( parseFloat( data.form.period ) * 100 ) / 100 * Math.pow( 10, parseInt( data.form.timebase_period ) );
	this.channel = parseInt( data.form.channel );

	this.emit("formChanged", this.getConfig( ) );
	this.emit("configChanged", this.getConfig( ) );
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

AFGPulse.prototype.setConfig = function( cfg ) {
	cfg = cfg || {};
	
	this.period = cfg.period || 1e-4;
	this.pulselength = cfg.pulseLength || 1e-5;
	this.channel = cfg.channel || 1;

	this.updateClient();
}


AFGPulse.prototype.getConfig = function( cfg ) {
	return {
		period: this.period,
		pulselength: this.pulselength,
		channel: this.channel
	};
	
}

AFGPulse.prototype.updateClient = function() {
	var data = {
		pulse: this.getPulse(),
		period: this.getPeriod(),
		channel: this.getChannel(),
		timebase_pulse: 0,
		timebase_period: 0
	};

	this.setFormData( data );
}


exports = module.exports = {
	Constructor: AFGPulse
}
