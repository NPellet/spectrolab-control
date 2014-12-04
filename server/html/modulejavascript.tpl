/*
 *	Module
 *	Type: {{ type }}
 *	Name: {{ name }}
 */

( function() {
	
	// Create a new module
	var moduleInstance = new Module( "{{ moduleid }}" );

	// Add the module to the existing stack
	Module.allModules.push( moduleInstance );

	// Prints out its code
	( function( module ) {
		{{ js }}
	}) ( moduleInstance );

}) ();

