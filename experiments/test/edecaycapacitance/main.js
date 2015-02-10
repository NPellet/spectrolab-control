

var renderer = require( "./renderer" );
var stream = require( "../../../server/stream" );
var Gould = require( "../../../controllers/gould-oscilloscope/200/controller" );
var Keithley = require( "../../../controllers/keithley-smu/default/controller" );
var config = require( "../../../server/config" );
var Device = require( "../../../device_experiments/device" );
var ITXBuilder = require("../../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../../server/filesaver");	
var Waveform = require('../../../server/waveform');

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
var moduleGraphs = [ "chargesvstime", "vocvstime", "C-V", "C-t"];

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

function reprocess( charges, vocs, delays, capacitances ) {

	var i = 0;
	
	

	var dataCharges = [], dataChargesSDev = [];

	var wTimeDelays = new Waveform();
	var wCapa = new Waveform();
	var wCapaS = new Waveform();
	var wCharges = new Waveform();
	var wChargesS = new Waveform();
	var wVocs = new Waveform();
	var wVocsS = new Waveform();

	wTimeDelays.setData( delays );

	charges.map( function( charge ) {
		
		var i = charges.indexOf( charge );

		dataCharges.push( [ delays[ i ], charge.median() ] );
		dataChargesSDev.push( [ [ charge.stdDev() ] ] );

		wCharges.push( charge.median() );
		wChargesS.push( charge.stdDev() );

		i++;
	});

	renderer.getModule("chargesvstime").clear();
	renderer.getModule("chargesvstime").setXLogScale( true );
	
	renderer.getModule("chargesvstime").newScatterSerie("chargesvstime", dataCharges, {}, dataChargesSDev );
	renderer.getModule("chargesvstime").autoscale();


	var dataVoc = [], dataVocSDev = [];
	vocs.map( function( voc ) {

		var i = vocs.indexOf( voc );

		dataVoc.push( [ delays[ i ], voc.median() ] );
		dataVocSDev.push( [ [ voc.stdDev() ] ] );

		wVocs.push( voc.median() );
		wVocsS.push( voc.stdDev() );		
	});

	var dataCapa = [], dataCapaSDev = [];
	var dataCV = [], dataCVSdev = [];

	i = 0;
	capacitances.map( function( c ) {

		var i = capacitances.indexOf( c );
		
		dataCapa.push( [ delays[ i ], c.median() ] );
		dataCapaSDev.push( [ [ c.stdDev() ] ] );

		dataCV.push( [ vocs[ i ].median(), c.median() ] );
		dataCVSdev.push( [ [ c.stdDev() ] ] );


		wCapa.push( c.median() );
		wCapaS.push( c.stdDev() );

	});


	renderer.getModule("vocvstime").clear();
	renderer.getModule("vocvstime").setXLogScale( true );
	renderer.getModule("vocvstime").newScatterSerie("vocvstime", dataVoc, {}, dataVocSDev );
	renderer.getModule("vocvstime").autoscale();


	renderer.getModule("C-t").clear();
	renderer.getModule("C-t").setXLogScale( true );
	renderer.getModule("C-t").newScatterSerie("CT", dataCapa, {}, dataCapaSDev );
	renderer.getModule("C-t").autoscale();


	renderer.getModule("C-V").clear();
	renderer.getModule("C-V").newScatterSerie("CV", dataCV, {}, dataCVSdev );
	renderer.getModule("C-V").autoscale();

	var itx = new ITXBuilder();

	var itxw = itx.newWave( "voc" );
	itxw.setWaveform( wVocs );

	var itxw = itx.newWave( "voc_sdev" );
	itxw.setWaveform( wVocsS );

	var itxw = itx.newWave( "charges" );
	itxw.setWaveform( wCharges );

	var itxw = itx.newWave( "charges_sdev" );
	itxw.setWaveform( wChargesS );

	var itxw = itx.newWave( "capacitance" );
	itxw.setWaveform( wCapa );

	var itxw = itx.newWave( "capacitance_sdev" );
	itxw.setWaveform( wCapaS );

	var itxw = itx.newWave( "times" );
	itxw.setWaveform( wTimeDelays );

	var fileName = fileSaver.save( {
		contents: itx.getFile(),
		forceFileName: "capa.itx",
		fileExtension: 'itx',
		dir: './capacitance/'
	} );
}


renderer.getModule("start").on('clicked', function() {

	experiment = Device.method( "eDecayCapacitance", {
		
		oscilloscope: g,
		keithley: k,

		progress: function( waves, delay, iterator, charges, voc, timeDelays, capacitances ) {

			vdecay.clear();
			vdecay.newSerie("vdecay", waves[ 3 ], { lineColor: 'red'})
			vdecay.autoscale();

			jdecay.clear();
			jdecay.newSerie("jdecay", waves[ 2 ], { lineColor: 'blue' } );
			jdecay.autoscale();
			
			reprocess( charges, voc, timeDelays, capacitances );




			var itx = new ITXBuilder();
			var itxw = itx.newWave( "CHAN1" );
			itxw.setWaveform( waves[ 1 ] );

			var itxw = itx.newWave( "CHAN2" );
			itxw.setWaveform( waves[ 2 ] );

			var itxw = itx.newWave( "CHAN3" );
			itxw.setWaveform( waves[ 3 ] );

			var itxw = itx.newWave( "CHAN4" );
			itxw.setWaveform( waves[ 4 ] );

			var fileName = fileSaver.save( {
				contents: itx.getFile(),
				fileName: "decay-" + delay + "-" + iterator,
				fileExtension: 'itx',
				dir: './capacitance/'
			} );
		}


	} );
	experiment.run();
/*
	g.getWaves().then( function( waves ) {


	} );*/
} ).lock( "gould" ).lock( "keithley" );









renderer.render();
