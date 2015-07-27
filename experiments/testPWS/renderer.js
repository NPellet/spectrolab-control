
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
        title: "Experiment control",
        width: 3,
        top: 1,
        left: 0
      }   
  } );

  renderer.setModulesJSON( {

  } );

}

module.exports = renderer;
