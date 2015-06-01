
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
        title: "Experiment control",
        width: 3,
        top: 1,
        left: 0
      },

      mppt: {
        title: 'MPPT Current',
        width: 10,
        top: 1,
        left: 3
      }

  } );


  renderer.setModulesJSON( {

    ivst: {
      wrapper: 'mppt',
      path: 'display/graph'
    },
    vvst: {
      wrapper: 'mppt',
      path: 'display/graph'
    },
    ivsv: {
      wrapper: 'mppt',
      path: 'display/graph'
    },
    pvst: {
      wrapper: 'mppt',
      path: 'display/graph'
    }
  });

  renderer.getModule('ivst').setXAxisLabel('time (s)').setYAxisLabel('Current (A)').setHeight(250);
  renderer.getModule('vvst').setXAxisLabel('time (s)').setYAxisLabel('Voltage (V)').setHeight(250);
  renderer.getModule('ivsv').setXAxisLabel('Voltage (V)').setYAxisLabel('Current (A)').setHeight(250);
  renderer.getModule('pvst').setXAxisLabel('time (s)').setYAxisLabel('Power (W)').setHeight(250);
}




module.exports = renderer;
