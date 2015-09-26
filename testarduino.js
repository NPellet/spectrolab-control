
var SerialPort = require("serialport")

SerialPort.list(function (err, ports) {
  ports.forEach(function(port) {
    console.log(port.comName);
    console.log(port.pnpId);
    console.log(port.manufacturer);
  });
});


var Arduino = new SerialPort.SerialPort("/dev/cu.usbmodem1421", {
  baudrate: 115200,
  parity: 'none',
  dataBits: 8,
  stopBits: 1,
  flowControl: true
});

Arduino.on("data", function (data) {
  console.log("Data received: " + data );
});


Arduino.on("open", function( ) {
	console.log("Connection is open");
/*	OBISLaser.write("*IDN?\r");
	//OBISLaser.write("SOURce:AM:EXTernal DIGital\r");
	OBISLaser.write("SOURce:POWer:LEVel:IMMediate:AMPLitude 0.01\r");
	OBISLaser.write("SYSTem:INDicator:LASer OFF\r");
	OBISLaser.write("SOURce:AM:INTernal CWP\r");
	OBISLaser.write("SOURce:AM:STATe ON\r");*/

	Arduino.write("6,22;");
});