/*
 * grunt-croc-qunit
 * Copyright (c) 2013 Croc Inc.
 *
 * Licensed under the MIT license.
 */

var unixifyPath = function(filepath) {
	if (process.platform === 'win32') {
		return filepath.replace(/\\/g, '/');
	} else {
		return filepath;
	}
};


var mergeReports = function(report1, report2) {
	var istanbul = require('istanbul');
	var collector = new istanbul.Collector();
	collector.add(report1);
	collector.add(report2);
	return collector.getFinalCoverage();
};

module.exports = function(grunt) {
	grunt.registerMultiTask('coverageInstrument', 'Instrument source files.', function() {
		var fs = require('fs');
		var istanbul = require('istanbul');
		if (!istanbul) {
			grunt.fail.warn("Cannot load istanbul module");
		}
		var instrumenter = new istanbul.Instrumenter();
		if (!instrumenter) {
			grunt.fail.warn("Cannot create istanbul.Instrumenter");
		}
		var path = require('path');
		var options = this.options({
			autoBind: true
		});
		
		var dest = this.data.dest;
		
		grunt.file.delete(dest);

		var count = 0,
			generateModuleDir,
			modules = [];

		if (options.generateModule) {
			generateModuleDir = path.dirname(options.generateModule.output);
		}
		// NOTE: this code in general (for src/dest processing) is borrowed from grunt-contrib-copy plugin
		this.files.forEach(function(filePair) {
			var isExpandedPair = filePair.orig.expand || false;

			filePair.src.forEach(function(src) {
				var dest;
				if (grunt.util._.endsWith(filePair.dest, '/')) {
					dest = (isExpandedPair) ? filePair.dest : unixifyPath(path.join(filePair.dest, src));
				} else {
					dest = filePair.dest;
				}
				if (grunt.file.isDir(src)) {					
					grunt.file.mkdir(dest);					
				} else {
					grunt.verbose.writeln('Instrumenting ' + src.cyan + ' -> ' + dest.cyan + '...');
					var code = instrumenter.instrumentSync(String(fs.readFileSync(src)), src);
					grunt.log.muted = true;
					grunt.file.write(dest, code);
					grunt.log.muted = false;
					grunt.verbose.writeln('OK'.green);
					count++;
					if (options.generateModule) {
						modules.push(path.relative(generateModuleDir, dest).replace(/\\/g, '/').replace(/.js$/, ''));
					}
				}
			});
		});
		grunt.log.writeln('' + count.cyan + ' files were instrumented');

		// bind to 'qunit' task's event to capture coverage info
		if (options.autoBind) {
			var coverageFilePath = path.join(dest, 'coverage.json');
			grunt.config('qunit.options.eventHandlers', {
				'qunit.coverage': function (coverage) {
					if (fs.existsSync(coverageFilePath)) {
						var oldCover = grunt.file.readJSON(coverageFilePath);
						coverage = mergeReports(oldCover, coverage);
					}					
					grunt.file.write(coverageFilePath, JSON.stringify(coverage));
				}
			});
			grunt.config('coverageReport.options.coverageFile', coverageFilePath);
			grunt.log.writeln('Autobinded to QUnit, coverage report will be saved into ' + coverageFilePath.cyan);
		}

		// generate an AMD module with imports of all instrumented modules
		if (options.generateModule) {
			if (options.generateModule.ignore && options.generateModule.ignore.length) {
				options.generateModule.ignore.forEach(function (ignore) {
					var idx = modules.indexOf(ignore);
					if (idx > -1) {
						modules.splice(idx,1);
					}
				});
			}
			grunt.file.write(options.generateModule.output, 'define(["' + modules.join('","') + '"],function () { /* generated code by grunt-croc-qunit */ });');
		}
	});

	grunt.registerMultiTask('coverageReport', 'Create reports from collected coverage info', function () {
		var options = this.options({
			coverageFile: '',
			reports: {}
		});
		var coverageFile = options.coverageFile;
		if (!coverageFile) {
			grunt.fail.warn('Option coverageFile wasn\'t specified');
		}
		var istanbul = require('istanbul');
		if (!istanbul) {
			grunt.fail.warn("Cannot load istanbul module");
		}
		
		var coverage = grunt.file.readJSON(coverageFile);
		if (!coverage) {
			grunt.log.writeln('No coverage info found');
			return;
		}

		var Report = istanbul.Report;
		var Utils = istanbul.utils;
		var collector = new istanbul.Collector();

		// add coverage information to the collector
		grunt.verbose.write('Parsing coverage data...');
		collector.add(coverage);
		grunt.verbose.writeln('OK'.green);

		// store coverage data for cmd output
		coverage = Utils.summarizeCoverage(collector.getFinalCoverage());
		if (coverage && coverage.lines) {
			grunt.log.ok('Coverage:');
			grunt.log.ok('-  Lines: ' + coverage.lines.pct + '%');
			grunt.log.ok('-  Statements: ' + coverage.statements.pct + '%');
			grunt.log.ok('-  Functions: ' + coverage.functions.pct + '%');
			grunt.log.ok('-  Branches: ' + coverage.branches.pct + '%');
		}

		// generate reports
		Object.keys(options.reports).forEach(function (reportName) {
			var dir = options.reports[reportName];
			if (!dir) {
				grunt.log.warn('No directory was specified for ' + reportName + ' report');
			} else {
				grunt.log.write('Generating coverage ' + reportName + ' report...');
				Report.create('html', {dir: dir}).writeReport(collector, true);
				grunt.log.writeln('OK'.green + ' (in ' + dir + ')');
			}
		});
	});

};
