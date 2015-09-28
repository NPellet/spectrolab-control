
module.exports = function(grunt) {

	require('load-grunt-tasks')(grunt); // npm install --save-dev load-grunt-tasks

	grunt.initConfig({
	    sass: {
	        options: {
	            sourceMap: true
	        },
	        dist: {
	            files: {
	                'client/css/main.css': 'sass/main.scss'
	            }
	        }
	    }
	});

	grunt.registerTask('default', ['sass']);

};