
var renderer = require("../../../server/renderer");


var w = renderer
	.addWrapper("wrapper_table")
	.setSize( 20, 40 )
	.setPosition( 0, 3 );

w.addModule("display/button", "btn").setTitle( "Some button" );
w.addModule("display/graph", "g");


module.exports = renderer;