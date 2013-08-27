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

function absUnix (p) {
  return p.charAt(0) === "/" || p === "";
}

function absWin (p) {
  if (absUnix(p)) {
    return true;
  }
  // pull off the device/UNC bit from a windows path.
  // from node's lib/path.js
  var splitDeviceRe =
        /^([a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?([\\\/])?/
    , result = splitDeviceRe.exec(p)
    , device = result[1] || ''
    , isUnc = device && device.charAt(1) !== ':'
    , isAbsolute = !!result[2] || isUnc; // UNC paths are always absolute

  return isAbsolute;
}

var isAbsolute = process.platform === "win32" ? absWin : absUnix;

exports.init = function(grunt) {

  // Nodejs libs.
  var path = require('path');

  // External libs.
  var semver = require('semver');
  var Tempfile = require('temporary/lib/file');
  var EventEmitter2 = require('eventemitter2').EventEmitter2;

  // The module to be exported is an event emitter.
  var exports = new EventEmitter2({wildcard: true});

  // Get an asset file, local to the root of the project.
  var asset = path.join.bind(null, __dirname, '..');

  // Call this when everything has finished successfully... or when something
  // horrible happens, and you need to clean up and abort.
  var halted;
  exports.halt = function() {
    halted = true;
  };

  // Start PhantomJS process.
  exports.spawn = function(pageUrl, options) {
    // Create temporary file to be used for grunt-phantom communication.
    var tempfile = new Tempfile();
    // Timeout ID.
    var id;
    // The number of tempfile lines already read.
    var n = 0;
    // Reset halted flag.
    halted = null;

    // All done? Clean up!
    var cleanup = function() {
      clearTimeout(id);
      tempfile.unlink();
    };

    // Internal methods.
    var privates = {
      // Abort if PhantomJS version isn't adequate.
      version: function(version) {
        var current = [version.major, version.minor, version.patch].join('.');
        var required = '>= 1.6.0';
        if (!semver.satisfies(current, required)) {
          exports.halt();
          grunt.log.writeln();
          grunt.log.errorlns(
            'In order for this task to work properly, PhantomJS version ' +
            required + ' must be installed, but version ' + current +
            ' was detected.'
          );
          grunt.warn('The correct version of PhantomJS needs to be installed.', 127);
        }
      }
    };

    // It's simple. As the page running in PhantomJS alerts messages, they
    // are written as JSON to a temporary file. This polling loop checks that
    // file for new lines, and for each one parses its JSON and emits the
    // corresponding event with the specified arguments.
    (function loopy() {
      // Disable logging temporarily.
      grunt.log.muted = true;
      // Read the file, splitting lines on \n, and removing a trailing line.
      var lines = grunt.file.read(tempfile.path).split('\n').slice(0, -1);
      // Re-enable logging.
      grunt.log.muted = false;
      // Iterate over all lines that haven't already been processed.
      var done = lines.slice(n).some(function(line) {
        // Get args and method.
        var args = JSON.parse(line);
        var eventName = args[0];
        // Debugging messages.
        grunt.log.debug(JSON.stringify(['phantomjs'].concat(args)).magenta);
        if (eventName === 'private') {
          // If a private (internal) message is passed, execute the
          // corresponding method.
          privates[args[1]].apply(null, args.slice(2));
        } else {
          // Otherwise, emit the event with its arguments.
          exports.emit.apply(exports, args);
        }
        // If halted, return true. Because the Array#some method was used,
        // this not only sets "done" to true, but stops further iteration
        // from occurring.
        return halted;
      });

      if (done) {
        // All done.
        cleanup();
        options.done(null);
      } else {
        // Update n so previously processed lines are ignored.
        n = lines.length;
        // Check back in a little bit.
        id = setTimeout(loopy, 100);
      }
    }());

    // Process options.
    var failCode = options.failCode || 0;

    // An array of optional PhantomJS --args.
    var args = [];
    // Additional options for the PhantomJS main.js script.
    var opts = {};

    // Build args array / opts object.
    Object.keys(options.options).forEach(function(key) {
      if (/^\-\-/.test(key)) {
        args.push(key + '=' + options.options[key]);
      } else {
        opts[key] = options.options[key];
      }
    });
    // Get path to phantomjs binary
    var binPath = opts.phantomPath;
    if (!binPath) {
      grunt.warn('Required option phantomPath (path to phantomjs.exe) was not specified.', failCode);
      options.done(failCode);
      return;
    }
    delete opts.phantomPath;

    if (!isAbsolute(binPath)) {
      binPath = path.join(process.cwd(), binPath);
    }

    // Keep -- PhantomJS args first, followed by grunt-specific args.
    args.push(
      // The main PhantomJS script file.
      opts.phantomScript || asset('phantomjs/main.js'),
      // The temporary file used for communications.
      tempfile.path,
      // URL or path to the page .html test file to run.
      pageUrl,
      // Additional PhantomJS options.
      JSON.stringify(opts)
    );

    grunt.log.debug(JSON.stringify(args));
    grunt.verbose.writeln('Starting ' + binPath);
    // Actually spawn PhantomJS.
    return grunt.util.spawn({
      cmd: binPath,
      args: args
    }, function(err, result, code) {
      if (!err) { return; }
      // Something went horribly wrong.
      cleanup();
      grunt.verbose.or.writeln();
      grunt.log.write('Running PhantomJS...').error();
      if (code === 127) {
        grunt.log.errorlns(
          'In order for this task to work properly, PhantomJS must be installed locally via NPM. ' +
          'If you\'re seeing this message, generally that means the NPM install has failed. ' +
          'Please submit an issue providing as much detail as possible at: ' +
          'https://github.com/gruntjs/grunt-lib-phantomjs/issues'
        );
        grunt.warn('PhantomJS not found.', failCode);
      } else {
        String(result).split('\n').forEach(grunt.log.error, grunt.log);
        grunt.warn('PhantomJS exited unexpectedly with exit code ' + code + '.', failCode);
      }
      options.done(code);
    });
  };

  return exports;
};
