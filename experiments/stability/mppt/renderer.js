
var renderer = require("../../../renderer");

var wrapperConsole = renderer
						.addWrapper()
						.setTitle("Keithley console")
						.setSize( 10, 5 )
						.setPosition( 0, 0 );

wrapperConsole.addModule("keithley-connect", "keithleyConnect");
/*
var wrapperGraphs = renderer.addWrapper();
wrapperGraphs.addModule("graph", "current");
wrapperGraphs.addModule("graph", "voltage");
wrapperGraphs.addModule("graph", "power");

*/