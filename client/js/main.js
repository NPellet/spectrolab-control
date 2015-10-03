
requirejs.config({

	baseUrl: '../../client/',
	paths: {
		'jquery': 'js/lib/jquery.min',
		'util': 'js/lib/util',
		'jsgraph': 'js/lib/jsgraph.min',
		'jquery-ui': 'lib/jquery-ui/jquery-ui.min',
		'bootstrap': 'lib/bootstrap/dist/js/bootstrap.min',
		'bootstrap-treeview': 'lib/bootstrap-treeview/src/js/bootstrap-treeview'

	},

	shim: {
		'bootstrap': [ 'jquery' ],
		'bootstrap-treeview': [ 'bootstrap', 'jquery' ],
		'lib/jquery.populate/index': [ 'jquery' ],
		'lib/jquery-serialize-object/jquery.serialize-object': [ 'jquery' ]
	}
});

require( [ 'jquery', 'js/modulefactory', 'js/io', 'util', 'bootstrap', 'bootstrap-treeview',
'lib/jquery.populate/index', 'lib/jquery-serialize-object/jquery.serialize-object'


 ] , function( $, ModuleFactory, IO, Util ) {


	IO.setIp( $(document).find('head').find('meta[name=application-meta][data-serverip]').attr('data-serverip') );
	IO.connect();

	global( IO, Util, ModuleFactory );
} );

var cfgSelected;

function loadCss(url) {
    var link = document.createElement("link");
    link.type = "text/css";
    link.rel = "stylesheet";
    link.href = url;
    document.getElementsByTagName("head")[0].appendChild(link);
}


function global( IO, Util, ModuleFactory ) {

	
	var experimentStatus = "stopped";

	var btns = $("#experiment-run .run input").add( $("#experiment-run .abort input") );
	var deviceName = $("#device-name");

	deviceName.on('keyup blur change', function() {

		var value = $( this ).prop( 'value' );
		IO.writeGlobal( "deviceName", value );
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


	IO.onGlobal( "showModal", function( html ) {
		var id;
		html = $( html ).attr('id', ( id = Util.guid() ) );
		$("body").append( html );

		$("#" + id ).modal( ).on('click', 'button.ok', function() {

			IO.writeGlobal( 'modalOk' );
			$("#" + id ).modal( 'hide' );
		});

	} );


	IO.onGlobal( "html", function( html ) {
		$("#grid").html( html );

		ModuleFactory.parseDom( $("#grid") ).then( function() {
			IO.writeGlobal( "modulesReady" );
		} );
	} );

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





( function() {

	var methodlistDevices, methodlistNonDevices;
	
	var adding = false;

	IO.onGlobal( "method-list-devices", function( list ) {
		methodlistDevices = list;
	});

	IO.onGlobal( "method-list-nondevices", function( list ) {
		methodlistNonDevices = list;
	});

	$("#leftpannel").on('click', '.configuremethod', function() {

		methodid = $( this ).parent().data( 'method-id');
		methodSelected = $( this ).parent().data( 'method' );
		$( "#modal-configuremethod" ).modal( "show" );
		configureMethod( methodSelected, methodid );

	} );


	$("#leftpannel").on('click', '.device', function() {
		IO.writeGlobal( $( this ).hasClass('selected') ? 'unselectDevice' : 'selectDevice', $( this ).data('deviceposition') );
	} );



	$("#leftpannel").on('click', '.instrument', function() {

		if( $( this ).hasClass('connected') || $( this ).hasClass( 'connecting' ) ) {
			return;
		}

		IO.writeGlobal( 'connectInstrument', $( this ).data('instrument') );
	} );

	$('#modal-addmethod').on('shown.bs.modal', function ( e ) {
	  	  	
	  	var modal = this;
	  	var opener = e.relatedTarget;

	  	var data;
	  	if( $( opener ).data('methodtype') == 'device' ) {
	  		data = methodlistDevices;
	  	} else {
	  		data = methodlistNonDevices;
	  	}

		$( ".method-list", this ).treeview( {

			data: data,
			onNodeSelected: function( event, data ) {
				methodSelected = data.path;
			}
		} );

		methodid = 0;

	} );

	$( ".ok", "#modal-addmethod" ).bind('click', function() {

		$( "#modal-addmethod" ).modal( "hide" );
		$( "#modal-configuremethod" ).modal( "show" );
		configureMethod( methodSelected, 0 );
	} );


	$( ".ok", "#modal-configuremethod" ).bind('click', function() {

		$( "#modal-configuremethod" ).modal( "hide" );
		
		console.log(

			$( '#modal-configuremethod .modal-body form' ),
			$( '#modal-configuremethod .modal-body form' ).serializeObject( )

		);

		IO.writeGlobal( "configuremethod", { methodid: methodid, method: methodSelected, configuration: $( '#modal-configuremethod .modal-body form' ).serializeObject( ) } );

	} );


	function configureMethod( method, methodid ) {

		IO.writeGlobal("getmethodconfiguration", { method: method, methodid: methodid } );
	}

	IO.onGlobal("methodconfiguration", function( form ) {

		$( "#modal-configuremethod .modal-body" ).html( form.form ).children().populate( form.fill );
	});

	IO.onGlobal("updateleftpannel", function( html ) {
		$("#leftpannel").html( html );
	});

	$('#modal-loadmethods').on('shown.bs.modal', function ( e ) {
	  	  	
		IO.writeGlobal( "loadmethodslists" );
	} );

	IO.onGlobal( "methodslists", function( methodslists ) {

		$("#methodslists-tree").treeview( {

			data: methodslists,
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


	});



}) ();




	IO.writeGlobal("loggerGetMessages");

	IO.onGlobal('logger', function( message ) {

		if( ! Array.isArray( message ) ) {
			message = [ message ];
		}

		$("#console-main tbody").empty();

		for( var i = 0, l = message.length; i < l; i ++ ) {
			var classTr, classText;
			switch( message[ i ].type ) {

				case 'error':
					classTr = 'danger';
				break;

				case 'warning':
					classTr = 'warning';
				break;

				case 'log':
					classTr = '';
				break;

				case 'ok':
					classTr = 'success';
				break;


				case 'info':
					classTr = 'primary';
				break;

			}

			classText = classTr !== "" ? 'text-' + classTr : '';
			var tr = '<tr class="' + classTr + ' ' + classText + '"><td class="time">[' + message[ i ].time + '] :</td><td>' + message[ i ].message + '</td></tr>'
			$("#console-main tbody").append( tr );

			
			$("#console-main-wrapper")[ 0 ].scrollTop = $("#console-main-wrapper")[ 0 ].scrollHeight;
		}
	});

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

	



}
