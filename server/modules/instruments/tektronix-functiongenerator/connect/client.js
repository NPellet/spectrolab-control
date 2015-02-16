
define( [ 'client/js/module'], function( defaultModule ) {

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {

		var self = this;
		this.button = this.getDom().find('.button');

		var connect = $( "#connect-" + this.getId() );

		this.connect = connect;

		connect.on( 'click', function() {
			self.out( "connect" );
		} );
	}

	module.prototype.in = {

		"connected": function( text ) {

			var connect = this.connect;
			connect.prop( 'value', 'Disconnect' );
			connect.addClass('green');
		},

		"disconnected": function( text ) {

			var connect = this.connect;
			connect.prop( 'value', 'Connect' );
			connect.removeClass('green');
		}
	};

	module.prototype.setStatus = function( status ) {

		var connect = this.connect;

		if( status.connected ) {
			connect.prop( 'value', 'Disconnect' );
			connect.addClass('connected');
		} else {
			connect.prop( 'value', 'Connect' );
			connect.removeClass('connected');
		}
	}

	return module;

} );
