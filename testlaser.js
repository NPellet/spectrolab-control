
var SerialPort = require("serialport").SerialPort
var OBISLaser = new SerialPort("/dev/cu.usbmodem141411", {
  baudrate: 115200,
  parity: 'none',
  dataBits: 8,
  stopBits: 1,
  flowControl: false
});

OBISLaser.on("data", function (data) {
  console.log("Data received: " + data );
});


OBISLaser.on("open", function( ) {
	console.log("Connection is open");
	OBISLaser.write("*IDN?\r");
	//OBISLaser.write("SOURce:AM:EXTernal DIGital\r");
	OBISLaser.write("SOURce:POWer:LEVel:IMMediate:AMPLitude 0.01\r");
	OBISLaser.write("SYSTem:INDicator:LASer OFF\r");
	OBISLaser.write("SOURce:AM:INTernal CWP\r");
	OBISLaser.write("SOURce:AM:STATe ON\r");
});