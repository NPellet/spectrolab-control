
var renderer = require("../../../server/renderer");


var w = renderer
	.addWrapper("wrapper_table")
	.setSize( 20, 40 )
	.setPosition( 0, 3 );

w.addModule("arduino/connect", "arduinoConnect").setTitle( "Some button" );
w.addModule("display/button", "arduinoCommand").setTitle( "Send Arduino command" );

module.exports = renderer;