
var moduleProto = require('../../../display/form2/module'),
	extend = require('extend'),
	color = require("color"),
	fs = require('fs');
//console.log( fs.readFileSync( __dirname + "/form.tpl", 'ascii' ) );
var KeithleyBias = function( graphOptions ) {
	this.status = {
		formData: {
			bias: 0,
			type: 'v'
		},

		formHtml: fs.readFileSync( __dirname + "/form.tpl", 'utf-8' )
	}
};

KeithleyBias.prototype = new moduleProto.Constructor();
KeithleyBias.prototype = extend( KeithleyBias.prototype, { } );

KeithleyBias.prototype.streamOn.formChanged = function( data ) {
	this.biastype = data.form.biastype;
	this.biasvalue = data.form.biasvalue;
}

KeithleyBias.prototype.getBiasType = function() {
	return this.biastype || 'v';
}

KeithleyBias.prototype.getBiasValue = function() {
	return this.biasvalue || 0;
}

KeithleyBias.prototype.setBiasFromKeithley = function( keithleySMU, channel, compliance ) {

	var o = { };

	o.channel = channel || 'smua';
	o[ this.getBiasType() == 'v' ? 'complianceV' : 'complianceI' ] = compliance || 1;

	return keithleySMU[ this.getBiasType() == 'v' ? 'sourcev': 'sourcei' ]( o )
}

exports = module.exports = {
	Constructor: KeithleyBias
}
