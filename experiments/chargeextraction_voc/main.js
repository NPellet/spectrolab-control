

var experiment = require('app/experiment');

experiment.renderer = require('./renderer');
experiment.config = require('./config');

experiment.renderer.experiment = experiment;
experiment.loadInstruments();

experiment.renderer.init();
experiment.addInstrumentConnectModules();

var proc = experiment.getDeviceProcedure('chargeextraction_voc');
var Waveform = require('../../server/waveform');

proc.on("progress", function( method, results ) {

	switch( method ) {

		case 'charge':

			var itx = experiment.itx();


			var qvoc = new Waveform();

			var itxw = itx.newWave( "lightLevels" );
			itxw.setWaveform( results.lightLevels );

			var itxw = itx.newWave( "charges" );
			itxw.setWaveform( results.charges );

			var itxw = itx.newWave( "vocs" );
			itxw.setWaveform( results.vocs );

			for( var i = 0; i < results.lightLevels.length; i ++ ) {
				qvoc.push( results.charges[ i ], results.vocs[ i ] );

				var itxw = itx.newWave( "current_" + i );
				itxw.setWaveform( results.currentWaves[ i ] );

				var itxw = itx.newWave( "voltage_" + i );
				itxw.setWaveform( results.voltageWaves[ i ] );
			}

			experiment.renderer.getModule( "graph" ).newScatterSerie( "qvoc", qvoc );

			var fileName = experiment.getFileSaver().save( {
				contents: itx.getFile(),
				forceFileName: experiment.getDeviceName() + ".itx",
				fileExtension: 'itx',
				dir: './chargeextraction_voc/'
			} );
		break;
	}

} );

experiment.renderer.render();
