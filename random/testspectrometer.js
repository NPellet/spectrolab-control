
var serialPort = require("serialport");
serialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});

/*

var SerialPort = require("serialport").SerialPort
var MonoChromator = new SerialPort("/dev/tty.usbmodem1411", {
  baudrate: 9600,
  parity: 'none',
  dataBits: 8,
  stopBits: 1,
  flowControl: false
});

MonoChromator.on("data", function (data) {
  console.log("Data received: " + data );
});


MonoChromator.on("open", function( ) {
	console.log("Connection is open");
	OBISLaser.write("*IDN?\r");
	
});*/