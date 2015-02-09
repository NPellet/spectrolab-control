
var renderer = require("../../server/renderer");

var w = renderer
	.addWrapper("wrapper_graph")
	.setSize( 60, 40 )
	.setPosition( 0, 3 );

w.addModule("keithley-hallmeasurement", "hall").setTitle( "" );
w.addModule("display/table", "table").setTitle( "" );


var wrapperConsole = renderer
						.addWrapper("keithley-connection")
						.setTitle("Keithley connection")
						.setSize( 15 )
						.setPosition( 55, 5 );

wrapperConsole.addModule("keithley-connect", "smuconnect").setTitle("");





module.exports = renderer;