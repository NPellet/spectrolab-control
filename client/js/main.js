
requirejs.config({

	baseUrl: '../../',
	paths: {
		'jquery': 'client/js/lib/jquery.min',
		'jsgraph': 'client/js/lib/jsgraph.min'
	}
});

require( [ 'jquery', 'client/js/modulefactory', 'client/js/io' ] , function( $, ModuleFactory, IO ) {


	ModuleFactory.parseDom( document );
	IO.connect();

} );
