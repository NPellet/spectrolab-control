
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
}

module.exports = renderer;
