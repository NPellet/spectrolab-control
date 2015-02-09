var config = { 

	instruments: {
		keithley: {
			host: '169.254.0.1',
			port: '5025'
		},

		gouldOscilloscope: {
			baudrate: 19200,
			host: '/dev/tty.USA19H142P1.1'
		}
	}
};


module.exports = config;