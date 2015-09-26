
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
      },

      'iv-right': {
        title: "IV",
        left: 18,
        top: 1,
        width: 15 // 500px
      }

  } );


  renderer.setModulesJSON( {


    IV: {
      wrapper: 'iv',
      path: 'display/iv'
    },

    ivsetup: {
      wrapper: 'iv',
      path: 'display/form2'
    },

    ivview: {
      wrapper: 'iv-right',
      path: 'display/form2'
    }

  } );

  renderer.getModule("IV").setHeight( 300 );

}

module.exports = renderer;
