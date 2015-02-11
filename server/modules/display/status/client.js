define( [ 'client/js/module'], function( defaultModule ) {


	function pad( val ) {
		return ( String( val ).length == 1 ) ? '0' + val : val;
	}

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() { }

	module.prototype.setStatusMessage = function( value ) {

		var dom = this.getDom().children('.statusbar');

		if( typeof value == "string" ) {

			value = {
				message: value,
				type: 'neutral'
			};
		}

		var html = value.message;

		if( value.date ) {
			var date = new Date( value.date );
			html = "[" + pad( date.getDate() ) + "." + pad( date.getMonth() ) + "." + date.getFullYear() + " " + pad( date.getHours() ) + ":" + pad( date.getMinutes() ) + ":" + pad( date.getSeconds() ) + "] : " + html;
		}

		dom.html( html );
		dom.removeClass('message-neutral message-warning message-error message-ok message-process');
		dom.addClass('message-' + value.type );
	}

	module.prototype.in = {

		"status": function( value ) {

			this.setStatusMessage( value );
		}
	};

	module.prototype.setStatus = function( status ) {

		this.setStatusMessage( status.message );
	}

	return module;

} );
