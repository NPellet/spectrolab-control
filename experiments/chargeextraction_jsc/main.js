

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();
experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('chargeextraction_jsc');
var Waveform = require('../../server/waveform');

proc.on("progress", function( method, results ) {

	switch( method ) {

		case 'charge':

			var itx = experiment.itx();


			var qjsc = new Waveform();

			var itxw = itx.newWave( "lightLevels" );
			itxw.setWaveform( results.lightLevels );

			var itxw = itx.newWave( "charges" );
			itxw.setWaveform( results.charges );

			var itxw = itx.newWave( "jscs" );
			itxw.setWaveform( results.jscs );

			for( var i = 0; i < results.lightLevels.length; i ++ ) {
				qjsc.push( results.charges[ i ], results.jscs[ i ] );

				var itxw = itx.newWave( "current_" + i );
				itxw.setWaveform( results.currentWaves[ i ] );
			}

			experiment.renderer.getModule( "graph" ).newScatterSerie( "qjsc", qjsc );

			var fileName = experiment.getFileSaver().save( {
				contents: itx.getFile(),
				forceFileName: experiment.getDeviceName() + ".itx",
				fileExtension: 'itx',
				dir: './chargeextraction_jsc/'
			} );
		break;
	}

} );

experiment.renderer.render();
