function mountFolder (connect, dir) {
	return connect.static(require('path').resolve(dir));
};
module.exports = function(grunt) {
	grunt.initConfig({
		qunit:{
			options: {
				'phantomPath': 'node_modules/phantomjs/lib/phantom/phantomjs.exe',
				'--local-to-remote-url-access': 'no',
				'--proxy': '127.0.01',
				timeout: 5000
			},
			test: {
				options: {
				    urls: ['http://127.0.0.1:<%= connect.test.options.port %>/tests-runner.html']
				}
			}
		},
		connect: {
			testserver: {
				options: {
					port: 9001,
					hostname: '127.0.0.1',
					middleware: function (connect) {
						return [
							mountFolder(connect, 'src'),
							mountFolder(connect, 'tests'),
						];
					}
				}
			},
			test: {
				options: {
					port: 9002,
					hostname: '127.0.0.1',
					middleware: function (connect) {
						return [
							mountFolder(connect, 'src'),
							mountFolder(connect, 'tests'),
						];
					}
				}
			},
			testcoverage: {
				options: {
					port: 9002,
					hostname: '127.0.0.1',
					middleware: function (connect) {
						return [
							mountFolder(connect, '../.tmp'),
							mountFolder(connect, 'src'),
							mountFolder(connect, 'tests'),
						]
					}
				}
			}
		},
		coverageInstrument: {
			test: {
				src: 'lib/**/*.js',
				expand: true,
				cwd: 'src',
				dest: '../.tmp'
			}
		},
		coverageReport: {
        	test: {
				options: {
	        		reports: {
	        			html: '../reports/html/'
	        		}        		
	        	}
        	}
        }
    });

	require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


	// Aliases:

	// Run qunit tests via PhantomJS in console
	grunt.registerTask('test', ['connect:test', 'qunit:test']);

	// Run qunit tests via PhantomJS in console with code coverage via Istanbul
	grunt.registerTask('testcoverage', ['coverageInstrument', 'connect:testcoverage', 'qunit:test', 'coverageReport']);

	// Start web server for running qunit tests in browser (Open http://localhost:9001/run-tests.html)
	grunt.registerTask('testserver', ['connect:testserver:keepalive']);
};