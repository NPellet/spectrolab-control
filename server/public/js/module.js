
var Module = function( id ) {

	var self = this;
	this.id = id;

	this._isReadyPromise = new Promise( function( resolve, reject ) {
		self._isReady = resolve;
	});
}

Module.allModules = [];
Module.prototype.ready = function() {

	this._isReady();
}

Module.prototype.getReadyPromise = function() {

	return this._isReadyPromise;
}

Module.prototype.streamOut = function( instruction, value ) {

	window.io.write( this.id, instruction, value );
}