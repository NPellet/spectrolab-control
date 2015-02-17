
var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

var celiv = experiment.getDeviceProcedure('celiv');

var Waveform = require('../../server/waveform');

experiment.onStart = function() {


}

experiment.onPause = function() {


}

experiment.renderer.render();
