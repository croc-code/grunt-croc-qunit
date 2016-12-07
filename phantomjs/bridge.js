/*
 * @overview
 * grunt-croc-qunit
 * Script to inject into PhantomJS to create a bridge between QUnit and main.js
 * 
 * @copyright
 * Copyright (c) 2013-2016 CROC Inc., Sergei Dorogin
 * Copyright (c) 2013 "Cowboy" Ben Alman, contributors
 * Licensed under the MIT license.
 */

/*global QUnit:true, alert:true*/
(function () {
  'use strict';

  // Don't re-order tests.
  QUnit.config.reorder = false;
  // Run tests serially, not in parallel.
  QUnit.config.autorun = false;

  // Send messages to the parent PhantomJS process via alert!
  function sendMessage() {
    var args = [].slice.call(arguments);
    alert(JSON.stringify(args));
  }

  // These methods connect QUnit to PhantomJS.
  QUnit.log(function(details) {
    // TODO: What the fuck is it? 
    if (details.message === '[object Object], undefined:undefined') { return; }

    // See http://api.qunitjs.com/QUnit.log/
    try {
		JSON.stringify(details.actual);
    } catch(_) {
	    console.warn("Browser: cannot serialize assert argument (actual), keys: " + Object.keys(details.actual) + (details.source ? ", source" + details.source:"") );
    	details.actual = undefined;
    	details.expected = undefined;
    }
    try {
		JSON.stringify(details.expected);
    } catch(_) {
	    console.warn("Browser: cannot serialize assert argument (expected), keys: " + Object.keys(details.expected) + (details.source ? ", source" + details.source:"") );
    	details.actual = undefined;
    	details.expected = undefined;
    }

    sendMessage('qunit.log', details);
  });

  QUnit.testStart(function(details) {
    // See http://api.qunitjs.com/QUnit.testStart/
    sendMessage('qunit.testStart', details);
  });

  QUnit.testDone(function(details) {
    // http://api.qunitjs.com/QUnit.testDone/
    sendMessage('qunit.testDone', details);
  });

  QUnit.moduleStart(function(details) {
    // http://api.qunitjs.com/QUnit.moduleStart/
    sendMessage('qunit.moduleStart', details);
  });

  QUnit.moduleDone(function(details) {
    // http://api.qunitjs.com/QUnit.moduleDone/
    sendMessage('qunit.moduleDone', details);
  });

  QUnit.begin(function(details) {
    // http://api.qunitjs.com/QUnit.begin/
    sendMessage('qunit.begin', details);
  });

  QUnit.done(function(details) {
    // http://api.qunitjs.com/QUnit.done/

    // send coverage data if available
    if (window.__coverage__) {
      sendMessage('qunit.coverage', window.__coverage__);
    }

    sendMessage('qunit.done', details);
  });
}());