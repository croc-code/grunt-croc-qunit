# grunt-croc-qunit [![Build Status](https://travis-ci.org/CrocInc/grunt-croc-qunit.png?branch=master)](https://travis-ci.org/CrocInc/grunt-croc-qunit)

> Run QUnit unit tests in a headless PhantomJS instance.


## Overview
This plugin is modified version of two plugins: [grunt-contrib-qunit][] and [grunt-lib-phantomjs][].
Here's reasoning why it was forked and modified.
Original grunt-contrib-qunit creates the following dependencies tree:
* grunt-contrib-qunit -> grunt-lib-phantomjs -> phantomjs npm module -> PhantomJS

This works great when you install [grunt-contrib-qunit][] from official npm registry. All dependencies downloaded and installed automatically.
But [phantomjs npm module][] has very specific feature: on installation after [PhantomJS][] downloading it hardcodes absolute path to its executable.
Such bahavior makes it impossible to share node_modules folder between machines. 
Consequently, it's impossible to keep node_modules in VCS (Git/Subversion).

That's because this plugin was created. It does not depend on [grunt-lib-phantomjs][] nor [phantomjs npm module][].
It expects that you will install [PhantomJS][] on your own and supply path to its executable in task's options.

[grunt-contrib-qunit]: https://github.com/gruntjs/grunt-contrib-qunit
[grunt-lib-phantomjs]: https://github.com/gruntjs/grunt-lib-phantomjs
[phantomjs npm module]: https://github.com/Obvious/phantomjs
[PhantomJS]: http://www.phantomjs.org/

Also there are other distinctions from original grunt-contrib-qunit:
* bridge.js script was modified to remove excess processing of QUnit.equal's arguments (see https://github.com/gruntjs/grunt-contrib-qunit/issues/44)


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

For running qunit-tests you'll need to manually install PhantomJS first into some reachable place. You can use [phantomjs npm module][] for this.

[PhantomJS]: http://www.phantomjs.org/
[phantomjs npm module]: https://github.com/Obvious/phantomjs

Also note that running grunt with the `--debug` flag will output a lot of PhantomJS-specific debugging information. This can be very helpful in seeing what actual URIs are being requested and received by PhantomJS.
### Options

#### phantomPath
Type: `String`  
Default: (none)  
Required: yes

The path to PhantomJS executable. It can be absolute or relative to the current working directory (by default it's folder where Gruntfile.js lives).  

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

```js
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
[QUnit callback](http://api.qunitjs.com/category/callbacks/) methods and arguments are also emitted through grunt's event system so that you may build custom reporting tools. Please refer to to the QUnit documentation for more information.

The events (with arguments) are as follows:

* `qunit.begin`
* `qunit.moduleStart`: name
* `qunit.testStart`: name
* `qunit.log`: result, message, source
* `qunit.testDone`: name, failed, passed, total
* `qunit.moduleDone`: name, failed, passed, total
* `qunit.done`: failed, passed, total, runtime

In addition to QUnit callback-named events, the following event is emitted when [PhantomJS][] is spawned for a test:

* `qunit.spawn`: url

You may listen for these events like so:

```js
grunt.event.on('qunit.spawn', function (url) {
  grunt.log.ok("Running test: " + url);
});
```


## Release History

 * 2013-08-28	v0.1.2	Added 'eventHandlers' option for passing phantomjs' events handlers
 * 2013-08-27	v0.1.0	Forked from grunt-contrib-qunit and grunt-lib-phantomjs and modified - first working version
