
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
w.addModule("arduino/connect", "arduinoConnect").setTitle( "Arduino Status" );

w.addModule("display/button", "start").setText( "Start Voc-Decay measurement" );


var w = renderer
	.addWrapper("wrappercapa")
	.setSize( 60, 160 )
	.setPosition( 80, 10 );

w.addModule("display/graph", "vocvstime", graphOptions ).setTitle("Voc vs time").setHeight( 400 ).setXLogScale( true );


module.exports = renderer;
