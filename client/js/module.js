
define( [ 'io' ], function( io )  {

	var Module = function( ) {

		var self = this;


		this._isReadyPromise = new Promise( function( resolve, reject ) {
			self._isReady = resolve;
		});
	}
	
	Module.prototype.init = function() {
		this._locked = false;
		this.overlay = $( "<div />" ).addClass("overlay");
	}

	Module.prototype.setId = function( id ) {
		if( this._id ) {
			throw "Cannot reassign module id";
			return;
		}

		this._id = id;
	}

	Module.prototype.setDom = function( dom ) {
		this._dom = dom;
	}


	Module.prototype.ready = function() {
		this._isReady();
	}

	Module.prototype.out = function( instruction, value ) {

		io.write( this.id, instruction, value );
	}


	Module.prototype._setStatus = function( status ) {
		if( this.setStatus ) {
			this.setStatus( status );
		}
	}

	Module.prototype._lock = function() {

		if( this._locked ) {
			return;
		}

		this._locked = true;
		this.dom.prepend( this.overlay );

		this.overlay.css( {

			top: dom.position().top,
			left: dom.position().left,

			width: dom.width(),
			height: dom.height()

		} );

	}

	Module.prototype._unlock = function() {

		this._locked = false;
		this.overlay.remove();
	}

	return Module;

});
