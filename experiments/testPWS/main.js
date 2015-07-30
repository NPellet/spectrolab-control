

var fs = require('fs');
var experiment = require('app/experiment');
var Waveform = require('../../server/waveform');
var itx = experiment.itx();

experiment.loadInstruments();

var cfgHtml = require("./cfgform.js");



experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;

experiment.renderer.init();
experiment.addInstrumentConnectModules();

experiment.renderer.render();


experiment.getInstrument("OBIS 422nm").on( "connected", function() {

	this.setLaserPower(0.01);
	this.setContinuousMode();
	this.turnOn();
} );