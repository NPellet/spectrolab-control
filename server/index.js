/*
var keithley = require( "./keithley/controller" );
var keithley = new keithley( {
	port: 5030,
	host: '128.178.56.5'
} );

keithley.connect( function() { } );

*/

process.argv.forEach( function( val, index, array ) {
  
  val = val.split('=');
  switch( val[ 0 ] ) {
  	
  	case 'experiment':
  		global.expFolder = './experiments/' + val[ 1 ];
  		var exp = require( global.expFolder + '/main' );
  	break;
  }

} );
