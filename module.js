
var stream = require("./stream"),
	fs = require('fs'),
	util = require("./util");

var liquid = require("liquid-node"),
	lengine = new liquid.Engine

var modulePrototype = {
	
	init: function() {

		var module = this;
		this.assignId();

		stream.onMessage( this.id, function( message ) {

			module.streamIn( message );
		} );
	},

	assignId: function() {
		this.id = util.uniqueId();
	},


	streamOut: function( message ) {

		if( ! this.id ) {
			this.assignId();
		}

		var json = {
			moduleid: this.id,
			message: message
		}

		stream.write( JSON.stringify( json ) );
	},

	getModuleInfos: function() {
		return {
			module: {
				id: this.id
			}
		};
	},

	renderHTML: function() {
		var moduleTplInfos = this.getModuleInfos();
		return lengine
		  .parseAndRender( fs.readFileSync('./html.tpl'), moduleTplInfos )
	},

	renderJS: function() {
		var moduleTplInfos = this.getModuleInfos();
		return lengine
		  .parseAndRender( fs.readFileSync('./javascript.tpl'), moduleTplInfos )
	}	
}


exports = modulePrototype;