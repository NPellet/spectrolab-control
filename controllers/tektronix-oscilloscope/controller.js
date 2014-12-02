
"use strict";

var net = require('net'),
	extend = require('extend'),
	fs = require('fs'),
	events = require("events"),
	path = require("path"),
	py = require("python-shell");


var options = {
  //pythonOptions: ['-m'],
  scriptPath: path.resolve( __dirname, './python-scripts/' ),
  args: ['169.254.116.155'],
  mode: "text"
};


var p = new py('test.py', options);


 p.stdout.on('data', function (data) {
  console.log( '"' + data + '"' );
  });

  p.send('*IDN?');
  p.send('DATa:SOUrce CH1');
  p.send('DATa:SOUrce?');
  p.send('DATa:ENCdg ASCii');
  p.send('WFMOutpre:BYT_Nr 8');
  
  p.send('CURVE?');
  

