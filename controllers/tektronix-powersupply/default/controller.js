
"use strict";

var
  extend = require('extend'),
  events = require("events"),
  pythonShell = require("python-shell"),
  promise = require("bluebird"),
  path = require("path");

var InstrumentController = require("../../visainstrumentcontroller");

var TektronixPWS = function( params ) {
  this.params = params;
  this.connected = false;
  this.queue = [];
  this.connectQueue = [];

  var self = this;
};


TektronixPWS.prototype = new InstrumentController();

TektronixPWS.prototype.setVoltageLimit = function( voltage ) {
  return this.command("SOURce:VOLTage:LEVel " + getVoltage( voltage ) );
}

TektronixPWS.prototype.setCurrentLimit = function( voltage ) {
  return this.command("SOURce:CURRent:LEVel " + getCurrent( voltage ) );
}

TektronixPWS.prototype.turnOn = function() {
  return this.command("SOURce:OUTPut:STATe ON");
}

TektronixPWS.prototype.turnOff = function() {
  return this.command("SOURce:OUTPut:STATe OFF");
}

function getVoltage( v ) {
  return parseFloat( v ) + "V";
}

function getCurrent( a ) {
  return parseFloat( a ) + "A";
}

module.exports = TektronixPWS;