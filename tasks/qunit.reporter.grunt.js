// Allow an error message to retain its color when split across multiple lines.
var formatMessage = function(str) {
	return String(str).split('\n').map(function(s) { return s.magenta; }).join('\n');
};

var grunt;

// Requiring this here modifies the String prototype!
var colors = require('colors');

// Keep track of failed assertions for pretty-printing.
var failedAssertions = [];

module.exports = {

	init: function (_grunt, options) {
		grunt = _grunt;
		this.verbose = options && options.verbose; 
	},

	begin: function () {},

	moduleStart: function (details) {
		if (details.name) {
			grunt.log.writeln('Module \'' + details.name + '\' started');
		}
	},

	moduleDone: function (details) {
		if (details.name) {
			grunt.log.writeln('Module \'' + details.name + '\' finished');
		}	
	},

	testStart: function (details) {
		if (this.verbose) {
			grunt.log.writeln( ('>> Test \'' + (details.module ? details.module + " - " : "") + details.name + '\' started').grey );
		}
	},

	testDone: function (details) {
		// Log errors if necessary, otherwise success.
		if (details.failed > 0) {
			grunt.log.warn('Test FAILED ' + (details.module ? details.module + " - " : "") + details.name + '\'');
		} else {
			grunt.log.ok('Test PASSED \'' + (details.module ? details.module + " - " : "") + details.name + '\'');
		}
	},

	assert: function (details) {
		if (!details.result) {
			grunt.log.error('FAIL ' + formatMessage(details.message));
			if (details.actual !== details.expected) {
				grunt.log.error('Actual: ' + formatMessage(details.actual));
				grunt.log.error('Expected: ' + formatMessage(details.expected));
			}
			if (details.source) {
				grunt.log.warn(details.source.replace(/ {4}(at)/g, '  $1'));
			}
			grunt.log.writeln();
			//failedAssertions.push(details);
		} else {
			// TODO: if verbose
			if (this.verbose) {
				grunt.log.writeln('>> PASS '.green + formatMessage(details.message));
			}
		}
	},

	done: function (details) {
		if (details.failed > 0) {
			//grunt.log.writeln();
		} else if (details.total === 0) {
			grunt.warn('0/0 assertions ran (' + details.duration + 'ms)');
		} else {
			//grunt.log.ok();
		}
	},

	log: function (msg) {
		grunt.log.writeln( ('console: ' + msg).grey );
	},

	logFailedAssertions: function() {
		var assertion;
		// Print each assertion error.
		while (assertion = failedAssertions.shift()) {
			grunt.verbose.or.error((assertion.module ? assertion.module + " - " : "") + assertion.name);
			grunt.log.error('Message: ' + formatMessage(assertion.message));
			if (assertion.actual !== assertion.expected) {
				grunt.log.error('Actual: ' + formatMessage(assertion.actual));
				grunt.log.error('Expected: ' + formatMessage(assertion.expected));
			}
			if (assertion.source) {
				grunt.log.error(assertion.source.replace(/ {4}(at)/g, '  $1'));
			}
			grunt.log.writeln();
		}
	}
};
