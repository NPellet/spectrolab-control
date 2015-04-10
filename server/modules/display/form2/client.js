

define(  [ 'js/module', 'lib/jquery.populate/index', 'lib/jquery-serialize-object/dist/jquery.serialize-object.min'], function( defaultModule ) {

	var module = function() {}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {
		var self = this;
		this.getInnerDom().on("click", "input[type=button]", function( ) {

			var d = $( this ).data();

			var formData = self.getInnerDom().serializeObject();
			self.out( "submitClicked", { submit: d, form: formData } );
		});
	}

	module.prototype.fill = function( data ) {
		this.getInnerDom().populate( data );
	}

	module.prototype.setHtml = function( html ) {
		this.getInnerDom().html( html );
	}

	module.prototype.in = {

		"formData": function( data ) {
			this.fill( data );
		},

		"formHtml": function( html ) {
			this.setHtml( html );
		}
	};

	module.prototype.setStatus = function( status ) {
console.log( status );
		if( status.formHtml ) {
			this.setHtml( status.formHtml );
		}

		if( status.formData ) {
			this.fill( status.formData );
		}
	}

	return module;

} );
