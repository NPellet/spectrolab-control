function uniqueId() {
	// http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	    var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
	    return v.toString(16);
	});
}


// http://forum.jquery.com/topic/serializeobject
function serializeObjectWithFloats( form, floats ) {
	var o = {};
	var a = form.serializeArray();
	$.each(a, function() {
		
		if( floats.indexOf( this.name ) > -1 ) {
			this.value = parseFloat( this.value );
		}
		if (o[this.name]) {
			if (!o[this.name].push) {
				o[this.name] = [o[this.name]];
			}
			o[this.name].push(this.value);
		} else {
			o[this.name] = this.value;
		}
	});
	return o;
};



$(document).ready(function() {

	$(".module.locked").each( function( i, dom ) { lockModule( $( dom ) ); });
});