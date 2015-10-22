
module.exports = {
  modules: {

    graph: {
      title: "Charges",
      path: 'display/graph',
      width: 30,
      height: 15,
      top: 2,
      left: 2
    },


    lastqextr: {
      title: "Last charge extraction trace",
      path: 'display/graph',
      width: 30,
      height: 15,
      top: 32,
      left: 2
    }

  },

  method: function( renderer ) {
    
    renderer.getModule("graph")
      .setXScientificTicks( true )
      .setYScientificTicks( true )
      .setXUnit( "V" )
      .setYUnit( "C" )
      .setYLogScale( true )


    renderer.getModule("lastqextr")
      .setXScientificTicks( true )
      .setYScientificTicks( true )
      .setXUnit( "s" )
      .setYUnit( "V" )
      .setXLogScale( true )


  }

};
