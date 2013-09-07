# grunt-croc-qunit [![Build Status](https://travis-ci.org/CrocInc/grunt-croc-qunit.png?branch=master)](https://travis-ci.org/CrocInc/grunt-croc-qunit)

[![NPM](https://nodei.co/npm/grunt-croc-qunit.png?downloads=true&stars=true)](https://nodei.co/npm/grunt-croc-qunit/)

> Run QUnit unit tests in a headless PhantomJS instance with code coverage support.


## Overview
This plugin is modified version of two plugins: [grunt-contrib-qunit][] and [grunt-lib-phantomjs][].
Here's reasoning why it was forked and modified.
Original grunt-contrib-qunit creates the following dependencies tree:
* grunt-contrib-qunit -> grunt-lib-phantomjs -> phantomjs npm module -> PhantomJS

This works great when you install [grunt-contrib-qunit][] from official npm registry. All dependencies downloaded and installed automatically.
But [phantomjs npm module][] has very specific feature: on installation after [PhantomJS][] downloading it hardcodes absolute path to its executable.
Such bahavior makes it impossible to share `node_modules` folder between machines. 
Consequently, it's impossible to keep `node_modules` in VCS (Git/Subversion).

That's because this plugin was created. It does not depend on [grunt-lib-phantomjs][] nor [phantomjs npm module][].
It expects that you will install [PhantomJS][] on your own and supply path to its executable in task's options.

[grunt-contrib-qunit]: https://github.com/gruntjs/grunt-contrib-qunit
[grunt-lib-phantomjs]: https://github.com/gruntjs/grunt-lib-phantomjs
[phantomjs npm module]: https://github.com/Obvious/phantomjs
[PhantomJS]: http://www.phantomjs.org/

Also there are other distinctions from original grunt-contrib-qunit:  

-  additinal tasks for generating code coverage reports via [Istanbul][]
-  `bridge.js` script was modified to remove excess processing of QUnit.equal's arguments (see [this issue](https://github.com/gruntjs/grunt-contrib-qunit/issues/44))  
-  `bridge.js` reports code coverage info from `window.__coverage__` as phantomjs' `qunit.coverage` event on test completion
-  added `eventHandlers` option for qunit task 
 
## Getting Started
This plugin requires Grunt `~0.4.0`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-croc-qunit --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-croc-qunit');
```
Or just use matchdep module.

NOTE: loadNpmTasks will depricate in Grunt 0.5


## QUnit task
_Run this task with the `grunt qunit` command._

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

Please note that this plugin doesn't download and install [PhantomJS][].

For running qunit tests you'll need to manually install PhantomJS first into some reachable place. You can use [phantomjs npm module][] for this.

[PhantomJS]: http://www.phantomjs.org/
[phantomjs npm module]: https://github.com/Obvious/phantomjs

Also note that running grunt with the `--debug` flag will output a lot of PhantomJS-specific debugging information. This can be very helpful in seeing what actual URIs are being requested and received by PhantomJS.
### Options

#### phantomPath
Type: `String`  
Default: (none)  
Required: yes

The path to PhantomJS executable. It can be absolute or relative to the current working directory (by default it's folder where Gruntfile.js lives).  

#### eventHandlers
Type: `Object`  
Default: (none)

An object map where keys are event names and values are event handlers.

 
#### timeout
Type: `Number`  
Default: `5000`

The amount of time (in milliseconds) that grunt will wait for a QUnit `start()` call before failing the task with an error.

#### inject
Type: `String`  
Default: (built-in)

Path to an alternate QUnit-PhantomJS bridge file to be injected. See [the built-in bridge](https://github.com/CrocInc/grunt-croc-qunit/blob/master/phantomjs/bridge.js) for more information.

#### urls
Type: `Array`  
Default: `[]`

Absolute `http://` or `https://` urls to be passed to PhantomJS. Specified URLs will be merged with any specified `src` files first. Note that urls must be served by a web server, and since this task doesn't contain a web server, one will need to be configured separately. The [grunt-contrib-connect plugin](https://github.com/gruntjs/grunt-contrib-connect) provides a basic web server.

#### (-- PhantomJS arguments)
Type: `String`  
Default: (none)

Additional `--` style arguments that need to be passed in to PhantomJS may be specified as options, like `{'--option': 'value'}`. This may be useful for specifying a cookies file, local storage file, or a proxy. See the [PhantomJS API Reference][] for a list of `--` options that PhantomJS supports.


### Usage examples

#### Wildcards
In this example, `grunt qunit:all` will test all `.html` files in the test directory _and all subdirectories_. First, the wildcard is expanded to match each individual file. Then, each matched filename is passed to [PhantomJS][] (one at a time).

```javascript  
// Project configuration.
grunt.initConfig({
  qunit: {
    options: {
      'phantomPath': 'tools/phantomjs/phantomjs.exe'
    },
    all: ['test/**/*.html']
  }
});
```

#### Testing via http:// or https://
In circumstances where running unit tests from local files is inadequate, you can specify `http://` or `https://` URLs via the `urls` option. Each URL is passed to [PhantomJS][] (one at a time).

In this example, `grunt qunit` will test two files, served from the server running at `localhost:8000`.

```js
// Project configuration.
grunt.initConfig({
  qunit: {
    options: {
      'phantomPath': 'node_modules/phantomjs/lib/phantom/phantomjs.exe'
    },
    all: {
      options: {
        urls: [
          'http://localhost:8000/tests/run-tests.html?filter=UnitTest1',
          'http://localhost:8000/tests/run-tests.html?filter=UnitTest1'
        ]
      }
    }
  }
});
```

Wildcards and URLs may be combined by specifying both.

#### Using the grunt-contrib-connect plugin
It's important to note that grunt does not automatically start a `localhost` web server. That being said, the [grunt-contrib-connect plugin][] `connect` task can be run before the `qunit` task to serve files via a simple [connect][] web server.

[grunt-contrib-connect plugin]: https://github.com/gruntjs/grunt-contrib-connect
[connect]: http://www.senchalabs.org/connect/

In the following example, if a web server isn't running at `localhost:8000`, running `grunt qunit` with the following configuration will fail because the `qunit` task won't be able to load the specified URLs. However, running `grunt connect qunit` will first start a static [connect][] web server at `localhost:8000` with its base path set to the Gruntfile's directory. Then, the `qunit` task will be run, requesting the specified URLs.

```js
// Project configuration.
grunt.initConfig({
  qunit: {
    options: {
      'phantomPath': 'node_modules/phantomjs/lib/phantom/phantomjs.exe'
    },
    testserver: {
      options: {
        urls: [          
          'http://localhost:8000/tests/run-tests.html'
        ]
      }
    }
  },
  connect: {
    testserver: {
      options: {
        port: 8000,
        base: '.'
      }
    }
  }
});

// This plugin provides the "connect" task.
grunt.loadNpmTasks('grunt-contrib-connect');

// A convenient task alias.
grunt.registerTask('test', ['connect:testserver', 'qunit:testserver']);
```

#### Custom timeouts and PhantomJS options
In the following example, the default timeout value of `5000` is overridden with the value `10000` (timeout values are in milliseconds). Additionally, PhantomJS will read stored cookies from the specified file. See the [PhantomJS API Reference][] for a list of `--` options that PhantomJS supports.

[PhantomJS API Reference]: https://github.com/ariya/phantomjs/wiki/API-Reference

```js
// Project configuration.
grunt.initConfig({
  qunit: {
    options: {
      timeout: 10000,
      '--cookies-file': 'misc/cookies.txt'
    },
    all: ['test/**/*.html']
  }
});
```

#### Events and reporting
[QUnit callback](http://api.qunitjs.com/category/callbacks/) methods and arguments are also emitted through grunt's event system so that you may build custom reporting tools. Please refer to the QUnit documentation for more information.

The events (with arguments) are as follows:

* `qunit.begin`
* `qunit.moduleStart`: name
* `qunit.testStart`: name
* `qunit.log`: result, message, source
* `qunit.testDone`: name, failed, passed, total
* `qunit.moduleDone`: name, failed, passed, total
* `qunit.done`: failed, passed, total, runtime
* `qunit.coverage`: coverage

In addition to QUnit callback-named events, the following event is emitted when [PhantomJS][] is spawned for a test:

* `qunit.spawn`: url

You may listen for these events like so:

```js
grunt.event.on('qunit.spawn', function (url) {
  grunt.log.ok("Running test: " + url);
});
```

Additionally you can supply an object in `eventHandlers` task's option.   
```js
	qunit:{
		options: {
			'phantomPath': '../../Tools/phantomjs/phantomjs.exe'
		},
		test: {
			options: {
				eventHandlers: {
					'qunit.coverage': function (coverage) {
						grunt.file.write('.tmp/coverage.json', JSON.stringify(coverage));
					}
				},
			    urls: ['http://127.0.0.1:9002/tests-runner.html']
			}
		}
	}
```

The event `qunit.coverage` allows using [Istanbul][] code coverage library. See next chapter.

[Istanbul]: https://github.com/gotwarlost/istanbul/



## Istanbul tasks (coverageInstrument, coverageReport)

When you have loaded the plugin (via `grunt.loadNpmTasks`) you have some tasks available besides `qunit`. These tasks are for creating code coverage reports using [Istanbul][]:  

- coverageInstrument
- coverageReport

[Istanbul]: https://github.com/gotwarlost/istanbul/

The plugin doesn't depend on Istanbul module directly. So it doesn't add additional dependency into your project if we arn't going to use code coverage with Istanbul.
If you decided to use Istanbul for code coverage you will need to install Istanbul:
`npm install istanbul --save-dev`.

### `coverageInstrument` task

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.
Task's `src` specifies what files will be instrumented. Task's parameters should describe a set of `*.js` files. Task's `dest` specified where instrumented files will be saved (some kind of temporary folder). These instrumented files should be used during tests execution.
 
#### src
Type: `String`  
Required: yes

`*.js` files to instrument

#### dest
Type: `String`  
Required: yes

The folder where instrumented files will be saved.

#### autoBind
Type: `Boolean`  
Required: no  
Default: `true`  

If `autoBind` option is set then the task will automatically adds a handler for `qunit.coverage` event via `qunit` task's options (see `eventHandlers` option). Also the task will define `coverageFile` option for `coverageReport` task (coverage file will be placed into `dest` folder). So by default you can leave your `qunit` task untouched and get coverage reports.


### `coverageReport` task
`coverageReport` task controls what reports to generate from coverage info. In most cases coverage info is a json file created on qunit test completion. You can use `qunit.coverage` event to manually handle coverage info and save it into a file or leave it to happen automatically if `autoBind` option was set for `coverageInstrument` task.

#### coverageFile
Type: `String`    
Default: (none)    
Required: yes  

The file path to `coverage.json` file with coverage info saved after tests completion. To create this file you can use `qunit.coverage` event. See example below.  
This option is set automatically if `autoBind` option of `coverageInstrument` task is specified (by default). 

#### reports
Type: `Object`    
Required: no  

An object to specify what reports should be generated. The object's key can be any report name which Istanbul supports (`html`, `lcov`, `text`; see the [doc](https://github.com/gotwarlost/istanbul/#the-report-command) for details). The key's value should be a folder path  where the report will be created.


### Usage example

It doesn't make much sence to run tasks `coverageInstrument` and `coverageReport` individually. Instead they are designed to be run in a pipeline with `qunit` task.
But they were designed specifically to be independent from `qunit` task to simplify re-using if you will.

```js
	grunt.initConfig({
		qunit:{
			options: {
				'phantomPath': '../../Tools/phantomjs/phantomjs.exe'
			},
			test: {
				options: {
				    // url which `connect` server will be serve
				    urls: ['http://127.0.0.1:<%= connect.testcoverage.options.port %>/tests-runner.html']
				}
			}
		},
		connect: {
			testcoverage: {
				options: {
					port: 9002,
					hostname: '127.0.0.1',
					middleware: function (connect) {
						return [
							// instrumented sources first
							mountFolder(connect, '.tmp'),
							// then the rest of sources
							mountFolder(connect, 'src'),
							// then test fixtures and helpers
							mountFolder(connect, 'tests')
						];
					}
				}
			}
		},
		coverageInstrument: {
			test: {
				// NOTE: we instrument only subset of our sources ('lib')
				src: 'lib/**/*.js',
				expand: true,
				cwd: 'src',
				dest: '.tmp'
			}
		},
		coverageReport: {
			test: {
				options: {
	    			reports: {
	    				html: '.tmp/coverageReports/html/' 
	    			}
	    		}
			}
		}
	});
	grunt.registerTask('testcoverage', ['coverageInstrument', 'connect:testcoverage', 'qunit:test', 'coverageReport']);
```

Now just run: `grunt testcoverage`


## Release History
 * 2013-09-07	v0.2.1  Added sample project with Gruntfile.js to run unit tests with code coverage
 * 2013-09-02	v0.2.0  Added autoBind option for coverageInstrument task to simplify using coverage tasks 
 * 2013-08-30	v0.1.2  Added tasks coverageInstrument/coverageReport for code coverage via Istanbul 
 * 2013-08-30			Added 'qunit.coverage' event which is reported on tests completion with window.__coverage__ object.
 * 2013-08-28			Added 'eventHandlers' option for passing phantomjs' events handlers
 * 2013-08-27	v0.1.0	Forked from grunt-contrib-qunit and grunt-lib-phantomjs and modified - first working version

---
Task submitted by [Sergei Dorogin](http://dorogin.com)

(c) Copyright CROC Inc. 2013

Original tasks ([grunt-contrib-qunit][] and [grunt-lib-phantomjs][]) were authored by:

* ["Cowboy" Ben Alman](http://benalman.com/)
* [Tyler Kellen](http://goingslowly.com/)
