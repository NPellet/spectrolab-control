

( function( ) {
	
	function pad( val ) {
		return ( String( val ).length == 1 ) ? '0' + val : val;
	}

	var dom = $("#statusbar-{{ module.id }}");

	module.onMessage("status", function( value ) {

		if( typeof value == "string" ) {
			value = {
				message: value,
				type: 'neutral'
			}
		}

		var html = value.message;

		if( value.date ) {
			var date = new Date( value.date );
			html = "[" + pad( date.getDate() ) + "." + pad( date.getMonth() ) + "." + date.getFullYear() + " " + pad( date.getHours() ) + ":" + pad( date.getMinutes() ) + ":" + pad( date.getSeconds() ) + "] : " + html;
		}

		dom.html( html );

		dom.removeClass('message-neutral message-warning message-error message-ok message-process');
		dom.addClass('message-' + value.type );
	} );

	module.ready();

}) ( );