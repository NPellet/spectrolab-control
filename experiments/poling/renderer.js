
var renderer = require("../../server/renderer");


var w = renderer.addWrapper('c').setSize( 100 ).setPosition( 0, 0 );
w.addModule('display/status', 'status');

var w = renderer
	.addWrapper("wrapper_graph")
	.setSize( 60, 40 )
	.setPosition( 0, 3 );

w.addModule("keithley-poling", "poling").setTitle( "" );
//w.addModule("display/table", "table").setTitle( "" );

var wrapperConsole = renderer
						.addWrapper("keithley-connection")
						.setTitle("Keithley connection")
						.setSize( 15 )
						.setPosition( 55, 5 );

wrapperConsole.addModule("keithley-connect", "smuconnect").setTitle("");


var w = renderer
	.addWrapper("vocvstime")
	.setTitle("Voc vs Time")
	.setSize( 55, 50 )
	.setPosition( 55, 10 );

w.addModule("display/graph", "GraphVocVsTime").setTitle( "" );
w.addModule("display/legend", "legend").setTitle( "" );




module.exports = renderer;