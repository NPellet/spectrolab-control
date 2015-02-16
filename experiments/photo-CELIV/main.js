

var renderer = require( "./renderer" );
var stream = require( "../../server/stream" );

var Util = require("../../server/util");

var config = require( "../../server/config" );
var Device = require( "../../device_experiments/device" );
var ITXBuilder = require("../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../server/filesaver");

var Waveform = require('../../server/waveform');


var instruments = Util.importInstruments( config );
renderer.setInstrumentsToWrapper( instruments );


var experiment;

var status = renderer.getModule("status");


function reprocess( chargesGlobal, vocsGlobal, capacitancesGlobal, delays, chargesFGlobal, capacitancesFGlobal ) {


}


renderer.getModule("start").on('clicked', function() {

	experiment = Device.method( "photo-CELIV", {

		instruments: instruments,

		progress: function(  ) {


			reprocess( charges, voc, capacitances, allDelays, chargesFastest, capacitanceFastest );

			status.update("Measuring pulse n°: " + pulseNb + " with time delay " + lastPulseDelay + "s.", "process");

		}


	} );
	experiment.run();
/*
	g.getWaves().then( function( waves ) {


	} );*/
} ).lock( "gould" ).lock( "keithley" );









renderer.render();
