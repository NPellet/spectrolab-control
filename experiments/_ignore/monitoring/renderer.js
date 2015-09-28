
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
        title: "Experiment control",
        width: 3,
        top: 1,
        left: 0
      },

      monitoringGraph: {
        title: "Monitoring",
        left: 3,
        top: 1,
        width: 15 // 500px
      },

    
  } );


  renderer.setModulesJSON( {

    monitor: {
      wrapper: 'monitoringGraph',
      path: 'display/graph'
    }
    
  } );

  renderer.getModule("monitor").setHeight( 300 );

}

module.exports = renderer;
