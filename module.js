
var stream = require("./stream"),
	fs = require('fs'),
	util = require("./util")
	events = require("events"),
	extend = require("extend");

var liquid = require("liquid-node"),
	lengine = new liquid.Engine

var modulePrototype = {
	
	init: function( type ) {

		var module = this;
		this._locked = false;
		this.type = type;
		
		this.assignId();

		stream.onMessage( this.id, function( message ) {

			module.streamIn( message );
		} );
	},

	assignId: function() {
		this.id = util.uniqueId();
	},


	streamOut: function( method, value ) {

		if( ! this.id ) {
			this.assignId();
		}

		stream.write( this.id, {

			method: method,
			value: value
		} );
	},

	getModuleInfos: function() {
		return {
			module: {
				id: this.id,
				locked: this._locked
			}
		};
	},

	renderHTML: function() {
		var module = this;
		var moduleTplInfos = this.getModuleInfos();

		return lengine.parseAndRender( fs.readFileSync( this.getFolder() + '/html.tpl'), moduleTplInfos ).then( function( html ) {

			return lengine.parseAndRender( fs.readFileSync( './html/module.tpl' ), { content: html, locked: module._locked, id: module.id, type: module.type } );
		});
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
	},

	lock: function() {

		this._locked = true;

		if( stream.isReady() ) {
			this.streamOut( 'lock', true );
		}
	},

	unlock: function() {

		this._locked = false;

		if( stream.isReady( ) ) {
			this.streamOut( 'lock', false );
		}
	}
}

modulePrototype = extend( modulePrototype, events.EventEmitter.prototype );
module.exports = modulePrototype;