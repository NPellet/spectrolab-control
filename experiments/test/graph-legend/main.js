

var renderer = require( "./renderer" );
var stream = require( "../../../server/stream" );

var status = renderer.getModuleByName( "status" );

renderer
	.getModuleByName( "graph" )
	.on("graphStored", function( graphStoreId ) {

		renderer
			.getModuleByName( "legend" )
			.assignGraph( graphStoreId );
	})

renderer.render();

function randomStatus() {

	var s = [ 'ok', 'warning', 'error', 'process', 'neutral' ];

	var v = Math.round( Math.random() * 3 ) ;
	return s[ v ];

}


stream.onClientReady( function() {

	renderer.getModule("graph").setHeight( 400 );

	renderer
		.getModuleByName("graph")
		.newSerie( "someName", [1,2,3,4,5,6], {} );

		setInterval( function() {

			status.update( Math.random(), randomStatus() );

		}, 1000)


});
