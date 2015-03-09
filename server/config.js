var config = {

	instruments: {


		"keithley-smu": {
			host: '192.168.0.101',
			port: '5025'
		},

		"gould-oscilloscope": {
			baudrate: 19200,
			host: '/dev/tty.USA19H141P1.1'

		},

		"arduino": {
			baudrate: 115200,

			whiteLightLED: {

				"LEDType": "LuxeonStar REBEL White 5650K",
				"Disposition": "Array of 3x3",

				"sunLevels": [ 1.996, 1, 0.545, 0.24, 0.1123, 0.464, 0.191, 0.0086, 0.0031, 0.0016, 0.0005, 0.0003, 0.0002, 0 ],

				"arduinoAnalogValue": [ 2172,2076,2022,1970,1933,1896,1862,1832,1794,1768,1736,1712,1698,0 ],
				"arduinoAnalogPin": 0,

				"lowestSunLevel": 1650,
				"highestSunLevel": 2172
			},

			colorLightLED: {
				"arduinoAnalogPin": 1
			}
		},

		"tektronix-functiongenerator": {

			host: '192.168.0.100'
		}
	}


};


module.exports = config;
