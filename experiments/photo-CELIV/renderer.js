
var renderer = require("../../server/renderer");


var graphOptions = {

  dblclick: {
    type: 'plugin',
    plugin: 'graph.plugin.zoom',
    options: {
      mode: 'total'
    }
  },

  plugins: {
    'graph.plugin.zoom': {
      zoomMode: 'x'
    }
  },

  pluginAction: {
    'graph.plugin.zoom': {
      shift: false,
      ctrl: false
    }
  }
};

var w = renderer
  .addWrapper()
  .setTitle("Status bar")
  .setPosition( 0, 0 );

w.addModule("display/status", "status");



var w = renderer
  .addWrapper()
  .setTitle("Experiment control")
  .setWidth( 3 )
  .setPosition( 0, 1 );

w.addModule("gould/connect", "gouldConnect").setTitle( "Gould Status" );
w.addModule("keithley/connect", "keithleyConnect").setTitle( "Keithley Status" );
w.addModule("arduino/connect", "arduinoConnect").setTitle( "Arduino Status" );

w.addModule("display/button", "start").setText( "Start capacitance measurement" ).setTitle("Measurement");
w.addModule("display/button", "focus").setText( "Focus on point: " );

var w = renderer
	.addWrapper()
  .setWidth( 8 )
	.setPosition( 3, 1 );

w.addModule("display/graph", "vdecay", graphOptions).setTitle("Voltage Decay");
w.addModule("display/graph", "jdecay", graphOptions).setTitle("Current Decay");


var w = renderer
	.addWrapper()
  .setWidth( 8 )
	.setPosition( 11, 1 );

w.addModule("display/graph", "vocvstime", graphOptions )
  .setTitle("Voc vs time")
  .setHeight( 400 )
  .setXAxisLabel("Time (s)");

w.addModule("display/graph", "chargesvstime", graphOptions )
  .setTitle("Charges vs time")
  .setHeight( 400 )
  .setXAxisLabel("Time (s)");

w.addModule("display/graph", "C-V", graphOptions )
  .setTitle("C-V plot")
  .setHeight( 400 )
  .setXAxisLabel("Voltage (V)");

w.addModule("display/graph", "C-t", graphOptions )
  .setTitle("Capacitance vs time")
  .setHeight( 400 )
  .setXAxisLabel("Time (s)");

module.exports = renderer;
