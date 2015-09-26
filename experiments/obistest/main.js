

var fs = require('fs');
var experiment = require('app/experiment');
var Waveform = require('../../server/waveform');
var itx = experiment.itx();
var color = require('color');
experiment.loadInstruments();

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;

experiment.renderer.init();
experiment.addInstrumentConnectModules();
/*
var arduino = experiment.getInstrument('arduino');

var digitalPins = [ 53, 51, 49 ];
var analogPins = [ 1, 2, 3 ];
var pins = [];

for( var i = 0, l = digitalPins.length; i < l ; i ++ ) {
	pins.push( { method: "readDigital", pinNumber: digitalPins[ i ] } );
}

for( var i = 0, l = analogPins.length; i < l ; i ++ ) {
	pins.push( { method: "readAnalog", pinNumber: analogPins[ i ] } );
}

var data = {};
*/


var cfgHtml = require("./cfgform.js");
experiment.renderer.getModule("obissetup").setFormHtml( cfgHtml );

experiment.getModule("obissetup").on("submitClicked", function( cfg ) {
	// Form treatment
	cfg.form.power = Math.max( 0, Math.min( parseFloat( cfg.form.power ) / 100, 100 ) );
	setOBIS( cfg.form );
} );


function setOBIS( cfg ) {


	experiment.getInstrument("OBIS 660nm").setContinuousMode();
	experiment.getInstrument("OBIS 660nm").setLaserPower( cfg.power );

	if( cfg.on ) {
		experiment.getInstrument("OBIS 660nm").turnOn();
	} else {
		experiment.getInstrument("OBIS 660nm").turnOff();
	}

}



/*var timeStart = Date.now();

arduino.on("connected", function() {

	var c = color().hsl( 90, 100, 35 );
	for( var i = 0, l = pins.length; i < l ; i ++ ) {
		data[ pins[ i ].pinNumber ] = [];
		experiment.getModule( "monitor" ).newSerie( "pin_" + pins[ i ].pinNumber, [], { lineColor: c.rgbString() } );
		c.rotate( 270 / l );
	}
	read( pins[ 0 ] );
} );


arduino.connect();

function read( pin ) {

	arduino[ pin.method ]( pin.pinNumber ).then( function( response ) {

		var newTime = ( Date.now() - timeStart ) / 1000;

		data[ pin.pinNumber ].push( newTime );
		data[ pin.pinNumber ].push( response );

		var s = experiment.getModule( "monitor" ).getSerie( "pin_" + pin.pinNumber );
		s.data = data[ pin.pinNumber ];
		experiment.getModule( "monitor" ).updateSerie( "pin_" + pin.pinNumber );
		experiment.getModule( "monitor" ).forceXScale( newTime < 30 ? 0 : newTime - 30, newTime );


		setTimeout( function() {
			nextRead( pin );
		}, 100 );
		
	});
}

function nextRead( currPin ) {
	var pin = pins.indexOf( currPin );
	
	if( pins.length == pin + 1 ) {
		return read( pins[ 0 ] );
	}

	read( pins[ pin + 1 ] );
}

*/
experiment.renderer.render();
