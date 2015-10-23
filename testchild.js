
var fs = require("fs");

var spawn = require("child_process").spawn,
  out = fs.openSync('./out.log', 'a'),
  err = fs.openSync('./out.log', 'a');

spawn("node", [ "child.js" ], {
	cwd: __dirname,
	detached: true,
	stdio: [ 'ignore', out, err ]
});

