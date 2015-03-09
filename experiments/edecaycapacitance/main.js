

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();

experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('eDecayCapacitance');

var Waveform = require('../../server/waveform');



proc.on("progress", function( recordedWaves, pulseNb, lightLevel, lastPulseDelay, allDelays, charges, voc, capacitances, chargesFastest, capacitanceFastest ) {

experiment.renderer.getModule("lastJDecay").clear();
var i = 0;
recordedWaves.map( function( w ) {
	i++;
	experiment.renderer.getModule("lastJDecay").newSerie("jdecay_" + i, w[ "2" ], {} );
});
	//experiment.renderer.getModule("lastJDecay").newSerie("jdecay1", recordedWaves[ 1 ] ? recordedWaves[ 1 ][ "2" ] : recordedWaves[ 0 ][ "2" ] , { } );
	//experiment.renderer.getModule("lastJDecay2").newSerie("jdecay2", recordedWaves[ 1 ][ "2"], { } );

	experiment.renderer.getModule("lastJDecay").autoscale();
	//experiment.renderer.getModule("lastJDecay2").autoscale();

	reprocess( charges, voc, capacitances, allDelays, chargesFastest, capacitanceFastest );
//	status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");
});


experiment.renderer.render();


var focusId = false;

var moduleGraphs = [ 'vocvstime', 'chargesvstime', 'C-V', 'C-t' ];

moduleGraphs.map( function( g ) {

	experiment.renderer.getModule( g ).on("mouseOverPoint", function( serieName, id ) {
		focusId = id;
		experiment.renderer.getModule("focus").setText("Focus on point " + id );
	});
});

experiment.renderer.getModule("focus").on("clicked", function() {

	proc.config( "focus", focusId );

	if( focusId !== false ) {
		focusId = false;
		experiment.renderer.getModule("focus").setText("Stop focus" );
	}

});
/*
experiment.renderer.getModule("formConfig").on("validated", function( value ) {

	proc.config("pulses", value.timebase );
})
*/


function reprocess( chargesGlobal, vocsGlobal, capacitancesGlobal, delays, chargesFGlobal, capacitancesFGlobal ) {

	var i = 0;
	var colors = ['#a61111', '#2d2d94', '#479116', '#722f8b', '#a36228'];
	var colors2 = ['#cf6565', '#6565cf', '#a2c48b', '#b58bc4', '#ce9f75'];

	experiment.renderer.getModule("vocvstime").clear();
	experiment.renderer.getModule("C-t").clear();
	experiment.renderer.getModule("C-V").clear();

	experiment.renderer.getModule("chargesvstime").clear();

	var itx = experiment.getITXBuilder();
	itx = new itx();



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


		var dataCharges = [], dataChargesSDev = [];

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

			wCharges.push( charge.median() );
			wChargesS.push( charge.stdDev() );

		});


		experiment.renderer.getModule("chargesvstime").newScatterSerie("chargesvstime_" + l, dataCharges, { }, dataChargesSDev, style );
	//	experiment.renderer.getModule("chargesvstime").newScatterSerie("chargesvstime_" + l + "_F", dataChargesF, { }, dataChargesSDevF, style2 );
		experiment.renderer.getModule("chargesvstime").autoscale();


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

		var wNb = [];

		i = 0;
		capacitances.map( function( c ) {

			var i = capacitances.indexOf( c );

			dataCapa.push( [ delays[ i ], c.median() ] );
			dataCapaSDev.push( [ [ c.stdDev() ] ] );

			dataCV.push( [ vocs[ i ].median(), c.median() ] );
			dataCVSdev.push( [ [ c.stdDev() ] ] );



			wCapa.push( c.median() );
			wCapaS.push( c.stdDev() );


			wNb.push( [ delays[ i ], c.getDataLength() ] );

		});


		experiment.renderer.getModule("vocvstime").newScatterSerie("vocvstime_" + l, dataVoc, {}, dataVocSDev, style );
		experiment.renderer.getModule("vocvstime").autoscale();


		experiment.renderer.getModule("C-t").newScatterSerie("CT_" + l, dataCapa, { }, dataCapaSDev, style );
		experiment.renderer.getModule("C-t").autoscale();

		experiment.renderer.getModule("C-V").newScatterSerie("CV_" + l, dataCV, { }, dataCVSdev, style );
		experiment.renderer.getModule("C-V").autoscale();

		experiment.renderer.getModule("pulses").newScatterSerie("pulses", wNb , { } );
		experiment.renderer.getModule("pulses").autoscale();


		var itxw = itx.newWave( "voc_" + l );
		itxw.setWaveform( wVocs );

		var itxw = itx.newWave( "voc_sdev_" + l );
		itxw.setWaveform( wVocsS );

		var itxw = itx.newWave( "charges_" + l );
		itxw.setWaveform( wCharges );

		var itxw = itx.newWave( "charges_sdev_" + l );
		itxw.setWaveform( wChargesS );



		var itxw = itx.newWave( "capacitance_" + l );
		itxw.setWaveform( wCapa );

		var itxw = itx.newWave( "capacitance_sdev_" + l );
		itxw.setWaveform( wCapaS );

	}

	var itxw = itx.newWave( "times" );
	itxw.setWaveform( wTimeDelays );

	var fileName = experiment.getFileSaver().save( {
		contents: itx.getFile(),
		forceFileName: "capa.itx",
		fileExtension: 'itx',
		dir: './capacitance/'
	} );
}
