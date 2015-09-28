
require.config({
    "packages": [
        {
            "name": "handlebars",
            "location": "lib/handlebars",
            "main": "handlebars"
        },
        
        {
            "name": "alpaca",
            "location": "lib/alpaca/dist/alpaca/web",
            "main": "alpaca"
        }
    ],
    "shim": {
        "bootstrap": ["jquery"],
        "handlebars": {
            "exports": "Handlebars"
        }
    }
});

loadCss('client/lib/alpaca/dist/alpaca/web/alpaca.min.css');

define( [ 'jquery', 'js/module', 'alpaca'], function( $, defaultModule ) {

	var module = function() {
		this.status = {};
	}

	module.prototype = new defaultModule();

	module.prototype.onDomReady = function() {

		var self = this;
		
	}

	module.prototype.setSchema = function() {

		this.redoForm();
	}

	module.prototype.setOptions = function() {

		this.redoForm();
	}


	module.prototype.setData = function() {

		this.redoForm();
	}


	module.prototype.redoForm = function() {
		
	    var data = {};
	    var self = this;

	    self.status.options.form = {
         	"onChange": function( ) {
         		console.log(this.getValue());

         	},
         	"change": function( ) {
         		console.log(this.getValue());

         	},
            "buttons": {
                "submit": {
                    "title": "Validate",
                    "click": function() {
                        var value = this.getValue();
                        self.out( "formValue", value );
                    }
                }
            }
        }


		$( this.getDom() ).find('.form').empty().alpaca({
		    "data": self.status.data,
		    "schema": self.status.schema,
		    "options": self.status.options,
		    "type": "create",
		    "view": "web-edit"
		});
		
	}

	module.prototype.in = {

		"setSchema": function( text ) {
			this.status.schema = schema;
			this.setSchema();
		},


		"setOptions": function( options ) {
			this.status.options = options;
			this.setOptions();
		},


		"setData": function( data ) {
			this.status.data = data;
			this.setData();
		},

		"setStatus": function( color ) {

			this.status.color = color;
			this.button.attr( 'data-color', this.status.color );
		}
	};

	module.prototype.setStatus = function( status ) {

		this.status = status;

		console.log( status );
		this.redoForm();
	}

	return module;

} );
