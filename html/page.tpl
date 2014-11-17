<!doctype html>
<html>
<head>


<link rel="stylesheet" href="css/style.css" />
<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>
<script src="http://www.jsgraph.org/js/jsgraph/jsgraph.js"></script>

</head>


<script>


var ws = new WebSocket('ws://128.179.148.93:8080');

ws.onopen = function (event) {
	
  //ws.send("Here's some text that the server is urgently awaiting!"); 
};

ws.onmessage = function( event ) {
	
	var data = JSON.parse( event.data );

	if( window.io._callbacks[ data.moduleid ] ) {

		window.io._callbacks[ data.moduleid ].map( function( callback ) {

			if( data.message.method == "lock" ) {

				if( data.message.value ) {

					var dom = $( "#module-" + data.moduleid );

					if( dom.find( '.overlay' ) ) {
						return;
					}

					dom.prepend( $( "<div />" ).addClass("overlay").css( {

						top: dom.position().top,
						left: dom.position().left,

						width: dom.width(),
						height: dom.height()

					} ) );

				} else {

					dom.find('.overlay').remove();

				}
			} else {

				callback( data.message );
			}
		} );
	}
}

window.io = {

	_callbacks: {},

	onMessage: function( moduleId, callback ) {

		this._callbacks[ moduleId ] = this._callbacks[ moduleId ] || [];
		this._callbacks[ moduleId ].push( callback );

	},

	write: function( moduleId, message ) {

		ws.send( JSON.stringify( { moduleid: moduleId, message: message } ) );

	}

};


</script>


<body>

{% for wrapper in wrappers %}
	{{ wrapper }}
{% endfor %}


</body>


</html>