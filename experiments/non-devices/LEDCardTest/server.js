
module.exports = function( config, app, renderer ) {

  console.log( config );

  	return new Promise( function( resolver, rejecter ) {
  	
  		var arduino = app.getInstrument('arduinoDigio');
	    arduino.routeLEDToAFG( "white", "A" );

	    renderer.getModule("config").on("formChanged", function( data ) {

			arduino.routeLEDToAFG( data.form.channel, "A" );
		});

  	});
    
}
  