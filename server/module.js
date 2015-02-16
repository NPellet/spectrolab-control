
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


var modulePrototype = function() {};

//modulePrototype.prototype = new ();

modulePrototype.prototype = extend( events.EventEmitter.prototype, modulePrototype.prototype, {

	init: function( type, name ) {

		var module = this;
		this.locks = {};
		this.type = type;
		this.name = name;
		this.status = {};

		this.assignId();

		for( var i in this.streamOn ) {

			( function( callback ) {

				stream.moduleIn( module.id, i, ( function() { callback.apply( module, arguments ) } ) );

			} ) ( module.streamOn[ i ] );
		}

	},


	assignId: function() {

		if( ! this.id ) {
			this.id = util.uniqueId();
		}
	},


	getId: function() {
		return this.id;
	},

	streamIn: function() {},

	streamOn: {},

	streamOut: function( instruction, value ) {

		if( ! this.id ) {
			this.assignId();
		}

		stream.moduleOut( this, instruction, value );
	},

	out: function() {

		this.streamOut.apply( this, arguments );
	},

	_getModuleInfos: function() {
		return {};
	},

	getModuleInfos: function() {

		return extend(true, {
			module: {
				id: this.id,
				locked: this._locked,
			}
		}, this._getModuleInfos() );
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
				title: module.title,
				path: module.getRelativePath()
			} );
		});
	},

	renderCSS: function() {

		var self = this;


		var fPath = './server/modules/' + this.type + '/style.scss';
//console.log( './server/modules/' + this.type + '/style.scss', fs.existsSync( fPath ) );
		if( fs.existsSync( fPath )) {

			return new Promise( function( res ) {

				sass.render({
			    	data: ".module." + self.getClass() + " { " + fs.readFileSync( fPath ) + " } ",
			    	success: res,
						error: function( err ) {
							console.log( arguments );
							console.error("Error on line " + err.line + " in file " + err.file + ". Message: " + err.message );
							res();
						}
				});
			});
		}

		return " ";
	},

	getFolder: function() {
		return this.folder;
	},

	setFolder: function( folder ) {
		this.folder = folder;
	},

	setRelativePath: function( path ) {
		this.relativePath = path;
	},

	getRelativePath: function() {
		return this.relativePath;
	},

	lock: function( lockElement ) {
		var self = this;
		this.locks[ lockElement ] = true;

		if( this.isLocked() ) {
			this.streamLock();
		}

		return this;
	},

	unlock: function( lockElement ) {
		var self = this;
		this.locks[ lockElement ] = false;

		if( ! this.isLocked() ) {
			this.streamLock();
		}

		return this;
	},

	streamLock: function() {
		if( this.isLocked() ) {
			this.out( 'lock', true );
		} else {
			this.out( 'unlock', true );
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
		return this;
	},

	getClass: function() {
		return this.type.replace(/\//g, "-");
	}
});

module.exports = modulePrototype;
