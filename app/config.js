var config = {

	instruments: {


		"KeithleySMU": {
			type: "keithley-smu",
			name: 'Keithley SMU',
			host: '192.168.0.101',
			port: '5025'
		},

		"arduinoDigio": {
			type: "arduino",
			name: 'Arduino DIGIO',

			baudrate: 115200,
			host: '/dev/cu.usbmodem14211',

			options: {
			  parity: 'none',
			  dataBits: 8,
			  stopBits: 1
			 },




			"digital": {
				"LEDCard": {

					"relays": {
						"bypassAFG": 32,
						"inverter": 30,
						"colors": {
							"white": 24,
							"red": 28,
							"green": 26,
							"blue": 22
						}
					},

					"colors": {
						"white": 34,
						"red": 45,
						"green": 43,
						"blue": 41
					},

					"colornames": {
						"white": "White",
						"red": "Red",
						"green": "Green",
						"blue": "Blue"
					}
				}
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


		"PowerSupplyWhiteLED": {
			type: 'tektronix-powersupply',
			name: 'PWS - White LEDs',
			host: 'USB0::0x0699::0x0392::C011453::INSTR',

			current_sunoutput: [

				{ current: 0, sun: 0, text: "Dark" },
				{ current: 0.2, sun: 0.3, text: "30% sun" },
				{ current: 0.5, sun: 0.5, text: "50% sun" },
				{ current: 0.7, sun: 1, text: "100% sun" }
			]
		},

		"PowerSupplyColoredLED": {
			type: 'tektronix-powersupply',
			name: 'PWS - Colored LEDs',
			host: 'USB0::0x0699::0x0392::C011451::INSTR'
		},

		'OBIS 420m': {
			name: "OBIS Laser 420nm",
			type: 'coherent-obis',
			host: '/dev/cu.usbmodem141421',
			baudrate: 115200,
			options: {
			  parity: 'none',
			  dataBits: 8,
			  stopBits: 1,
			  flowControl: false
			}
		},


		'OBIS 660nm': {
			name: "OBIS Laser 660nm",
			type: 'coherent-obis',
			host: '/dev/cu.usbmodem141411',
			baudrate: 115200,
			options: {
			  parity: 'none',
			  dataBits: 8,
			  stopBits: 1,
			  flowControl: false
			}
		}
	},

	devices: [ 
		{ name: "Position 1", position: 0 }, 
		{ name: "Position 2", position: 1 },
		{ name: "Position 3", position: 2 },
		{ name: "Position 4", position: 3 },
		{ name: "Position 5", position: 4 },
		{ name: "Position 6", position: 5 },
		{ name: "Position 7", position: 6 },
		{ name: "Position 8", position: 7 }
	],

	referenceDiode: {
		model: "Centronic",
		currentAt1Sun: 0.00673 // in Amp
	}
};


module.exports = config;
