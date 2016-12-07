/*
 * grunt-croc-qunit
 *
 * Copyright (c) 2013 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'tasks/**/*.js',
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    // Create a local web server for testing http:// URIs.
    connect: {
      root_server: {
        options: {
          port: 9000,
          base: '.',
        },
      },
      test_server: {
        options: {
          port: 9001,
          base: 'test',
        },
      }
    },

    // Unit tests.
    qunit: {
      options: {
          phantomPath: require('phantomjs').path
          //verbose: false
      },
      all_tests: ['test/*{1,2}.html'],
      individual_tests: {
        files: [
          {src: 'test/*1.html'},
          {src: 'test/*{1,2}.html'},
        ]
      },
      urls: {
        options: {
          urls: [
            'http://localhost:9000/test/qunit1.html',
            'http://localhost:9001/qunit2.html',
          ]
        },
      },
      urls_and_files: {
        options: {
          urls: '<%= qunit.urls.options.urls %>',
        },
        src: 'test/*{1,2}.html',
      },
    },
    'test-phantom': {
      basic: {
        options: {
          url: 'test/fixtures/basic.html',
          phantomPath: require('phantomjs').path,
          expected: [1, 2, 3, 4, 5, 6],
          test: function test(a, b, c) {
            if (!test.actual) { test.actual = []; }
            test.actual.push(a, b, c);
          }
        }
      },
      inject: {
        options: {
          url: 'test/fixtures/inject.html',
          phantomPath: require('phantomjs').path,
          inject: require('path').resolve('test/fixtures/inject.js'),
          expected: 'injected',
          test: function test(msg) {
            test.actual = msg;
          }
        }
      }
    }
  });

  // The most basic of tests. Not even remotely comprehensive.
  grunt.registerMultiTask('test-phantom', function() {
    var options = this.options();
    var phantomjs = require('./tasks/phantomjs').init(grunt);

    // Do something.
    phantomjs.on('test', options.test);
    phantomjs.on('done', phantomjs.halt);

    // Built-in error handlers.
    phantomjs.on('fail.load', function(url) {
      phantomjs.halt();
      grunt.verbose.write('Running PhantomJS...').or.write('...');
      grunt.log.error();
      grunt.warn('PhantomJS unable to load "' + url + '" URI.');
    });

    phantomjs.on('fail.timeout', function() {
      phantomjs.halt();
      grunt.log.writeln();
      grunt.warn('PhantomJS timed out.');
    });

    // This task is async.
    var done = this.async();

    // Spawn phantomjs
    phantomjs.spawn(options.url, {
      // Additional PhantomJS options.
      options: options,
      // Complete the task when done.
      done: function(err) {
        if (err) { done(err); return; }
        var assert = require('assert');
        var difflet = require('difflet')({indent: 2, comment: true});
        try {
          assert.deepEqual(options.test.actual, options.expected, 'Actual should match expected.');
          grunt.log.writeln('Test passed.');
          done();
        } catch (err) {
          grunt.log.subhead('Assertion Failure');
          console.log(difflet.compare(err.expected, err.actual));
          done(err);
        }
      }
    });
  });

  // Build a mapping of url success counters.
  var successes = {};
  var currentUrl;
  grunt.event.on('qunit.spawn', function(url) {
    currentUrl = url;
    if (!successes[currentUrl]) { successes[currentUrl] = 0; }
  });
  grunt.event.on('qunit.done', function(details) {
    var failed = details.failed, 
        passed = details.passed;
    if (failed === 0 && passed === 2) { successes[currentUrl]++; }
  });

  grunt.registerTask('really-test', 'Test to see if qunit task actually worked.', function() {
    var assert = require('assert');
    var difflet = require('difflet')({indent: 2, comment: true});
    var actual = successes;
    var expected = {
      'test/qunit1.html': 3,
      'test/qunit2.html': 3,
      'http://localhost:9000/test/qunit1.html': 2,
      'http://localhost:9001/qunit2.html': 2
    };
    try {
      assert.deepEqual(actual, expected, 'Actual should match expected.');
    } catch (err) {
      grunt.log.subhead('Actual should match expected.');
      console.log(difflet.compare(expected, actual));
      throw new Error(err.message);
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-connect');
  //grunt.loadNpmTasks('grunt-contrib-internal');

  // Whenever the "test" task is run, run some basic tests.
  grunt.registerTask('test-task', ['connect', 'qunit', 'really-test']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['jshint', 'test-phantom', 'test-task']);

};