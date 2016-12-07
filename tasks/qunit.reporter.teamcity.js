'use strict';

var testName;
var errorMessages = [];
var errorDetails = [];
var completed = 0;	// for debug info only

/**
 регулярное выражение для escape
 зачем и почему так - см тут http://confluence.jetbrains.net/display/TCD65/Build+Script+Interaction+with+TeamCity#BuildScriptInteractionwithTeamCity-ReportingTests
 */
var tsEscapeRegexp = /[\'\|\]\[\n\r\u0085\u2028\u2029]/g;

/**
 выполняет escape переданной строки
 правила заточены под service message для teamcity (см. ссылку выше)
 @param value - строка для обработки
 */
function _tcEscape(value) {
	var ret = value.replace(tsEscapeRegexp, function (str) {
		var result;
		switch (str) {
			case '\n':
				result = '|n';
				break;
			case '\r':
				result = '|r';
				break;
			case '\u0085':
				result = '|x';
				break;
			case '\u2028':
				result = '|l';
				break;
			case '\u2029':
				result = '|p';
				break;
			default:
				result = "|" + str;
		}
		return result;
	});

	return ret;
}

/**
 @param arg - { name }
 */
function moduleStart(t) {
	console.log("##teamcity[testSuiteStarted name='" + _tcEscape(t.name) + "']");
}

/**
 @param arg - { name, failed, passed, total }
 */
function moduleDone(t) {
	console.log("##teamcity[testSuiteFinished name='" + _tcEscape(t.name) + "']");
}

/**
 @param arg - { name }
 */
function testStart(t) {
	testName = t.name;
	errorMessages = [];
	errorDetails = [];
	console.log("##teamcity[testStarted name='" + _tcEscape(t.name) + "']");
}

/**
 @param arg - { name, failed, passed, total }
 */
function testDone(t) {
	if (0 !== t.failed) {
		console.log("##teamcity[testFailed name='" + _tcEscape(t.name) + "' message='" +
			_tcEscape(errorMessages.join("; ")) + "' details='" + _tcEscape(errorDetails.join("\n")) + "']");
	}
	console.log("##teamcity[testFinished name='" + _tcEscape(t.name) + "']");

	//console.log("DEBUG: Test completed: " + ++completed + " [name='" + _tcEscape(t.name) + "']");
}

/**
 * See http://api.qunitjs.com/QUnit.log/
 * @param arg - { result, actual, expected, message }
 */
function assert(t) {
	if (!t.result) {
		errorMessages.push(t.message);

		var errorDetail;
		if (t.expected === undefined && t.actual === undefined) {
			errorDetail = 'Test "' + testName + '" assertion failed' + (t.message ? ': "' + t.message + '"' : '');
		} else {
			errorDetail = 'Test "' + testName + '" assertion failed. Expected <' + t.expected + '> Actual <' + t.actual + '>' + (t.message ? ': "' + t.message + '"' : '');
		}

		errorDetails.push(errorDetail);
	}
}

function log() {
	console.log.apply(console, arguments);
}

var exports = {
	init: function (grunt) {},
	begin: function () {},
	moduleStart: moduleStart,
	moduleDone: moduleDone,
	testStart: testStart,
	testDone: testDone,
	assert: assert,
	log: log,
	done: function () {}
};

module.exports = exports;
