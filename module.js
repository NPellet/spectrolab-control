
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

		stream.write( this.id, message );
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
		  .parseAndRender( fs.readFileSync( this.getFolder() + '/html.tpl'), moduleTplInfos )
	},

	renderJS: function() {
		var moduleTplInfos = this.getModuleInfos();

		
		return lengine
		  .parseAndRender( fs.readFileSync( this.getFolder() + '/javascript.tpl'), moduleTplInfos )
	},

	getFolder: function() {
		return this.folder;
	},

	setFolder: function( folder ) {
		this.folder = folder;
	}
}


module.exports = modulePrototype;