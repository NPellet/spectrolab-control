
var renderer = require("../../../server/renderer");


var w = renderer
	.addWrapper("wrapper_table")
	.setSize( 20, 40 )
	.setPosition( 0, 3 );

w.addModule("tektronix-AFG/connect", "AFG Connect").setTitle( "Some button" );

module.exports = renderer;
