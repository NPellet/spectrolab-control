
var renderer = require("../../../server/renderer");


var w = renderer
	.addWrapper("wrapper_table")
	.setWidth(3)
	.setPosition( 0, 3 );

	w.addModule("tektronix-AFG/connect", "AFG Connect").setTitle( "Some button" );

	w.addModule("tektronix-AFG/command", "AFG Command");

module.exports = renderer;
