
define( [ 'js/module'], function( defaultModule ) {

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {

		var self = this;
		this.form = this.getDom().find('.afg-command-form');
		this.input = this.form.find(".command");

		this.form.on("submit", function (e ) {

			e.preventDefault();
			self.sendCommand( self.input.prop( 'value' ) );

		});
	}

	module.prototype.in = {

		"response": function( text ) {
			
			this.form.find('.response').find('span').html( text );

		}
	};

	module.prototype.sendCommand = function( cmd ) {
		this.out( "command", cmd );
		this.setCommand( cmd );
	}

	module.prototype.setCommand = function( cmd ) {
		this.form.find('.query').find('span').html( cmd );
		this.form.find('.response').find('span').empty( );
	}

	module.prototype.setStatus = function( status ) {

		if( status.query ) {
			this.setCommand( query );
		}

		if( status.response ) {
			this.form.find('.response').find('span').html( status.response );
		}
	}

	return module;

} );
