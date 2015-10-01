var waveform = require("./waveform");
var extend = require("extend");


var iv = function() {
  this.iv;
};

iv.prototype.setIV = function( ivWave ) {
  this.iv = ivWave;
}

iv.prototype.getIV = function() {
  return this.iv;
}

iv.prototype.getVoc = function( direction ) {
    var iv = this._getIVDirection( direction );
    return getVoc( iv );
}

iv.prototype.getJsc = function( direction ) {
    var iv = this._getIVDirection( direction );
    return getJsc( iv );
}

iv.prototype.getFF = function( direction ) {
    var iv = this._getIVDirection( direction );
    return getFF( iv );
}

iv.prototype.getMPPV = function( direction ) {
    var iv = this._getIVDirection( direction );
    return getMPPV( iv );
}

iv.prototype.getMPPJ = function( direction ) {
    var iv = this._getIVDirection( direction );
    return getMPPJ( iv );
}

iv.prototype._getIVDirection = function( direction ) {

  return this.iv;

  switch( direction.toLowerCase() ) {

    case 'backward':
    case 'back':
    case 0:
      return this.backward;
    break;

    case 'forward':
    case 'for':
    case 1:
      return this.forward;
    break;
  }
}


function getFF( iv ) {
    var power = iv.duplicate().math( function( y, x ) {
        return y * x;
    } );

    var index = power.getMaxIndex(); // Top of the power curve
    var mpptv = iv.getXFromIndex( index );
    var mpptj = iv.getValueAt( index );

    var voc = getVoc( iv );
    var jsc = getJsc( iv );

    return mpptv * mpptj / ( voc * jsc );
}

function getMPPTJ( iv ) {
    var power = iv.duplicate().math( function( y, x ) {
        return y * x;
    } );

    var index = power.getMaxIndex(); // Top of the power curve
    return iv.getValueAt( index );
}

function getMPPTV( iv ) {
    var power = iv.duplicate().math( function( y, x ) {
        return y * x;
    } );

    var index = power.getMaxIndex(); // Top of the power curve
    return iv.getXFromIndex( index );
}


function getJsc( iv ) {

  var self = this,
      levels = iv.getXWave().findLevels( 0 );

  var currents = levels.map( function( level ) {
    return self.getValueAt( level );
  });

  return currents[ 0 ];
}

function getVoc( iv ) {

  var self = this,
      levels = iv.findLevels( 0 );

  var voltages = levels.map( function( level ) {
    return self.getValueAt( level );
  });

  return voltages[ 0 ];
}

module.exports = iv;
