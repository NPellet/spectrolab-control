
var extend = require("extend");
var renderer = require("../../server/renderer");

extend( renderer );

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

    celiv: {
      title: "Last acquired CELIV",
      left: 3,
      top: 1,
      width: 10 // 500px
    }

} );


renderer.setModulesJSON( {

  status: {
    wrapper: 'status',
    path: 'display/status',
  },

  start: {
    wrapper: 'control',
    path: 'display/button'
  },

  celiv: {
    wrapper: 'celiv',
    path: 'display/graph'
  }

} );


module.exports = renderer;
