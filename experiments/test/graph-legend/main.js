

var renderer = require( "./renderer" );
var stream = require( "../../../server/stream" );

renderer
	.getModuleByName( "graph" )
	.on("graphStored", function( graphStoreId ) {

		renderer
			.getModuleByName( "legend" )
			.assignGraph( graphStoreId );

	})

renderer.render();


stream.onClientReady( function() {

	renderer
		.getModuleByName("graph")
		.newSerie( "someName", [1,2,3,4,5,6], {} );

});
