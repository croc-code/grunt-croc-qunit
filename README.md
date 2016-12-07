# grunt-croc-qunit [![Build Status](https://travis-ci.org/CrocInc/grunt-croc-qunit.png?branch=master)](https://travis-ci.org/CrocInc/grunt-croc-qunit)

[![NPM](https://nodei.co/npm/grunt-croc-qunit.png?downloads=true&downloadRank=true)](https://nodei.co/npm/grunt-croc-qunit/)  

> Run QUnit unit tests in a headless PhantomJS instance with code coverage support.


## Overview
This plugin is modified version of two plugins: [grunt-contrib-qunit][] and [grunt-lib-phantomjs][].
Here's reasoning why it was forked and modified.

Original `grunt-contrib-qunit` creates the following dependencies tree:
* grunt-contrib-qunit -> grunt-lib-phantomjs -> phantomjs npm module -> PhantomJS

This works great when you install [grunt-contrib-qunit][] from official npm registry. All dependencies downloaded and installed automatically.
But [phantomjs npm module][] has very specific feature: on installation after [PhantomJS][] downloading it hardcodes absolute path to its executable.
Such behavior makes it impossible to share `node_modules` folder between machines. 
Consequently, it's impossible to keep `node_modules` in VCS (Git/Subversion).

That's because this plugin was created. It does not depend on `grunt-lib-phantomjs` and `phantomjs` npm modules.
It expects that you will install [PhantomJS][] on your own and supply path to its executable in task's options.

[grunt-contrib-qunit]: https://github.com/gruntjs/grunt-contrib-qunit
[grunt-lib-phantomjs]: https://github.com/gruntjs/grunt-lib-phantomjs
[phantomjs npm module]: https://github.com/Obvious/phantomjs
[PhantomJS]: http://www.phantomjs.org/

There are other distinctions from original `grunt-contrib-qunit`:  

-  additinal tasks for generating code coverage reports via [Istanbul][]
-  `bridge.js` script was modified to remove excess processing of QUnit.equal's arguments (see [this issue](https://github.com/gruntjs/grunt-contrib-qunit/issues/44))  
-  `bridge.js` reports code coverage info from `window.__coverage__` as phantomjs' `qunit.coverage` event on test completion
-  added `eventHandlers` option for `qunit` task
-  different reporters support: logging test results by default is done to console (via grunt.log), but there is another reporter "teamcity" which reports result in [JetBrains TeamCity](https://www.jetbrains.com/teamcity/) syntax.

> Pay attention not to redefine `window.alert` as it is used internally by the tasks for coordination purposes
 
## Getting Started
 
To install the plugin:

```shell
npm install grunt-croc-qunit --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-croc-qunit');
```
Or just use `matchdep` module.


## QUnit task
_Grunt task for executing [QUnit][] tests inside PhantomJS_.

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

Please note that this plugin doesn't download and install [PhantomJS][].

For running [QUnit][] tests you'll need to manually install PhantomJS first into some reachable place. You can use [phantomjs npm module][] for this.

[QUnit]: http://qunitjs.com/
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

#### force
Type: `boolean`  
Default: `false`

Do not fail task if some failed

#### reporter
Type: `String`  
Values: "console" | "teamcity"  
Default: "console"  

Name of reporter to use. By default plugin will report progress to console (via `grunt.log`).

Specify "teamcity" for usage of a reporter which uses [TeamCity syntax](https://confluence.jetbrains.com/display/TCD10/Build+Script+Interaction+with+TeamCity#BuildScriptInteractionwithTeamCity-ReportingTests).

#### verbose
Type: `Boolean`  
Default: `true`  

Use `false` to more concise output (only module start/end and test pass/fail result will be logged).

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

#### Specifying filter for QUnit
It can be usefull to run a single test. QUnit supports `filter` query string parameter. If the parameter is specified then QUnit executes only tests which names satisfy the filter.

```js
grunt.initConfig({
  qunit:{
    options: {
      'phantomPath': '../../Tools/phantomjs/phantomjs.exe',
      urlFilter: ""
    },
    test: {
      options: {
      urls: ['http://127.0.0.1:<%= connect.test.options.port %>/tests-runner.html<%= qunit.options.urlFilter %>']
    }
  },
  connect: {
    test: {
      options: {
        port: 8001,
        base: '.'
      }
    }
  }
});

grunt.registerTask('test', function (target) {
  addQUnitUrlFilter('qunit.options.urlFilter');
  var filter = grunt.option('filter');
  if (filter) {
    grunt.config.set(taskPropName, '?filter=' + filter);
  }	
  grunt.task.run(['qunit:test']);
});	

```
Now you can execute a single test (or any other ones with filter) via QUnit as: `grunt test --filter=MyTestName`


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

The events are as follows :

* `qunit.begin`
* `qunit.moduleStart`
* `qunit.testStart`
* `qunit.log`
* `qunit.testDone`
* `qunit.moduleDone`
* `qunit.done`
* `qunit.coverage`

Starting with v1.0 events arguments are the same in QUnit callbacks.

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



## Code coverage tasks

The module contains Grunt tasks `coverageInstrument`, `coverageReport` for code coverage via [Istanbul][].

When you have loaded the plugin (via `grunt.loadNpmTasks`) you have some tasks available besides `qunit`. These tasks are for creating code coverage reports using [Istanbul][]:  

- coverageInstrument
- coverageReport

[Istanbul]: https://github.com/gotwarlost/istanbul/

The plugin doesn't depend on Istanbul module directly. So it doesn't add additional dependency into your project if you aren't going to use code coverage with Istanbul.
If you decide to use Istanbul for code coverage you will need to install Istanbul:
`npm install istanbul --save-dev`.

You should also install [grunt-contrib-connect][] and [serve-static][] in order to be able to generate the static web server that will allow you to execute the instrumented .js code in place of the original .js code:
``` 
npm install grunt-contrib-connect serve-static --save-dev
```

[grunt-contrib-connect]: https://www.npmjs.com/package/grunt-contrib-connect
[serve-static]: https://www.npmjs.com/package/serve-static

Code coverage tasks are supposed to be run in the following order: coverageInstrument => connect:testcoverage => qunit => coverageReport.


### `coverageInstrument` task

Task targets, files and options may be specified according to the grunt [Configuring tasks](http://gruntjs.com/configuring-tasks) guide.

Task's `src` specifies what files will be instrumented. Task's parameters should describe a set of `*.js` files. Task's `dest` property specifies a folder path where instrumented files will be saved (some kind of temporary folder). These instrumented files should be used during tests execution.     
The task `src-dest` mappings specification use standard [Grunt rules for files processing](http://gruntjs.com/configuring-tasks#files).
 
#### src
Type: `String`  
Required: yes

`src`, `expand`, `cwd` properties should descibe a set of `*.js` files to instument.

#### dest
Type: `String`  
Required: yes

A folder path where instrumented files will be saved.

#### Options
##### autoBind
Type: `Boolean`  
Required: no  
Default: `true`  

If `autoBind` option is set then the task will automatically adds a handler for `qunit.coverage` event via `qunit` task's options (see `eventHandlers` option). Also the task will define `coverageFile` option for `coverageReport` task (coverage file will be placed into `dest` folder). So by default you can leave your `qunit` task untouched and get coverage reports.

##### `connect:testcoverage`

In order to be able to substitute the original sources with the instrumented sources without having to modify the test files, one should create a webserver serving static content that can server the instrumented sources as the original one.

The `grub-contrib-connect` and `serve-static` packages allow the on-the-fly creation of a local web server where the tests can be run and where the http://localhost:port/src will be associated with the instrumented local version of the sources files. The middleware functionnality of connect is exploited and a specific mountFolder function is used in order to associate the web server aliases with the local folders.  

```js
  var serveStatic = require('serve-static');

	grunt.initConfig({...,
		connect: {
			testcoverage: {
				options: {
					..
					middleware: function (connect) {
						return [
							// instrumented sources first as "regular" sources
							serveStatic('.tmp'),
							// then test fixtures and libs
							serveStatic('tests'),
							serveStatic('libs'),
						];
					}
				}
			}
		}, ...});
	}
```

##### generateModule
Type: `Object`  
Required: no  

The option allows to generade a AMD module with imports of all instrumented files. This is usefull for getting more accurate coverage reports. If an instrumeneted file wasn't loaded during tests execution then coverage report won't take it into account at all and you'll get falsy high numbers of coverage. 

For getting correct numbers of code coverage you need to load all your  files during test execution. You can do it manually or allow `coverageInstrument` task to do it for you.
The task supposes that all files are AMD-modules (e.g. loaded via [RequireJS](http://requirejs.org/) or the like). In your main module for tests you can import a stub like 'all-modules'. Then tell `coverageInstrument` task to replace the stub with generated module which will contain imports of all instrumented files.  

For more info see examples below.  
  
`generateModule` option is an object with properties:
  
* `output` - path to generated module (i.e. js file path):  
Type: `String`  
Required: yes
* `ignore` - an array of module names to ignore (they won't be included into generated module):   
Type: `Array`  
Required: no

Generated AMD-module will contain imports of modules which names are relative to the module folder.

For example if `generateModule.output` equals to `.tmp/all-modules.js` then all module names will relative to '.tmp' folder. It's supposed that instrumented files are put into the same folder (via `dest` option).


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
  var serveStatic = require('serve-static');

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
							// instrumented sources first as real src through alias usage
							serveStatic('.tmp'),
							// then test fixtures and helpers
							serveStatic('tests'),
							// other libs
							serveStatic('lib')
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
	    				html: 'coverageReports/' 
	    			}
	    		}
			}
		}
	});
	grunt.registerTask('testcoverage', ['coverageInstrument', 'connect:testcoverage', 'qunit:test', 'coverageReport']);
```

Now just run: `grunt testcoverage`


#### `generateModule` option usage
The config from the previous example can be extended by adding `generateModule` option into `coverageInstrument` task:  
   
```js

		coverageInstrument: {
			test: {
				options: {
					generateModule: {
						output: '.tmp/all-modules.js',
						// put here all modules for which you have aliases in requirejs' config (paths)
						ignore: ['lib/core', 'lib/xcss', 'lib/xhtmpl']
					}
				},
				// NOTE: we instrument only subset of our sources ('lib')
				src: 'lib/**/*.js',
				expand: true,
				cwd: 'src',
				dest: '.tmp'
			}
		},
```

tests-runner.html file contains something like this:  
 
```html
<script type="text/javascript" src="require.config.js"></script>
<script type="text/javascript" src="vendor/require.js" data-main="tests-main"></script>
```

main script tests-main.js:   

```js
require([
	"all-modules",
	"fixtures/component1-tests", ... all other tests
], function () {

	// run all tests after their modules were loaded
	QUnit.start();
});
```

Here all-modules.js is a stub module:

```js
define([], function () {});
```

## Release History
 * 2016-12-07 v1.0.0  Added reporters (console/teamcity), changed events arguments (QUnit 2.0 support)
 * 2016-06-23	v0.4.0	Added 'force' option for 'qunit' task
 * 2016-02-21	v0.3.2	Support Grunt 1.0
 * 2015-09-02	v0.3.1	Support multiple URLs for coverage (converage reports are merged)
 * 2013-10-15	v0.3.0	Addded generateModule option
 * 2013-09-07	v0.2.1  Added sample project with Gruntfile.js to run unit tests with code coverage
 * 2013-09-02	v0.2.0  Added autoBind option for coverageInstrument task to simplify using coverage tasks 
 * 2013-08-30	v0.1.2  Added tasks coverageInstrument/coverageReport for code coverage via Istanbul 
 * 2013-08-30			Added 'qunit.coverage' event which is reported on tests completion with `window.__coverage__` object.
 * 2013-08-28			Added 'eventHandlers' option for passing phantomjs' events handlers
 * 2013-08-27	v0.1.0	Forked from grunt-contrib-qunit and grunt-lib-phantomjs and modified - first working version

---
Authored by [Sergei Dorogin](http://about.dorogin.com)

(c) Copyright CROC Inc. 2013-2016  

Original tasks ([grunt-contrib-qunit][] and [grunt-lib-phantomjs][]) were authored by:

* ["Cowboy" Ben Alman](http://benalman.com/)
* [Tyler Kellen](http://goingslowly.com/)

Contributors:

* [yamikuronue](https://github.com/yamikuronue)  
