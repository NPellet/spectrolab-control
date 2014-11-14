

var keithley = require("../../../keithley/controller"),
	config = require("../../../config"),
	renderer = require("./renderer");

var keithley = new keithley( config.instruments.keithley );

renderer
	.getModuleByName("keithleyConnect")
	.assignKeithley( keithley );


renderer.render();