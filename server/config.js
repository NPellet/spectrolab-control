var config = {

	instruments: {
		keithley: {
			host: '169.254.0.1',
			port: '5025'
		},

		gouldOscilloscope: {
			baudrate: 19200,
			host: '/dev/tty.USA19H142P1.1'
		},

		arduino: {
			baudrate: 115200,

			whiteLightLED: {

				"LEDType": "LuxeonStar REBEL White 5650K",
				"Disposition": "Array of 3x3",

				"sunLevels": [ 1.996, 1, 0.545, 0.24, 0.1123, 0.464, 0.191, 0.0086, 0.0031, 0.0016, 0.0005, 0.0003, 0.0002, 0 ],

				"arduinoAnalogValue": [ 2172,2076,2022,1970,1933,1896,1862,1832,1794,1768,1736,1712,1698,0 ],
				"arduinoAnalogPin": 0
			}
		},


		functionGenerator: {

			host: '192.168.0.100',
			port: '810'
		}


	},


};


module.exports = config;
