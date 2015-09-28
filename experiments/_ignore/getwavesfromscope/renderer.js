
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
        title: "Oscilloscope channels",
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

      ch1: {
        wrapper: 'results',
        path: 'display/graph'
      },

      ch2: {
        wrapper: 'results',
        path: 'display/graph'
      },

      ch3: {
        wrapper: 'results',
        path: 'display/graph'
      },

      ch4: {
        wrapper: 'results',
        path: 'display/graph'
      },


      config: {
        wrapper: 'config',
        path: 'display/form2'
      }

  } );
}

module.exports = renderer;
