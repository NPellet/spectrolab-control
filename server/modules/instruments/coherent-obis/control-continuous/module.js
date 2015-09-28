
var moduleProto = require('../../../display/form2/module'),
	extend = require('extend'),
	color = require("color"),
	fs = require('fs');
//console.log( fs.readFileSync( __dirname + "/form.tpl", 'ascii' ) );
var OBISControl = function( ) {
	this.status = {
		formHtml: fs.readFileSync( __dirname + "/form.tpl", 'utf-8' )
	}
};

OBISControl.prototype = new moduleProto.Constructor();

OBISControl.prototype.setInstrument = function( obis ) {

	this.obis = obis;
}

OBISControl.prototype.streamOn.submitClicked = function( data ) {
	
	this.power = Math.max( 0, Math.min( parseFloat( data.form.power ) / 100, 100 ) );
	this.on = !! data.form.on;
	
	setObis();	
};


function setOBIS() {

	this.obis.setContinuousMode();
	this.obis.setLaserPower( this.power );

	if( this.on ) {
		this.obis.turnOn();
	} else {
		this.obis.turnOff();
	}

}




module.exports = {
	Constructor: OBISControl
}
