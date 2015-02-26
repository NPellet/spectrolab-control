
define( [ 'js/module'], function( defaultModule ) {

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {

		var self = this;
		this.button = this.getDom().find('.button');

		this.button.on('click', function() {
			self.out('click');
		});

	}

	module.prototype.in = {

		"setText": function( text ) {
			console.log( this, this.status );
			this.status.text = text;
			this.button.attr( 'value', this.status.text );
		},

		"setColor": function( color ) {

			this.status.color = color;
			this.button.attr( 'data-color', this.status.color );
		}
	};

	module.prototype.setStatus = function( status ) {

		this.button.attr( 'value', status.text );
		this.button.attr( 'data-color', status.color );
	}

	return module;

} );
