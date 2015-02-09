
var renderer = require("../../../server/renderer");


var w = renderer
	.addWrapper("wrapper_table")
	.setSize( 60, 40 )
	.setPosition( 0, 3 );

w.addModule("sun-calibration", "suncalib").setTitle( "" );
module.exports = renderer;
