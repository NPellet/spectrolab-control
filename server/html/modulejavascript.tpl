
var moduleInstance = new Module();
Module.allModules.push( moduleInstance );

( function( module ) {
	{{ js }}
}) ( moduleInstance );