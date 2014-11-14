
process.argv.forEach( function( val, index, array ) {
  
  val = val.split('=');

  switch( val[ 0 ] ) {
  	
  	case 'experiment':

  		var exp = require('./experiments/' + val[ 1 ] + '/main');

  	break;
  }

});