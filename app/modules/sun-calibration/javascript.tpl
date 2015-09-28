

( function( ) {
	
	var dom = $("#sun-calibration-{{ module.id }}");
	
	var currentMeasured = dom.find('.current-obtained');
	var sunIntensity = dom.find('.sun-intensity');
	var currentExpected = dom.find('.current-expected');
	var submit = dom.find('.measure');

	currentExpected.on( "change", function() {

		module.out( "currentExpected", $( this ).prop( 'value' ) );

	} );

	submit.on( "click", function() {

		module.out( "measure" );
	})

	module.onMessage("referenceMeasured", function( value ) {

		value.measured = Math.round( value.measured * 1000 * 100 ) / 100 + " mA"

		currentMeasured.html( value.measured );
		sunIntensity.html( value.sunIntensity );

	} );

	module.ready();

}) ( );
