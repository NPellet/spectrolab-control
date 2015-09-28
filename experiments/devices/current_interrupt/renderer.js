
var renderer = require("app/renderer");

renderer.modules = function() {

  renderer.setModulesJSON( {

    graph: {
      wrapper: 'q',
      path: 'display/graph',
      top: 0,
      left: 0,
      height: 20
    },

    lastvoltage: {
      wrapper: 'q',
      path: 'display/graph'
      top: 20,
      height: 20,
      left: 0
    }

  } );

  renderer.getModule("graph")
    .setTitle("Q-Voc plot")
    .setHeight( 400 )
    .setXAxisLabel("Voltage (V)")
    .setYAxisLabel("Charges (C)")
    .setYScientificTicks( true );
}

module.exports = renderer;
