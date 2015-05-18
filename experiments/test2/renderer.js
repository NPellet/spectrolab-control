
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
        title: "Experiment control",
        width: 3,
        top: 1,
        left: 0
      },

      test: {
        title: "test",
        left: 3,
        top: 1,
        width: 15 // 500px
      }

  } );


  renderer.setModulesJSON( {


    test: {
      wrapper: 'test',
      path: 'instruments/keithley-smu/bias'
    },

    test2: {
      wrapper: 'test',
      path: 'instruments/tektronix-functiongenerator/pulse'
    }


  } );

}

module.exports = renderer;
