
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
        title: "Experiment control",
        width: 3,
        top: 1,
        left: 0
      },

      iv: {
        title: "IV",
        left: 3,
        top: 1,
        width: 15 // 500px
      }

  } );


  renderer.setModulesJSON( {


    IV: {
      wrapper: 'iv',
      path: 'display/iv'
    }

  } );

  renderer.getModule("IV").setHeight( 300 );

}

module.exports = renderer;
