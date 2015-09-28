
( function( stream ) {

	var table = $("#table-{{ module.id }}"),
		tbody = table.find("tbody"),
		thead = table.find("thead");

	var columns = [],
		rows = [];

	function reconstructTable() {

		var head = "<tr >";
		columns.map( function( column ) {

			head += "<td>";
			head += column;
			head += "</td>";

		} );
		head += '</head>';

		thead.html( head );

		var html = "";
		rows.map( function( row ) {

			html += "<tr>";
			columns.map( function( column ) {

				html += "<td>";
				html += row[ column ] || "";
				html += "</td>";

			} );

			html += "</tr>";
		} );

		tbody.html( html );

	}



	module.onMessage( "addColumn", function( data ) {

		columns.push( data );
		reconstructTable();

	} );

	module.onMessage( "addRow", function( data ) {

		rows.push( data );
		reconstructTable();

	} );

	module.ready();

}) ( window.io );