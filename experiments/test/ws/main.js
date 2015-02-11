

var renderer = require( "./renderer" );
var stream = require( "../../../server/stream" );
var Gould = require( "../../../controllers/gould-oscilloscope/200/controller" );
var Keithley = require( "../../../controllers/keithley-smu/default/controller" );
var config = require( "../../../server/config" );
var Device = require( "../../../device_experiments/device" );
var ITXBuilder = require("../../../server/databuilder/itx").ITXBuilder,
	fileSaver = require("../../../server/filesaver");	
var Waveform = require('../../../server/waveform');


renderer.getModule("btn").on("clicked", function() {

	this.setText("SALUT !!!");

	var g = renderer.getModule("g");
	g.setXAxisLabel(" Something in x");
	g.setYAxisLabel(" Something in y");
	g.newSerie( "Some name", [ 1, 2, 4, 7, 6, 1 ], { lineColor: 'red' } );
	g.redraw();
});

renderer.render();
