

var renderer = require( "./renderer" );
var stream = require( "../../server/stream" );
var Gould = require( "../../controllers/gould-oscilloscope/200/controller" );
var Keithley = require( "../../controllers/keithley-smu/default/controller" );
var config = require( "../../server/config" );
var Device = require( "../../device_experiments/device" );
var ITXBuilder = require("../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../server/filesaver");

var Waveform = require('../../server/waveform');

var g = new Gould( config.instruments.gouldOscilloscope );
var k = new Keithley( config.instruments.keithley );

var experiment;

renderer
	.getModule("gouldConnect")
	.assignGould( g );

renderer
	.getModule("keithleyConnect")
	.assignKeithley( k );


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



renderer.getModule("start").on('clicked', function() {

	experiment = Device.method( "vocdecay-oscilloscope", {
			oscilloscope: g,
			keithley: k
		}
	);

	experiment.run().then( function( vocDecayWave ) {
		renderer.getModule('vocvstime').newSerie("vocvstime", vocDecayWave );
	});

} ).lock( "gould" ).lock( "keithley" );


renderer.render();
