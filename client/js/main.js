
requirejs.config({

	baseUrl: '../../client/',
	paths: {
		'jquery': 'js/lib/jquery.min',
		'jsgraph': 'js/lib/jsgraph.min',
		'jquery-ui': 'lib/jquery-ui/jquery-ui.min',
		'bootstrap': 'lib/bootstrap/dist/js/bootstrap.min',
		'bootstrap-treeview': 'lib/bootstrap-treeview/src/js/bootstrap-treeview'

	},

	shim: {
		'bootstrap': [ 'jquery' ],
		'bootstrap-treeview': [ 'bootstrap', 'jquery' ]
	}
});

require( [ 'jquery', 'js/modulefactory', 'js/io', 'bootstrap', 'bootstrap-treeview' ] , function( $, ModuleFactory, IO ) {


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

	var cfgSelected;
	var experimentStatus = "stopped";

	var btns = $("#experiment-run .run input").add( $("#experiment-run .abort input") );
	var deviceName = $("#device-name .name input");

	deviceName.on('keyup blur change', function() {

			var value = $( this ).prop( 'value' );
			IO.writeGlobal( "deviceName", value );
			console.log( value );
	});


	$("#run-experiment").on('click', function() {

		btns.prop( 'disabled', true );

		switch( experimentStatus ) {

			case 'stopped':

				IO.writeGlobal( "experiment-run" );

			break;

			case 'paused':

				IO.writeGlobal( "experiment-resume" );

			break;

			case 'running':

				IO.writeGlobal( "experiment-pause" );

			break;
		}
	});



	$("#abort-experiment").on('click', function() {

		btns.prop( 'disabled', true );

		switch( experimentStatus ) {


			case 'running':

					IO.writeGlobal( "experiment-abort" );

			break;
		}
	});



	IO.onGlobal( "experiment-running", function() {

		experimentStatus = "running";
		$("#run-experiment").prop("disabled", false ).html("Pause");
		$("#run-experiment").prop( "disabled", false );
		$("#abort-experiment").prop( "disabled", false );
	} );


	IO.onGlobal( "experiment-pausing", function() {

		experimentStatus = "pausing";
		$("#run-experiment").prop("disabled", true ).html("Pausing...");
		$("#abort-experiment").prop( "disabled", true );

	} );

	IO.onGlobal( "experiment-aborting", function() {

		experimentStatus = "pausing";
		$("#run-experiment").prop("disabled", true );
		$("#abort-experiment").prop( "disabled", true ).html("Aborting...");

	} );


	IO.onGlobal( "experiment-paused", function() {

		experimentStatus = "paused";
		$("#run-experiment").prop("disabled", false ).html("Resume experiment");
		$("#abort-experiment").prop( "disabled", false );
	} );

	IO.onGlobal( "experiment-stopped", function() {

		experimentStatus = "stopped";
		$("#run-experiment").prop("disabled", false ).html("Run experiment");
		$("#abort-experiment").prop( "disabled", true );
	} );

	IO.onGlobal( "cfg-list", function( cfgList ) {

		cfgSelected = cfgList[ 0 ].path;

		$("#cfg-tree").treeview( {

			data: cfgList,
			onNodeSelected: function( event, data ) {

				$("#cfg-name").prop( 'value', data.text );
				$("#cfg-remove").prop( 'disabled', !!data.locked );

				cfgSelected = data.path;
			},

			onNodeExpanded: function( event, data ) {

				$("#cfg-name").prop( 'value', data.text );
				cfgSelected = data.path;
			}
		} );
	} );



	IO.writeGlobal('domReady');

	$("#cfg-load").on( 'click', function() {

		IO.writeGlobal( "cfg-load", cfgSelected );
	});


	$("#cfg-save").on( 'click', function() {

		IO.writeGlobal( "cfg-save", { file: $("#cfg-name").prop('value'), path: cfgSelected } );
	});

	$("#cfg-newfolder").on( 'click', function() {

		IO.writeGlobal( "cfg-newfolder", { file: $("#cfg-name").prop('value'), path: cfgSelected } );
	});

	$("#cfg-remove").on( 'click', function() {

		IO.writeGlobal( "cfg-remove", { file: $("#cfg-name").prop('value'), path: cfgSelected } );
	});

	$("#more-cfg").on( 'click', function() {

		$("#more-cfg-pannel").slideToggle();
	});

}
