
var moduleInstance = new Module( "{{ moduleid }}" );
Module.allModules.push( moduleInstance );

( function( module ) {
	{{ js }}
}) ( moduleInstance );