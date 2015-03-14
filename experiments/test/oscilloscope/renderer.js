
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
        title: "Experiment control",
        width: 3,
        top: 1,
        left: 0
      },

      scopeGraph: {
        title: "Summary",
        left: 3,
        top: 1,
        width: 10,
        height: 10 // 500px
      },

  } );


  renderer.setModulesJSON( {

    oscilloscope: {
      wrapper: 'scopeGraph',
      path: 'display/graph'
    }

  } );

}

module.exports = renderer;
