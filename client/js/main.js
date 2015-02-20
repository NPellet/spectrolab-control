
requirejs.config({

	baseUrl: '../../client/',
	paths: {
		'jquery': 'js/lib/jquery.min',
		'jsgraph': 'js/lib/jsgraph.min',
		'jquery-ui': 'lib/jquery-ui/jquery-ui.min'
	}
});

require( [ 'jquery', 'js/modulefactory', 'js/io' ] , function( $, ModuleFactory, IO ) {


	ModuleFactory.parseDom( document );

	IO.setIp( $(document).find('head').find('meta[name=application-meta][data-serverip]').attr('data-serverip') );
	IO.connect();

	global( IO );
} );


function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
}


function global( IO ) {

	var experimentStatus = "stopped";

	$("#experiment-run input").on('click', function() {

		switch( experimentStatus ) {

			case 'stopped':

				IO.writeGlobal( "experiment-run" );

			break;

			case 'running':

				IO.writeGlobal( "experiment-pause" );

			break;

			case 'paused':

				IO.writeGlobal( "experiment-resume" );

			break;
		}
	});

	IO.onGlobal( "experiment-running", function() {

		experimentStatus = "running";
		$("#experiment-run input").attr('value', "Pause experiment").addClass('input-red').removeClass('input-green');
	} );

	IO.onGlobal( "experiment-paused", function() {

		experimentStatus = "paused";
		$("#experiment-run input").attr('value', "Resume experiment").removeClass('input-red').addClass('input-green');
	} );

	IO.onGlobal( "experiment-stopped", function() {

		experimentStatus = "stopped";
		$("#experiment-run input").attr('value', "Run experiment").removeClass('input-red').addClass('input-green');
	} );

}
