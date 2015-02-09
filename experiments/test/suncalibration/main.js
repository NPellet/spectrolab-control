
var keithley = require( "../../../controllers/keithley-smu/default/controller" );
var renderer = require( "./renderer" );
var stream = require( "../../../server/stream" );
var config = require( "../../../server/config" );

var keithley = new keithley( config.instruments.keithley );

renderer.getModule( "suncalib" ).assignKeithley( keithley );
renderer.render();

stream.onClientReady( function() {

} );
