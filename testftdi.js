
var ftdi = require('ftdi');

ftdi.find(function(err, devices) {console.log(devices)});
/*

    // Set Baud rate to 9600
    ftStatus = myFtdiDevice.SetBaudRate(9600);

    // Set FT245RL to synchronous bit-bang mode, used on sainsmart relay board
    myFtdiDevice.SetBitMode(0xFF, FTD2XX_NET.FTDI.FT_BIT_MODES.FT_BIT_MODE_SYNC_BITBANG);
    // Switch off all the relays
    myFtdiDevice.Write(startup, 1, ref bytesToSend);
*/



var settings = {
  'baudrate': 9600,
  'databits': 8,
  'stopbits': 1,
  'parity'  : 'none',
  bitmask: 0xFF,
  bitmode: 0x04 // Synchronous bit mode
};

var currentState;


var thedevice;

ftdi.find(function(err, devices){


  var device = new ftdi.FtdiDevice(devices[0]);
  thedevice = device;
  device.open(settings, function( err ) {

	console.log('connected');
	currentState = 0x00;

	 device.write([ currentState ], function(err) {


		function set() {

			setTimeout( function() {

				var pin = Math.floor(Math.random() * 8) + 1
				var state = Math.round(Math.random());
console.log( pin, state );
				switchRelay( pin, state, function() {
					console.log('Executed');
					set();

				} );



			}, 1000 );
		}

		set();
	  });

	});

});
