

var renderer = require( "./renderer" );
var stream = require( "../../server/stream" );
var Gould = require( "../../controllers/gould-oscilloscope/200/controller" );
var Keithley = require( "../../controllers/keithley-smu/default/controller" );
var Arduino = require( "../../controllers/arduino/default/controller" );
var AFG = require( "../../controllers/tektronix-functiongenerator/default/controller" );


var config = require( "../../server/config" );
var Device = require( "../../device_experiments/device" );
var ITXBuilder = require("../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../server/filesaver");

var Waveform = require('../../server/waveform');

var g = new Gould( config.instruments.gouldOscilloscope );
var k = new Keithley( config.instruments.keithley );
var a = new Arduino( config.instruments.arduino );
var afg = new AFG( config.instruments.functionGenerator );


var experiment;

renderer
	.getModule("gouldConnect")
	.assignGould( g );

renderer
	.getModule("keithleyConnect")
	.assignKeithley( k );

renderer
		.getModule('arduinoConnect')
		.assignArduino( a );

renderer
			.getModule('afgConnect')
			.assignArduino( a );

var status = renderer.getModule("status");

var moduleLocking = [ "start", "gouldConnect", "keithleyConnect" ]

var moduleGraphs = [ "vocvstime" ];

g.on("busy", function() {
	renderer.lockModules( moduleLocking, 'gouldBusy' );
}).on("idle", function() {
	renderer.unlockModules( moduleLocking, 'gouldBusy' );
});

k.on("busy", function() {
	renderer.lockModules( moduleLocking, 'keithleyBusy' );
}).on("idle", function() {
	renderer.unlockModules( moduleLocking, 'keithleyBusy' );
});

k.on("disconnected", function() {
	renderer.getModule("start").lock("keithley");
}).on("connected", function() {
	renderer.getModule("start").unlock("keithley");
});

g.on("disconnected", function() {
	renderer.getModule("start").lock("gould");
}).on("connected", function() {
	renderer.getModule("start").unlock("gould");
});


var vdecay = renderer.getModule("vdecay");
var jdecay = renderer.getModule("jdecay");

var focusId = false;

moduleGraphs.map( function( g ) {

	renderer.getModule( g ).on("mouseOverPoint", function( serieName, id ) {
		focusId = id;
		renderer.getModule("focus").setText("Focus on point " + id );
	});
});

renderer.getModule("focus").on("clicked", function() {

	experiment.focusOn( focusId );

	if( focusId !== false ) {
		focusId = false;
		renderer.getModule("focus").setText("Stop focus" );
	}

});

function reprocess( waveVoc, pulseLength, pulseLevel ) {

	var i = 0;
	var colors = ['#a61111', '#2d2d94', '#479116', '#722f8b', '#a36228'];
	var colors2 = ['#cf6565', '#6565cf', '#a2c48b', '#b58bc4', '#ce9f75'];

	renderer.getModule("vocvstime").clear();

	var itx = new ITXBuilder();

	var itxw = itx.newWave( "pulse_" + pulseLength + "_level_" + pulseLevel );
	itxw.setWaveform( waveVoc );

	var fileName = fileSaver.save( {
		contents: itx.getFile(),
		forceFileName: "voc.itx",
		fileExtension: 'itx',
		dir: './vocrise/'
	} );

}


renderer.getModule("start").on('clicked', function() {

	experiment = Device.method( "VocRise", {

		oscilloscope: g,
		keithley: k,
		arduino: a,
		afg: afg,

		pulseLengths: [ 20e-9, 2000e-9 ],
		lightLevels: [ 11 ],

		pulseNb: 1000,

		progress: function( vocWave, pulseLength, pulseLevel ) {

			reprocess( vocWave, pulseLength, pulseLevel );
			status.update("Measuring pulse time: " + pulseLength + " with level " + pulseLevel + "s.", "process");
		}


	} );
	experiment.run();

} ).lock( "gould" ).lock( "keithley" );


renderer.render();
