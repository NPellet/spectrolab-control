

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

var status = renderer.getModule("status");

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

function reprocess( chargesGlobal, vocsGlobal, capacitancesGlobal, delays, chargesFGlobal, capacitancesFGlobal ) {

	var i = 0;
	var colors = ['#a61111', '#2d2d94', '#479116', '#722f8b', '#a36228'];
	var colors2 = ['#cf6565', '#6565cf', '#a2c48b', '#b58bc4', '#ce9f75'];

	renderer.getModule("vocvstime").clear();
	renderer.getModule("C-t").clear();
	renderer.getModule("C-V").clear();
	renderer.getModule("C-t").setXLogScale( true );
	renderer.getModule("vocvstime").setXLogScale( true );

	renderer.getModule("chargesvstime").clear();
	renderer.getModule("chargesvstime").setXLogScale( true );

	var itx = new ITXBuilder();

	for( var l = 0; l < vocsGlobal.length; l += 1 ) {

		var style = {
			shape: 'circle',
	        r: 2,
	        fill: colors[ l ],
	        stroke: colors[ l ]
    	};

		var style2 = {
			shape: 'circle',
	        r: 2,
	        fill: colors2[ l ],
	        stroke: colors2[ l ]
    	};


		var vocs = vocsGlobal[ l ];
		var charges = chargesGlobal[ l ];
		var capacitances = capacitancesGlobal[ l ];

		var chargesF = chargesFGlobal[ l ];
		var capacitanceF = capacitancesFGlobal[ l ];



		var dataCharges = [], dataChargesSDev = [];
		var dataChargesF = [], dataChargesSDevF = [];

		var wTimeDelays = new Waveform();
		var wCapa = new Waveform();
		var wCapaS = new Waveform();

		var wCapaF = new Waveform();
		var wCapaSF = new Waveform();

		var wCharges = new Waveform();
		var wChargesS = new Waveform();

		var wChargesF = new Waveform();
		var wChargesSF = new Waveform();

		var wVocs = new Waveform();
		var wVocsS = new Waveform();

		wTimeDelays.setData( delays );

		charges.map( function( charge ) {

			var i = charges.indexOf( charge );

			dataCharges.push( [ delays[ i ], charge.median() ] );
			dataChargesSDev.push( [ [ charge.stdDev() ] ] );


			dataChargesF.push( [ delays[ i ], chargesF[ i ].median() ] );
			dataChargesSDevF.push( [ [ chargesF[ i ].stdDev() ] ] );

			wCharges.push( charge.median() );
			wChargesS.push( charge.stdDev() );

			wChargesF.push( chargesF[ i ].median() );
			wChargesSF.push( chargesF[ i ].stdDev() );
		});


		renderer.getModule("chargesvstime").newScatterSerie("chargesvstime_" + l, dataCharges, { }, dataChargesSDev, style );
		renderer.getModule("chargesvstime").newScatterSerie("chargesvstime_" + l + "_F", dataChargesF, { }, dataChargesSDevF, style2 );
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

		var dataCapaF = [], dataCapaSDevF = [];
		var dataCVF = [], dataCVSdevF = [];


		i = 0;
		capacitances.map( function( c ) {

			var i = capacitances.indexOf( c );

			dataCapa.push( [ delays[ i ], c.median() ] );
			dataCapaSDev.push( [ [ c.stdDev() ] ] );

			dataCV.push( [ vocs[ i ].median(), c.median() ] );
			dataCVSdev.push( [ [ c.stdDev() ] ] );

			dataCapaF.push( [ delays[ i ], capacitanceF[ i ].median() ] );
			dataCapaSDevF.push( [ [ capacitanceF[ i ].stdDev() ] ] );

			dataCVF.push( [ vocs[ i ].median(), capacitanceF[ i ].median() ] );
			dataCVSdevF.push( [ [ capacitanceF[ i ].stdDev() ] ] );


			wCapa.push( c.median() );
			wCapaS.push( c.stdDev() );

			wCapaF.push( capacitanceF[ i ].median() );
			wCapaSF.push( capacitanceF[ i ].stdDev() );

		});





		renderer.getModule("vocvstime").newScatterSerie("vocvstime_" + l, dataVoc, {}, dataVocSDev, style );
		renderer.getModule("vocvstime").autoscale();


		renderer.getModule("C-t").newScatterSerie("CT_" + l, dataCapa, { }, dataCapaSDev, style );
		renderer.getModule("C-t").newScatterSerie("CT_" + l + "_F", dataCapaF, { }, dataCapaSDevF, style2 );
		renderer.getModule("C-t").autoscale();



		renderer.getModule("C-V").newScatterSerie("CV_" + l, dataCV, { }, dataCVSdev, style );
		renderer.getModule("C-V").newScatterSerie("CV_" + l + "_F", dataCVF, { }, dataCVSdevF, style2 );
		renderer.getModule("C-V").autoscale();


		var itxw = itx.newWave( "voc_" + l );
		itxw.setWaveform( wVocs );

		var itxw = itx.newWave( "voc_sdev_" + l );
		itxw.setWaveform( wVocsS );

		var itxw = itx.newWave( "charges_" + l );
		itxw.setWaveform( wCharges );

		var itxw = itx.newWave( "charges_sdev_" + l );
		itxw.setWaveform( wChargesS );


		var itxw = itx.newWave( "charges_f_" + l );
		itxw.setWaveform( wChargesF );

		var itxw = itx.newWave( "charges_sdev_f_" + l );
		itxw.setWaveform( wChargesSF );


		var itxw = itx.newWave( "capacitance_" + l );
		itxw.setWaveform( wCapa );

		var itxw = itx.newWave( "capacitance_sdev_" + l );
		itxw.setWaveform( wCapaS );

		var itxw = itx.newWave( "capacitance_f_" + l );
		itxw.setWaveform( wCapaF );

		var itxw = itx.newWave( "capacitance_sdev_f_" + l );
		itxw.setWaveform( wCapaSF );


	}

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
		arduino: a,

		progress: function( pulseNb, lightLevel, lastPulseDelay, allDelays, charges, voc, capacitances, chargesFastest, capacitanceFastest ) {

/*
			vdecay.clear();
			vdecay.newSerie("vdecay", waves[ 3 ], { lineColor: 'red'})
			vdecay.autoscale();

			jdecay.clear();
			jdecay.newSerie("jdecay", waves[ 2 ], { lineColor: 'blue' } );
			jdecay.autoscale();
*/
			reprocess( charges, voc, capacitances, allDelays, chargesFastest, capacitanceFastest );

			status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
/*


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

	*/
		}


	} );
	experiment.run();
/*
	g.getWaves().then( function( waves ) {


	} );*/
} ).lock( "gould" ).lock( "keithley" );









renderer.render();
