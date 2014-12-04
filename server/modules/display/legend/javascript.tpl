
( function( stream ) {

	var table = $("#table-{{ module.id }}");

	function setEvents( graph ) {

		table.on('change', 'input[type="checkbox"]', function( ) {

			var serie = $( this )
							.parent()
							.parent()
							.data('serie');
			
			if( $( this ).prop( 'checked' ) ) {
				serie.show();
			} else {
				serie.hide();
			}
		} );

		table.on('change', 'input[type="color"]', function( ) {

			var tr = $( this ).parent().parent();
			var serie = tr.data('serie');
			serie.setLineColor( $(this).prop('value') );
			serie.updateStyle();	
			updateSerieMarker( tr );		
		} );

		table.on('click', '.remove', function() {

			var tr = $( this ).parent().parent();
			var serie = tr.data('serie');
			serie.kill();
			tr.remove();
		} );

		graph.on( "newSerie", function ( serie ) {
			newSerie( serie );
		} );
	}

	function makeSerieDom( serie ) {
//console.dir( serie.getSymbolForLegend() );
		var symbol = "<svg width='30' height='20'><g transform='translate(0, 10)'></g></svg>";

		var tr = $("<tr />")
					.append("<td><input type='checkbox' checked='checked' /></td>")
					.append("<td>" + symbol + "</td>")
					.append("<td>" + serie.getName() + "</td>")
					.append("<td><input type='color' /></td>")
					.append("<td><a class='remove'>[x]</a></td>")
				.data('serie', serie );

		var group = tr.find('svg g');

		tr.data('serieSymbol', group);
		updateSerieMarker( tr );

		return tr;
	}

	function updateSerieMarker( tr ) {

		var serie = tr.data('serie'),
			g = tr.data( 'serieSymbol' );

		g.html( serie.getSymbolForLegend().outerHTML )
	}


	function newSerie( serie ) {

		var tr = makeSerieDom( serie );
		table.append( tr );
	}

	module.onMessage( "assignGraph", function( data ) {

		module.graph = storage.get( data );
		setEvents( module.graph );

	} );

	module.ready();

}) ( window.io );