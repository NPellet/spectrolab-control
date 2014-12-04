
var stream = require("./stream"),
	fs = require('fs'),
	util = require("./util")
	events = require("events"),
	extend = require("extend"),
	path = require("path"),
	sass = require('node-sass'),
	Promise = require('bluebird');

var liquid = require("liquid-node"),
	lengine = new liquid.Engine

var modulePrototype = {
	
	init: function( type, name ) {

		var module = this;
		this.locks = {};
		this.type = type;
		this.name = name;
		
		this.assignId();

		for( var i in this.streamOn ) {

			( function( callback ) {

				stream.onMessage( module.id, i, ( function() { callback.apply( module, arguments ) } ) );

			} ) ( module.streamOn[ i ] );
		}
	
	},

	assignId: function() {
		this.id = util.uniqueId();
	},

	streamIn: function() {},
	streamOn: {},	

	streamOut: function( instruction, value ) {

		if( ! this.id ) {
			this.assignId();
		}
		stream.write( this.id, instruction, value );
	},

	_getModuleInfos: function() {
		return {
			module: {
				id: this.id,
				locked: this._locked,
			}
		};
	},

	getModuleInfos: function() {
		return this._getModuleInfos();
	},

	renderHTML: function() {
		var module = this;
		var moduleTplInfos = this.getModuleInfos();

		return lengine.parseAndRender( fs.readFileSync( path.resolve( this.getFolder(), 'html.tpl') ), moduleTplInfos ).then( function( html ) {

			return lengine.parseAndRender( fs.readFileSync( './server/html/module.tpl' ), { 

				content: html,
				locked: module._locked,
				id: module.id,
				type: module.type,
				class: module.getClass(),
				title: module.title
			} );
		});
	},

	renderJS: function() {
		var moduleTplInfos = this.getModuleInfos(),
			self = this;

		return lengine
		  	.parseAndRender( 
		  		fs.readFileSync( 
		  			path.resolve( this.getFolder(), 'javascript.tpl')
		  		),
		  		moduleTplInfos ).then( function ( js ) {

					return lengine.parseAndRender( fs.readFileSync( './server/html/modulejavascript.tpl' ), { 
						js: js,
						moduleid: self.id,
						type: self.type,
						name: self.name
					} );
			  });
	},

	renderCSS: function() {

		var fPath = './server/modules/' + this.type + '/style.scss';
//console.log( './server/modules/' + this.type + '/style.scss', fs.existsSync( fPath ) );
		if( fs.existsSync( fPath )) {

			return new Promise( function( res ) {

				sass.render({
			    	file: fPath,
			    	success: res
				});
			});
		}

		return "";
	},

	getFolder: function() {
		return this.folder;
	},

	setFolder: function( folder ) {
		this.folder = folder;
	},

	lock: function( lockElement ) {

		this.locks[ lockElement ] = true;

		if( this.isLocked() && stream.isReady() ) {
			this.streamOut( 'lock', true );
		}
	},

	unlock: function( lockElement ) {

		this.locks[ lockElement ] = false;

		if( ! this.isLocked() && stream.isReady( ) ) {
			this.streamOut( 'lock', false );
		}
	},

	isLocked: function() {

		for( var i in this.locks ) {
			if( this.locks[ i ] ) {
				return true;
			}
		}

		return false;
	},

	setTitle: function( title ) {
		this.title = title;
	},

	getClass: function() {
		return this.type.replace("/", "-");
	}
}

modulePrototype = extend( modulePrototype, events.EventEmitter.prototype );

module.exports = modulePrototype;
