
var renderer = require("../../../server/renderer");


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
  .setSize( 100, 3 )
  .setPosition( 2, 2 );

w.addModule("display/status", "status");



var w = renderer
  .addWrapper()
  .setTitle("Experiment control")
  .setSize( 20, 40 )
  .setPosition( 2, 10 );

w.addModule("gould/connect", "gouldConnect").setTitle( "Gould Status" );
w.addModule("keithley/connect", "keithleyConnect").setTitle( "Keithley Status" );
w.addModule("display/button", "start").setText( "Start capacitance measurement" );
w.addModule("display/button", "focus").setText( "Focus on point: " );



var w = renderer
  .addWrapper("wrapper_table")
  .setTitle("Experiment control")
  .setSize( 20, 40 )
  .setPosition( 2, 10 );

w.addModule("gould/connect", "gouldConnect").setTitle( "Gould Status" );
w.addModule("keithley/connect", "keithleyConnect").setTitle( "Keithley Status" );
w.addModule("display/button", "start").setText( "Start capacitance measurement" );
w.addModule("display/button", "focus").setText( "Focus on point: " );



var w = renderer
	.addWrapper("wrappergraph")
	.setSize( 40, 40 )
	.setPosition( 40, 10 );

w.addModule("display/graph", "vdecay", graphOptions).setTitle("Voltage Decay");
w.addModule("display/graph", "jdecay", graphOptions).setTitle("Current Decay");


var w = renderer
	.addWrapper("wrappercapa")
	.setSize( 60, 160 )
	.setPosition( 80, 10 );

w.addModule("display/graph", "vocvstime", graphOptions ).setTitle("Voc vs time").setHeight( 400 );
w.addModule("display/graph", "chargesvstime", graphOptions ).setTitle("Charges vs time").setHeight( 400 );
w.addModule("display/graph", "C-V", graphOptions ).setTitle("C-V plot").setHeight( 400 );
w.addModule("display/graph", "C-t", graphOptions ).setTitle("Capacitance vs time").setHeight( 400 );






module.exports = renderer;
