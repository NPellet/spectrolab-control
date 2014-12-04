
var renderer = require("../../../server/renderer");


var w = renderer
	.addWrapper("wrapper_graph")
	.setSize( 60, 40 )
	.setPosition( 0, 3 );

w.addModule("display/graph", "graph").setTitle( "" );
w.addModule("display/legend", "legend").setTitle( "" );


var w = renderer.addWrapper('console').setSize( 100, 2 ).setPosition( 0, 0 );
w
 .addModule("display/status", "status")
 .setTitle( "" );

module.exports = renderer;