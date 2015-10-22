
module.exports = {
  modules: {

    tpc: {
      title: "Transient photocurrent",
      path: 'display/graph',
      width: 30,
      height: 15,
      top: 2,
      left: 2
    },

    tpctemp: {
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
      .getModule("tpc")
      .setYAxisLabel( "Normalized current perturbation")
      .setYUnit("V")
      .setXAxisLabel( "Time" )
      .setXUnit( "s")
      .setXScientificTicks( true )
      .setYScientificTicks( true );


    renderer
      .getModule("tpctemp")
      .setYAxisLabel( "current perturbation")
      .setYUnit("V")
      .setXAxisLabel( "Time" )
      .setXUnit( "s")
      .setXScientificTicks( true )
      .setYScientificTicks( true );

  }

};
