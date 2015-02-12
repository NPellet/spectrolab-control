

var renderer = require( "./renderer" );
var stream = require( "../../../server/stream" );
var config = require( "../../../server/config" );
var Device = require( "../../../device_experiments/device" );
var ITXBuilder = require("../../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../../server/filesaver");
var Waveform = require('../../../server/waveform');

var TektronixAFG = require('../../../controllers/tektronix-functiongenerator/AFG3022C/controller');

var afg = new TektronixAFG( config.instruments.functionGenerator );

renderer.getModule('AFG Connect').assignAFG( afg );


afg.connect().then( function( afg ) {
console.log('commands');
	afg.commands([
		'OUTPUT1:IMPEDANCE 50',
		'OUTPUT2:IMPEDANCE 50',
		'SOURce1:AM:DEPth MAXimum',
		'OUTPUT1:STATE ON'
	]);


})
renderer.render();
