
module.exports = function( config, app, renderer ) {

  
  	return new Promise( function( resolver, rejecter ) {
  	
		var keithley = app.getInstrument('KeithleySMU');

		return keithley.connect().then( function() {
			console.log('Uploading scripts...');
			return keithley.uploadScripts();
		});

  	});
    
}
  