/*
 * grunt-croc-qunit
 * Copyright (c) 2013 Croc Inc.
 *
 * Code borrowed from grunt-contrib-qunit (http://gruntjs.com/).
 * The plugin created (originally as modified version of grunt-contrib-qunit) 
 * to avoid using 'phantomjs' module, which is used by grunt-lib-qunit
 *
 * Original plugin copyright:
 * Copyright (c) 2013 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */

'use strict';

var reporter;

module.exports = function(grunt) {

  // Nodejs libs.
  var path = require('path');

  // External lib.
  var phantomjs = require('./phantomjs').init(grunt);

  // Keep track of the last-started module, test and status.
  var g_currentTest, status;
  // Keep track of the last-started test(s).
  var unfinished = {};

  // Get an asset file, local to the root of the project.
  var asset = path.join.bind(null, __dirname, '..');

  // QUnit hooks.

  phantomjs.on('qunit.begin', function (details) {
    reporter.begin(details);
  });

  phantomjs.on('qunit.moduleStart', function(details) {
    unfinished[details.name] = true;
    //g_currentModule = details.name;
    reporter.moduleStart(details);
  });

  phantomjs.on('qunit.moduleDone', function(details) {
    delete unfinished[details.name];
    reporter.moduleDone(details);
  });

  phantomjs.on('qunit.log', function(details) {
    reporter.assert(details);
  });

  phantomjs.on('qunit.testStart', function(details) {
    g_currentTest = (details.module ? details.module + ' - ' : '') + details.name;
    //grunt.verbose.write(g_currentTest + '...');
    reporter.testStart(details);
  });

  phantomjs.on('qunit.testDone', function(details) {
    reporter.testDone(details);
  });

  phantomjs.on('qunit.done', function(details) {
    grunt.verbose.writeln('QUnit tests done (' + details.runtime + 'ms)');
    phantomjs.halt();
    status.failed += details.failed;
    status.passed += details.passed;
    status.total += details.total;
    status.duration += details.runtime;

    reporter.done(details);
  });

  // Re-broadcast qunit events on grunt.event.
  phantomjs.on('qunit.*', function() {
    var args = [this.event].concat(grunt.util.toArray(arguments));
    grunt.event.emit.apply(grunt.event, args);
  });

  // Built-in error handlers.
  phantomjs.on('page.load.fail', function(url) {
    phantomjs.halt();
    grunt.verbose.write('Running PhantomJS...').or.write('...');
    grunt.log.error();
    grunt.warn('PhantomJS unable to load "' + url + '" URI.');
  });

  phantomjs.on('fail.timeout', function() {
    phantomjs.halt();
    grunt.log.writeln();
    grunt.warn('PhantomJS timed out, possibly due to a missing QUnit start() call.');
  });

  grunt.registerMultiTask('qunit', 'Run QUnit unit tests in a headless PhantomJS instance.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      // Default PhantomJS timeout.
      timeout: 5000,
      // QUnit-PhantomJS bridge file to be injected.
      inject: asset('phantomjs/bridge.js'),
      // Explicit non-file URLs to test.
      urls: [],
      // Custom phantomjs' events handlers (e.g. for extracting coverage reports)
      eventHandlers: {},
      reporter: 'console',
      verbose: true
      // do not fail task if tests fail
      //force: false
    }),
    // This task is asynchronous.
    done = this.async(),
    disposables = [];

    grunt.verbose.writeln("Using reporter " + options.reporter);
    if (options.reporter === 'teamcity') {
      reporter = require('./qunit.reporter.teamcity');
    } else {
      reporter = require('./qunit.reporter.grunt');
    }
    reporter.init(grunt, {verbose: options.verbose});
//console.log("REPORTER: verbose=" + options.verbose);
    if (options.eventHandlers) {
      Object.keys(options.eventHandlers).forEach(function (eventName) {
        var handler = options.eventHandlers[eventName];
        if (handler) {
          grunt.verbose.writeln('Add custom handler for phantomjs "' + eventName + '" event');
          phantomjs.on(eventName, handler);
          // see teardown section below in done callback
          disposables.push([eventName, handler]);
        }
      });
    }

    // Combine any specified URLs with src files.
    var urls = options.urls.concat(this.filesSrc);

    // Reset status.
    status = {failed: 0, passed: 0, total: 0, duration: 0};
    
    if (options.verbose) {
      // Pass-through console.log statements.
      //phantomjs.on('page.console', console.log.bind(console));
      phantomjs.on('page.console', function () {
        reporter.log.apply(reporter, arguments);
        //console.log.apply(console, arguments);
      });
    }

    // Process each filepath in-order.
    grunt.util.async.forEachSeries(urls, function(url, next) {
      var basename = path.basename(url);
      grunt.verbose.subhead('Testing ' + url + ' ').or.write('Testing ' + url + ' ');

      grunt.log.writeln();
      // Launch PhantomJS.
      grunt.event.emit('qunit.spawn', url);
      phantomjs.spawn(url, {
        // Additional PhantomJS options.
        options: options,
        // Do stuff when done.
        done: function(err) {
          if (err) {
            // If there was an error, abort the series.
            done();
          } else {
            // Otherwise, process next url.
            next();
          }
        },
      });
    },
    // All tests have been run.
    function() {
      // Log results.
      // NOTE: do not fail the task if 'force' option was specified
      if (status.failed > 0) {
        var failMsg = (status.failed + '/' + status.total + ' assertions failed (' + status.duration + 'ms)');
        if (options.force) {
          grunt.log.warn(failMsg);
          grunt.log.writeln("\nExecution continues as option 'force' was set");
        } else {
          grunt.fail.warn(failMsg);
        }
      } else if (status.total === 0) {
        grunt.fail.warn('0/0 assertions ran (' + status.duration + 'ms)');
      } else {
        grunt.log.writeln();
        grunt.log.ok(status.total + ' assertions passed (' + status.duration + 'ms)');
      }
      // teardown: remove events handlers
      if (disposables.length) {
        disposables.forEach(function (item) {
          phantomjs.off(item[0], item[1]);
        });
      }
      // All done!
      done();
    });
  });

};
