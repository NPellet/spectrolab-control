
define( [ 'js/io' ], function( io )  {

	var Module = function( ) { }

	Module.prototype.init = function() {
		this._locked = false;
		this.status = {};
		this.overlay = $( "<div />" ).addClass("overlay");
	}

	Module.prototype.setId = function( id ) {
		if( this._id ) {
			throw "Cannot reassign module id";
			return;
		}

		this._id = id;
	}

	Module.prototype.getId = function() {
		return this._id;
	}

	Module.prototype.setDom = function( dom ) {
		this._dom = dom;
	}

	Module.prototype.getDom = function( dom ) {
		return this._dom;
	}


	Module.prototype.ready = function() {
		this._isReady();
	}

	Module.prototype.out = function( instruction, value ) {

		io.write( this._id, instruction, value );
	}


	Module.prototype._setStatus = function( status ) {
		if( this.setStatus ) {
			this.setStatus( status );
		}
	}

	Module.prototype.getStatus = function( ) {

		this.out( "getStatus", true );
	}

	Module.prototype._lock = function() {

		if( this._locked ) {
			return;
		}

		this._locked = true;
		this._dom.prepend( this.overlay );

		var dom = this._dom;

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

	Module.prototype._receive = function( instruction, value ) {

		if( this.__proto__.in[ instruction ] ) {
			this.__proto__.in[ instruction ].call( this, value );
		}
	}

	return Module;
});
