
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


	$("#experiment-run .run input").on('click', function() {

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



	$("#experiment-run .abort input").on('click', function() {

		btns.prop( 'disabled', true );

		switch( experimentStatus ) {


			case 'running':

					IO.writeGlobal( "experiment-abort" );

			break;
		}
	});



	IO.onGlobal( "experiment-running", function() {

		experimentStatus = "running";
		$("#experiment-run .run input").prop("disabled", false ).attr('value', "Pause experiment").addClass('input-red').removeClass('input-green');
		$("#experiment-run .run input").prop( "disabled", false ).addClass('input-red').removeClass('input-grey');
		$("#experiment-abort .abort input").prop( "disabled", false );
		deviceName.prop('disabled', true );
	} );


	IO.onGlobal( "experiment-pausing", function() {

		experimentStatus = "pausing";
		$("#experiment-run .run input").prop("disabled", true ).attr('value', "Pausing experiment...").addClass('input-grey').removeClass('input-red');
		$("#experiment-run .abort input").prop( "disabled", true ).addClass('input-grey').removeClass('input-red');

	} );

	IO.onGlobal( "experiment-aborting", function() {

		experimentStatus = "pausing";
		$("#experiment-run .run input").prop("disabled", true ).addClass('input-grey').removeClass('input-red');
		$("#experiment-run .abort input").prop( "disabled", true ).attr('value', "Aborting experiment...").addClass('input-grey').removeClass('input-red');

	} );


	IO.onGlobal( "experiment-paused", function() {

		experimentStatus = "paused";
		$("#experiment-run .run input").prop("disabled", false ).attr('value', "Resume experiment").removeClass('input-red').removeClass('input-grey').addClass('input-green');
		$("#experiment-abort .abort input").prop( "disabled", false );
	} );

	IO.onGlobal( "experiment-stopped", function() {

		experimentStatus = "stopped";
		$("#experiment-run .run input").prop("disabled", false ).attr('value', "Run experiment").removeClass('input-red').addClass('input-green');
		$("#experiment-abort .abort input").prop( "disabled", true ).addClass('input-grey').removeClass('input-red');
		deviceName.prop('disabled', false );
	} );

	IO.onGlobal( "cfg-list", function( cfgList ) {
	
		cfgSelected = cfgList[ 0 ].path;

		$("#cfg-tree").treeview( {

			data: cfgList,
			onNodeSelected: function( event, data ) {
				
				$("#cfg-name").prop( 'value', data.text );
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
