
var renderer = require("../../../renderer");

var wrapperConsole = renderer
						.addWrapper("keithley-connection")
						.setTitle("Keithley connection")
						.setSize( 15 )
						.setPosition( 5, 5 );

wrapperConsole.addModule("keithley-connect", "keithleyConnect").setTitle("");

var wrapperConsole = renderer
	.addWrapper("keithley")
	.setTitle("Keithley SMU")
	.setSize( 40 )
	.setPosition( 5, 15 );

wrapperConsole.addModule("keithley-bias-stability", "keithleyVocStab").setTitle( "" );
wrapperConsole.addModule("sample-info", "sampleInfo").setTitle( "Sample information" );



var wrapperConsole = renderer
	.addWrapper("vocvstime")
	.setTitle("Voc vs Time")
	.setSize( 60, 40 )
	.setPosition( 50, 5 );

wrapperConsole.addModule("display/graph", "GraphVocVsTime").setTitle( "" );

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