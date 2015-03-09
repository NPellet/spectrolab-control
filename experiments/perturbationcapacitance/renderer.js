
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

      CV: {
        title: "CV Plot",
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

        CV: {
          wrapper: 'CV',
          path: 'display/graph'
        },

        JDecay: {
          wrapper: 'CV',
          path: 'display/graph'
        },

        Voc: {
          wrapper: 'CV',
          path: 'display/graph'
        },

        Jsc: {
          wrapper: 'CV',
          path: 'display/graph'
        },

        Perturbation: {
          wrapper: 'CV',
          path: 'display/graph'
        }

  } );


  renderer.getModule("CV")
    .setTitle("C-V plot")
    .setHeight( 400 )
    .setXAxisLabel("Voltage (V)");

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
