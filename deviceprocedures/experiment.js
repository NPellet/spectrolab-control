
var EventEmitter = require('events').EventEmitter;
var expGlobal = require("app/experiment");
var liquid = require("liquid-node"),
	lengine = new liquid.Engine,
	fs = require('fs');

var Experiment = function() {
	this._init();
};
Experiment.prototype = new EventEmitter();


Experiment.prototype._init = function() {

	if( this.init ) { // Child init
		this.init();
	}

	this.loadConfig( this.__proto__.defaults );
}

Experiment.prototype.loadConfig = function( cfg, afterLoad ) {
	this.config = this.config || {};
	extend( true, {}, this.config, cfg );

	this.config = extend( true, {}, cfg );
	if( typeof afterLoad == "function" ) {
		afterLoad( this.config );
	}

	//this.config = cfg;
}


Experiment.prototype.progress = function( progressType, progressArguments ) {

	this.emit("progress", { type: progressType, arguments: progressArguments } );
};


Experiment.prototype.terminate = function( data ) {

	this.emit("terminated", data );
	this.loop = false;
}


Experiment.prototype.loopNext = function( ) {

	if( ! this._paused ) {
		this.loop.next();
	} else {
		this._isPaused = true;
		this.emit("paused");
	}
}

Experiment.prototype.waitAndNext = function( time ) {

	var self = this;
	this.wait( time ).then( function() {
		self.loopNext();
	} );
}

Experiment.prototype.wait = function( time ) {
	return new Promise( function( resolver, rejecter ) {
		setTimeout( resolver, time * 1000 );
	} );
}


Experiment.prototype.makeLoop = function() {
	return function*() {};
}

Experiment.prototype.pause = function() {

	var self = this;
	this._paused = true;
	return new Promise( function( resolver, rejecter ) {
		self.on("paused", function() { resovler(); });
	} );
}

Experiment.prototype.resume = function() {

	if( this._isPaused && this._paused ) {
		this.loopNext();
	} else {
		throw "Cannot resume experiment. Not yet paused"
	}
}

Experiment.prototype.run = function() {

	if( this.loop ) {
		throw "Cannot run experiment twice. Loop already existing";
	}

	var self = this;

	this.setup().then( function() {

		var generator = self.makeLoop();
		self.loop = generator();
		self.loopNext();
	} );
}


Experiment.prototype.abort = function() {

	var self = this;

	this.pause();
	this.on("paused", function() {

		self.terminate();
	});
}

Experiment.prototype.modal = function( title, text, buttonText ) {

	var html = lengine.parseAndRender( fs.readFileSync( './server/html/modal.tpl'), {

		title: title,
		text: text,
		buttonText: buttonText
	} ).then( function( html ) {
		expGlobal.streamOut( "showModal", html );
	});

		

}

Experiment.prototype.setup = function() {
	return new Promise( function( resolver ) { resolver(); } );
}

Experiment.prototype.getInstrument = function( instrument ) {
	return expGlobal.getInstrument( instrument );
}

Experiment.prototype.getId = function() {
	return this.id;
}

Experiment.prototype.setId = function( id ) {
	this.id = id;
}

module.exports = Experiment;
