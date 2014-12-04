
var renderer = require("../../../server/renderer");


var wrapperConsole = renderer
	.addWrapper("wrapper_graph")
	.setTitle("")
	.setSize( 60, 40 )
	.setPosition( 50, 5 );

wrapperConsole.addModule("display/graph", "graph").setTitle( "" );
wrapperConsole.addModule("display/legend", "legend").setTitle( "" );



/*
var wrapperConsole = renderer
	.addWrapper("voc")
	.setTitle("IV Curve")
	.setSize( 40 )
	.setPosition( 50, 0 );

//wrapperConsole.addModule("keithley-sourcev", "keithleySourceV");
wrapperConsole.addModule("ivdisplay", "IV");

*/


/*
var wrapperGraphs = renderer.addWrapper();
wrapperGraphs.addModule("graph", "current");
wrapperGraphs.addModule("graph", "voltage");
wrapperGraphs.addModule("graph", "power");

*/

module.exports = renderer;