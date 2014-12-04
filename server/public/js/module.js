
var Module = function() {

	var self = this;
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