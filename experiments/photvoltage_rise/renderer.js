
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
w.addModule("tektronix-functiongenerator/connect", "afgConnect").setTitle( "AFG Connect" );

w.addModule("display/button", "start").setText( "Start PV rise measurement" ).setTitle("Measurement");


var w = renderer
	.addWrapper()
  .setWidth( 8 )
	.setPosition( 3, 1 );

w.addModule("display/graph", "vocvstime", graphOptions )
  .setTitle("Voc vs time")
  .setHeight( 600 )
  .setXAxisLabel("Time (s)");


module.exports = renderer;
