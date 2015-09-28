
var renderer = require("app/renderer");

renderer.init = function() {

  renderer.setWrappersJSON( {

      control: {
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

      formConfig: {
        title: "Experiment config",
        left: 3,
        top: 1,
        width: 10
      },

      IMVSIMPS: {
        title: "IMVS / IMPS drive",
        left: 3,
        top: 1,
        width: 10 // 500px
      },

      IV: {
        title: "IV",
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

    drive: {
      wrapper: 'IMVSIMPS',
      path: 'display/graph'
    },

    response: {
      wrapper: 'IMVSIMPS',
      path: 'display/graph'
    },

    IV: {
      wrapper: 'IV',
      path: 'display/graph'
    }


  } );
//  renderer.getModule("formConfig").setSchema( schema ).setOptions( options );

}

module.exports = renderer;
