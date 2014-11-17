<!doctype html>
<html>
<head>

<script src="//code.jquery.com/jquery-1.11.0.min.js"></script>

</head>


<script>


var ws = new WebSocket('ws://127.0.0.1:8080');

ws.onopen = function (event) {
	
  //ws.send("Here's some text that the server is urgently awaiting!"); 
};

ws.onmessage = function( event ) {
	console.log( event.data );
	var data = JSON.parse( event.data );

	if( window.io._callbacks[ data.moduleid ] ) {

		window.io._callbacks[ data.moduleid ].map( function( callback ) {
			callback( data.message );
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