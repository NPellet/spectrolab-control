
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
        top: 10,
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

    lastJDecay: {
      wrapper: 'lastPulse',
      path: 'display/graph'
    },

    pulses: {
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

    "C-V": {
      wrapper: 'summary2',
      path: 'display/graph'
    },

    "C-t": {
      wrapper: 'summary2',
      path: 'display/graph'
    }

  } );

  renderer.getModule("vocvstime")
    .setTitle("Voc vs time")
    .setHeight( 400 )
    .setXAxisLabel("Time (s)")
    .setXLogScale( true );

  renderer.getModule("chargesvstime")
    .setTitle("Charges vs time")
    .setHeight( 400 )
    .setXAxisLabel("Time (s)")
    .setXLogScale( true );

  renderer.getModule("C-V")
    .setTitle("C-V plot")
    .setHeight( 400 )
    .setXAxisLabel("Voltage (V)");

    renderer.getModule("C-t")
      .setTitle("Capacitance vs time")
      .setHeight( 400 )
      .setXAxisLabel("Time (s)")
      .setXLogScale( true );

      renderer.getModule("pulses")
        .setTitle("Number of pulses")
        .setHeight( 200 )
        .setXAxisLabel("Time (s)")
        .setXLogScale( true );


    var schema = {
        "type": "object",
        "properties": {
            "timebase": {
                "type": "array",

                "items": {
                "title": "Timebase for current",
                "type": "object",
                "properties": {
                    "timebase": {
                        "title": "Pulse width",
                        "type": "select",
                        "enum": renderer.experiment.getInstruments()[ "gould-oscilloscope" ].instrument.getAvailableTimebasesNb().map( function( val ) { return val.toString(); } ),

                    },
                    "voltscale": {
                        "title": "Voltage scale of CH2",
                        "type": "select",
                        "enum": renderer.experiment.getInstruments()[ "gould-oscilloscope" ].instrument.getAvailableVoltScaleNb().map( function( val ) { return val.toString(); } )
                    }
                }
            }
            }
        }
    };


    var options = {
        "fields": {
            "timebase": {
              "type": "array",
              "fields": {
                "item": {
                  "fields": {
                    "timebase": {
                      "optionLabels": renderer.experiment.getInstruments()[ "gould-oscilloscope" ].instrument.getAvailableTimebasesTxt()
                    },

                    "voltscale": {
                      optionLabels: renderer.experiment.getInstruments()[ "gould-oscilloscope" ].instrument.getAvailableVoltScaleTxt()
                    }
                  }
                }
              }
            }
        }
    };

//  renderer.getModule("formConfig").setSchema( schema ).setOptions( options );

}

module.exports = renderer;
