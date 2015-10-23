var stdin = process.openStdin();
stdin.setEncoding('utf8');

	process.stdout.write("something\n");
		process.stdout.write("something\n");
			process.stdout.write("something\n");

setTimeout( function() {
	process.stdout.write("something\n");
}, 30000 );