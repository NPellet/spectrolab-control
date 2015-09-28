

var fs = require('fs');
var experiment = require('app/experiment');
var Waveform = require('../../server/waveform');
var itx = experiment.itx();
var extend = require("extend");

experiment.loadInstruments();


experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;

experiment.renderer.init();
experiment.addInstrumentConnectModules();

var DiffCapa = experiment.loadProcedure('differentialcapacitance');
var ivs = {};


DiffCapa.on("progress", function( progress ) {

} );

experiment.renderer.render();
