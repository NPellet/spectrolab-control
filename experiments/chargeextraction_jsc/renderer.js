
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

  renderer.getModule("graph").setHeight( 300 );

  renderer.getModule("graph")
    .setTitle("Q-Jsc plot")
    .setHeight( 400 )
    .setXAxisLabel("Jsc (A)")
    .setYAxisLabel("Charges (C)")
    .setYScientificTicks( true )
    .setXScientificTicks( true );


}

module.exports = renderer;
