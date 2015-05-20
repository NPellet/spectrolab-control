
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
        title: "Experiment control",
        width: 3,
        top: 1,
        left: 0
      },

      results: {
        title: "Small transients results",
        left: 3,
        top: 1,
        width: 10 // 500px
      },

      config: {
        title: "Config",
        left: 13,
        top: 1,
        width: 10 // 500px
      }

  } );


  renderer.setModulesJSON( {

      iv: {
        wrapper: 'results',
        path: 'display/iv'
      },

      jscDecay: {
        wrapper: 'results',
        path: 'display/graph'
      },

      vocDecay: {
        wrapper: 'results',
        path: 'display/graph'
      },

      pulse: {
        wrapper: 'config',
        path: 'instruments/tektronix-functiongenerator/pulse'
      }

  } );
}

module.exports = renderer;
