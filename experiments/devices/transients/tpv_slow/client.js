
module.exports = {
  modules: {

    tpv: {
      title: "Transient photovoltage",
      path: 'display/graph',
      width: 30,
      height: 15,
      top: 2,
      left: 2
    },

    tpvtemp: {
      title: "Transient photocurrent",
      path: 'display/graph',
      width: 30,
      height: 15,
      top: 2,
      left: 2
    }
  },

  method: function( renderer ) {
    
     renderer
      .getModule("tpv")
      .setYAxisLabel( "Normalized voltage perturbation")
      .setYUnit("A")
      .setXAxisLabel( "Time" )
      .setXUnit( "s")
      .setXScientificTicks( true )
      .setYScientificTicks( true );


    renderer
      .getModule("tpvtemp")
      .setYAxisLabel( "voltage perturbation")
      .setYUnit("A")
      .setXAxisLabel( "Time" )
      .setXUnit( "s")
      .setXScientificTicks( true )
      .setYScientificTicks( true );


  }

};
