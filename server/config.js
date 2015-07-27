var config = {

	instruments: {


		"keithley": {
			type: "keithley-smu",
			name: 'Keithley SMU',
			host: '192.168.0.101',
			port: '5025'
		},

		"arduino": {
			type: "arduino",
			name: 'Arduino',
			baudrate: 115200,

			whiteLightLED: {

				"LEDType": "LuxeonStar REBEL White 5650K",
				"Disposition": "Array of 3x3",

				"sunLevels": [ 1.996, 1, 0.545, 0.24, 0.1123, 0.0464, 0.0191, 0.0086, 0.0031, 0.0016, 0.0005, 0.0003, 0.0002 ],

				"arduinoAnalogValue": [ 2172,2076,2022,1970,1933,1896,1862,1832,1794,1768,1736,1712,1698 ],
				"arduinoAnalogPin": 0,

				"lowestSunLevel": 1650,
				"highestSunLevel": 2172
			},

			colorLightLED: {
				"arduinoAnalogPin": 1
			}
		},

		"tektronix-functiongenerator": {
			type: "tektronix-functiongenerator",
			name: 'Function generator',
			host: '192.168.0.100'
		},


		"tektronix-oscilloscope": {
			type: 'tektronix-oscilloscope',
			name: 'Oscilloscope',
			host: '192.168.0.102'
		},


		"tektronix-PWS-WhiteLED": {
			type: 'tektronix-powersupply',
			name: 'PWS - White',
			host: 'USB0::0x0699::0x0392::C011451::INSTR'
		},

		"tektronix-PWS-ColorLED": {
			type: 'tektronix-powersupply',
			name: 'PWS - Colored',
			host: ''
		},

	}


};


module.exports = config;
