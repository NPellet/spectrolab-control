
var renderer = require("app/renderer");

renderer.init = function() {


  renderer.setWrappersJSON( {

      control: {
        special: "connect",
        title: "Experiment control",
        width: 3,
        top: 0,
        left: 0
      },

      results: {
        title: "Results",
        left: 3,
        top: 0,
        width: 10 // 500px
      }

  } );


  renderer.setModulesJSON( {


    VocDecay: {
      wrapper: 'results',
      path: 'display/graph'
    }
  } );

  renderer.getModule("VocDecay").setHeight(400).setYAxisLabel("Voc (V)").setXAxisLabel("Time (s)").setXLogScale( true );

}

module.exports = renderer;
