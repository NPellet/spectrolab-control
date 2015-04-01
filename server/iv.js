var waveform = require("./waveform");
var extend = require("extend");


var iv = function() {
    this.backward;
    this.forward;
};

iv.prototype.setBackwardScan = function( bk ) {
    this.backward = bk;
};

iv.prototype.setBackward = iv.prototype.setBackwardScan;

iv.prototype.setForwardScan = function( fw ) {
    this.forward = fw;
};

iv.prototype.setForward = iv.prototype.setForwardScan;

iv.prototype.getBackwardScan = function() {
    return this.backward;
}

iv.prototype.getForwardScan = function() {
    return this.forward;
}

iv.prototype.getBackward = iv.prototype.getBackwardScan;
iv.prototype.getForward = iv.prototype.getForwardScan;

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
