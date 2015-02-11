

var renderer = require( "./renderer" );
var stream = require( "../../../server/stream" );
var Gould = require( "../../../controllers/gould-oscilloscope/200/controller" );
var Keithley = require( "../../../controllers/keithley-smu/default/controller" );
var config = require( "../../../server/config" );
var Device = require( "../../../device_experiments/device" );
var ITXBuilder = require("../../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../../server/filesaver");	
var Waveform = require('../../../server/waveform');

var Arduino = require('../../../controllers/arduino/default/controller');

var a = new Arduino( config.instruments.arduino );
var k = new Keithley( config.instruments.keithley );


k.connect();


renderer.getModule('arduinoConnect').assignArduino( a );
renderer.getModule('arduinoCommand').on("clicked", function() {

	a.sendCommand( "5,0,2000;" );

	k.longPulse( {

		diodePin: 4,
		pulseWidth: 0.01,
		numberOfPulses: 10,
		delay: 0.1
	});
});

renderer.render();
