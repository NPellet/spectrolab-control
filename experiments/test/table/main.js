

var renderer = require( "./renderer" );
var stream = require( "../../../server/stream" );

renderer.render();

stream.onClientReady( function() {


	renderer
		.getModule("table")
		.addColumn( "Voc" )
		.addColumn( "Jsc" )
		.addColumn( "FF" )
		.addColumn( "PCE" )
		.addRow({ Voc: 0.9, Jsc: 16, FF: 0.4, PCE: 13.4 } );


});
