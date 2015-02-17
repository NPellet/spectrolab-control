
var renderer = require("app/renderer");



renderer.setWrappersJSON( {

    control: {
      special: "connect",
      title: "Experiment control",
      width: 3,
      top: 1,
      left: 0
    },

    status: {
      top: 0,
      left: 0,
      width: "*"
    },

    lastPulse: {
      title: "Last pulse",
      left: 3,
      top: 1,
      width: 10 // 500px
    },

    summary: {
      title: "Summary",
      left: 13,
      top: 1,
      width: 10 // 500px
    }

} );


renderer.setModulesJSON( {

  status: {
    wrapper: 'status',
    path: 'display/status',
  },

  lastVDecay: {
    wrapper: 'lastPulse',
    path: 'display/graph'
  },

  lastJDecay: {
    wrapper: 'lastPulse',
    path: 'display/graph'
  },


  vocvstime: {
    wrapper: 'summary',
    path: 'display/graph'
  },

  chargesvstime: {
    wrapper: 'summary',
    path: 'display/graph'
  },

  "C-V": {
    wrapper: 'summary',
    path: 'display/graph'
  },

  "C-t": {
    wrapper: 'summary',
    path: 'display/graph'
  }

} );

renderer.getModule("vocvstime")
  .setTitle("Voc vs time")
  .setHeight( 400 )
  .setXAxisLabel("Time (s)");

renderer.getModule("chargesvstime")
  .setTitle("Charges vs time")
  .setHeight( 400 )
  .setXAxisLabel("Time (s)");

renderer.getModule("C-V")
  .setTitle("C-V plot")
  .setHeight( 400 )
  .setXAxisLabel("Voltage (V)");

renderer.getModule("C-t")
  .setTitle("Capacitance vs time")
  .setHeight( 400 )
  .setXAxisLabel("Time (s)");

module.exports = renderer;
