
var renderer = require("/renderer");

var wrapperConsole = renderer
						.addWrapper()
						.setTitle("Keithley console")
						.setSize( 10, 5 )
						.setPosition( 0, 0 );

wrapperConsole.addModule("console", "keithley");

var wrapperGraphs = renderer.addWrapper();
wrapperGraphs.addModule("graph", "current");
wrapperGraphs.addModule("graph", "voltage");
wrapperGraphs.addModule("graph", "power");

