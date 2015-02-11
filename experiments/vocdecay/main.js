

var renderer = require( "./renderer" );
var stream = require( "../../server/stream" );

var Gould = require( "../../controllers/gould-oscilloscope/200/controller" );
var Keithley = require( "../../controllers/keithley-smu/default/controller" );
var Arduino = require( "../../controllers/arduino/default/controller" );

var config = require( "../../server/config" );
var Device = require( "../../device_experiments/device" );
var ITXBuilder = require("../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../server/filesaver");

var Waveform = require('../../server/waveform');

var g = new Gould( config.instruments.gouldOscilloscope );
var k = new Keithley( config.instruments.keithley );
var a = new Arduino( config.instruments.arduino );

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

	function processResponse(response) {

		var vocDecayWave = response[ 0 ];
		var i = 1;

		renderer.getModule('vocvstime').clear();

		vocDecayWave.map( function( wave ) {
			renderer.getModule('vocvstime').newSerie("vocvstime" + i , wave, { lineStyle: i } );	
			i++;
		});

		renderer.getModule('vocvstime').autoscale();
		renderer.getModule('vocvstime').redraw();

	}


	experiment = Device.method( "vocdecay-oscilloscope", {
			oscilloscope: g,
			keithley: k,
			arduino: a,

			progress: function( response ) {

				processResponse( response );

			}
		}
	);

	experiment.run().then( function( response ) {
		
		processResponse( response );
		

		var itx = new ITXBuilder();

		var waves = response[ 0 ];

		var i = 0;
		waves.map( function ( w ) {

			var itxw = itx.newWave( "vocdecay_" + i  );
			itxw.setWaveform( w );
			i++;
		});
		
		var fileName = fileSaver.save( {
			contents: itx.getFile(),
			fileName: "vocdecay.itx",
			fileExtension: 'itx',
			dir: './vocdecay/'
		} );



	});

} ).lock( "gould" ).lock( "keithley" );


renderer.render();
