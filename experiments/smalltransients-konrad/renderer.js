
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
        title: "Experiment control",
        width: 5,
        top: 1,
        left: 0
      },

      results: {
        title: "Small transients results",
        left: 5,
        top: 1,
        width: 10 // 500px
      }

  } );


  renderer.setModulesJSON( {

      iv: {
        wrapper: 'results',
        path: 'display/iv'
      },

      jscTransient: {
        wrapper: 'results',
        path: 'display/graph'
      }

  } );
}

module.exports = renderer;
