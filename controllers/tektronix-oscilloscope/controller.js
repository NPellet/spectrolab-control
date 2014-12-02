
"use strict";

var net = require('net'),
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	py = require("python-shell");


var options = {
  //pythonOptions: ['-m'],
  scriptPath: path.resolve( __dirname, './python/' ),
  args: ['12.12.12.12']
};

py.run('vxi11.py', options, function (err, results) {
  if (err) throw err;
  // results is an array consisting of messages collected during execution
  console.log('results: %j', results);
});

