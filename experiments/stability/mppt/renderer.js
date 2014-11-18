
var renderer = require("../../../renderer");

var wrapperConsole = renderer
						.addWrapper("keithley-connection")
						.setTitle("Keithley connection")
						.setSize( 15 )
						.setPosition( 10, 10 );

wrapperConsole.addModule("keithley-connect", "keithleyConnect").setTitle("");



var wrapperConsole = renderer
	.addWrapper("keithley-smu")
	.setTitle("Keithley SMU")
	.setSize( 40 )
	.setPosition( 30, 30 );

wrapperConsole.addModule("keithley-iv", "keithleySweep").setTitle("");
wrapperConsole.addModule("biaslightcontrol", "biasLight").setTitle("");


var wrapperConsole = renderer
	.addWrapper("iv")
	.setTitle("IV Curve")
	.setSize( 40 )
	.setPosition( 50, 0 );

//wrapperConsole.addModule("keithley-sourcev", "keithleySourceV");
wrapperConsole.addModule("ivdisplay", "IV");




/*
var wrapperGraphs = renderer.addWrapper();
wrapperGraphs.addModule("graph", "current");
wrapperGraphs.addModule("graph", "voltage");
wrapperGraphs.addModule("graph", "power");

*/

module.exports = renderer;