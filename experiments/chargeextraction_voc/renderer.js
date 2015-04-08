
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
        title: "Experiment control",
        width: 3,
        top: 1,
        left: 0
      },

      q: {
        title: "Charge extraction",
        left: 3,
        top: 1,
        width: 15 // 500px
      }

  } );


  renderer.setModulesJSON( {

    graph: {
      wrapper: 'q',
      path: 'display/graph'
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
