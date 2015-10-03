 module.exports = {
	"instruments": {
		"KeithleySMU": {
			"type": "keithley-smu",
			"name": "Keithley SMU",
			"host": "192.168.0.101",
			"port": "5025"
		},
		"arduinoDigio": {
			"type": "arduino",
			"name": "Arduino DIGIO",
			"baudrate": 115200,
			"host": "/dev/cu.usbmodem14211",
			"options": {
				"parity": "none",
				"dataBits": 8,
				"stopBits": 1
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
			"type": "tektronix-functiongenerator",
			"name": "Function generator",
			"host": "192.168.0.100"
		},
		"tektronix-oscilloscope": {
			"type": "tektronix-oscilloscope",
			"name": "Oscilloscope",
			"host": "192.168.0.102"
		},
		"PowerSupplyWhiteLED": {
			"type": "tektronix-powersupply",
			"name": "PWS - White LEDs",
			"host": "USB0::0x0699::0x0392::C011453::INSTR",
			"voltage_sunoutput": [
				{
					"voltage": 21.2451,
					"sun": 0.000018821947674418605,
					"text": "0.001882% sun"
				},
				{
					"voltage": 21.428,
					"sun": 0.00003698604651162791,
					"text": "0.003699% sun"
				},
				{
					"voltage": 21.6236,
					"sun": 0.00007673531976744186,
					"text": "0.007674% sun"
				},
				{
					"voltage": 21.8326,
					"sun": 0.00016891424418604653,
					"text": "0.01689% sun"
				},
				{
					"voltage": 22.0561,
					"sun": 0.0003931482558139535,
					"text": "0.03931% sun"
				},
				{
					"voltage": 22.1735,
					"sun": 0.0006109433139534884,
					"text": "0.06109% sun"
				},
				{
					"voltage": 22.4205,
					"sun": 0.0015157412790697674,
					"text": "0.1516% sun"
				},
				{
					"voltage": 22.6844,
					"sun": 0.003882819767441861,
					"text": "0.3883% sun"
				},
				{
					"voltage": 22.9666,
					"sun": 0.01027890988372093,
					"text": "1.028% sun"
				},
				{
					"voltage": 23.2683,
					"sun": 0.028210029069767443,
					"text": "2.821% sun"
				},
				{
					"voltage": 23.4268,
					"sun": 0.04671976744186047,
					"text": "4.672% sun"
				},
				{
					"voltage": 23.7601,
					"sun": 0.12319781976744186,
					"text": "12.32% sun"
				},
				{
					"voltage": 24.116500000000002,
					"sun": 0.286828488372093,
					"text": "28.68% sun"
				},
				{
					"voltage": 24.4974,
					"sun": 0.5677732558139534,
					"text": "56.78% sun"
				},
				{
					"voltage": 24.9045,
					"sun": 0.9678299418604652,
					"text": "96.78% sun"
				},
				{
					"voltage": 29,
					"sun": 3.6509883720930234,
					"text": "365.1% sun"
				}
			]
		},
		"PowerSupplyColoredLED": {
			"type": "tektronix-powersupply",
			"name": "PWS - Colored LEDs",
			"host": "USB0::0x0699::0x0392::C011451::INSTR"
		},
		"OBIS 420m": {
			"name": "OBIS Laser 420nm",
			"type": "coherent-obis",
			"host": "/dev/cu.usbmodem141421",
			"baudrate": 115200,
			"options": {
				"parity": "none",
				"dataBits": 8,
				"stopBits": 1,
				"flowControl": false
			}
		},
		"OBIS 660nm": {
			"name": "OBIS Laser 660nm",
			"type": "coherent-obis",
			"host": "/dev/cu.usbmodem141411",
			"baudrate": 115200,
			"options": {
				"parity": "none",
				"dataBits": 8,
				"stopBits": 1,
				"flowControl": false
			}
		}
	},
	"devices": [
		{
			"name": "Position 1",
			"position": 0
		},
		{
			"name": "Position 2",
			"position": 1
		},
		{
			"name": "Position 3",
			"position": 2
		},
		{
			"name": "Position 4",
			"position": 3
		},
		{
			"name": "Position 5",
			"position": 4
		},
		{
			"name": "Position 6",
			"position": 5
		},
		{
			"name": "Position 7",
			"position": 6
		},
		{
			"name": "Position 8",
			"position": 7
		}
	],
	"referenceDiode": {
		"model": "Centronic",
		"currentat1Sun": -0.00688
	}
};