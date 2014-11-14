
var Wrapper = function( renderer ) {
	this.renderer = renderer;
	this.modules = [];
};

Wrapper.prototype.setTitle = function( title ) {
	this.title = title;
	return this;
}

Wrapper.prototype.setPosition = function( left, top ) {
	this.left = left || 1;
	this.top = top || 1;	
	return this;
}

Wrapper.prototype.setSize = function( w, h ) {
	this.width = w || 10;
	this.height = h || 10;
	return this;
}

Wrapper.prototype.addModule = function( moduleType, moduleName ) {

	var moduleConstructor = require('./modules/' + moduleType + '/module.js').Constructor;

	var module = new moduleConstructor();

	module.init();

	this.modules.push( module );
	this.renderer.addModuleByName( moduleName, module );
	return module;
}

Wrapper.prototype.render = function() {

	var html = '<div class="wrapper">';
	var js = '<script type="text/javascript">';

	for( var i = 0, l = this.modules.length ; i < l ; i ++ ) {

		html += this.modules[ i ].renderHTML();
		js += this.modules[ i ].renderJS();
	}

	html += '</div>';
	js += '</script>';

	return html + js;
}

module.exports = Wrapper;