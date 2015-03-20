
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

      lastPulse: {
        title: "Last pulse",
        left: 3,
        top: 1,
        width: 10 // 500px
      },

      summary1: {
        title: "Summary",
        left: 13,
        top: 1,
        width: 10 // 500px
      },

      summary2: {
        title: "Summary",
        left: 23,
        top: 1,
        width: 10 // 500px
      }

  } );


  renderer.setModulesJSON( {

    focus: {
      wrapper: 'control',
      path: 'display/button'
    },

    status: {
      wrapper: 'status',
      path: 'display/status',
    },
/*
    formConfig: {
      wrapper: 'formConfig',
      path: 'display/form',
    },
*/


    lastJDecay: {
      wrapper: 'lastPulse',
      path: 'display/graph'
    },


    lastVDecay: {
      wrapper: 'lastPulse',
      path: 'display/graph'
    },


    vocvstime: {
      wrapper: 'summary1',
      path: 'display/graph'
    },

    chargesvstime: {
      wrapper: 'summary1',
      path: 'display/graph'
    },

    chargesvsvoc: {
      wrapper: 'summary2',
      path: 'display/graph'
    },

    CV: {
      wrapper: 'summary2',
      path: 'display/graph'
    }

  } );

  renderer.getModule("lastJDecay")
    .setTitle("Current pulse")
    .setHeight( 300 )
    .setXAxisLabel("Time (s)")
    .setXLogScale( false )
    .setYAxisLabel("Current (A)");


    renderer.getModule("lastVDecay")
      .setTitle("Voltage pulse")
      .setHeight( 400 )
      .setXAxisLabel("Time (s)")
      .setYAxisLabel("Voltage (V)");


      renderer.getModule("vocvstime")
        .setTitle("Voc vs time")
        .setHeight( 400 )
        .setXAxisLabel("Time (s)")
        .setXLogScale( true )
        .setYAxisLabel("Voltage (V)");

  renderer.getModule("chargesvstime")
    .setTitle("Charges vs time")
    .setHeight( 400 )
    .setXAxisLabel("Time (s)")
    .setXLogScale( true )
    .setYAxisLabel("Charges (C)")
    .setYScientificTicks( true );

    renderer.getModule("chargesvsvoc")
      .setTitle("Q-V plot")
      .setHeight( 400 )
      .setXAxisLabel("Voltage (V)")
      .setYAxisLabel("Charges (C)")
      .setYScientificTicks( true );

      renderer.getModule("CV")
        .setTitle("C-V plot")
        .setHeight( 400 )
        .setXAxisLabel("Voltage (V)")
        .setYAxisLabel("Capacitance (F)")
        .setYScientificTicks( true );

    var schema = {
        "type": "object",
        "properties": {
            "loess_smooth": {
                "type": "number"
            }
        }
    };

    var options = {
        "fields": {
            "loess_smooth": {
              "type": "number"
            }
        }
    };

//  renderer.getModule("formConfig").setSchema( schema ).setOptions( options );

}

module.exports = renderer;
