
function lockModule( dom ) {


	dom.prepend( $( "<div />" ).addClass("overlay").css( {

		top: dom.position().top,
		left: dom.position().left,

		width: dom.width(),
		height: dom.height()

	} ) );
}

function unlockModule( dom ) {

	dom.find('.overlay').remove();
}