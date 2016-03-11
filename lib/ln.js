/* eslint-disable id-length, no-console, prefer-template, require-jsdoc, prefer-reflect */

"use strict";

var os = require("os");

var VERSION = 0,
    LEVEL = {
      "TRACE": 10,
      "DEBUG": 20,
      "INFO": 30,
      "WARN": 40,
      "ERROR": 50,
      "FATAL": 60
    };

for (var l in LEVEL) {
  LEVEL[LEVEL[l].toString()] = l;
}

var ln = function() {  // eslint-disable-line max-statements, complexity
  var arg0 = arguments[0];  // eslint-disable-line no-magic-numbers

  if (typeof arg0 === "object") {
    if (arg0.ln) {
      this.fields = JSON.parse(JSON.stringify(arg0.ln.fields));
      this.fields.n = arg0.name.toString();
      this.appenders = arg0.ln.appenders;
      return this;
    } else if (arg0.appenders) {
      if (!arg0.appenders.length) {
        throw new TypeError("it must have at least one appender");
      }

      // 1. this has to be inside the class because different each object has itw own name
      // 2. to log by directly calling JSON.stringify(fields)
      this.fields = {
        "n": arg0.name.toString(), // name
        "h": os.hostname(),        // hostname
        "p": process.pid,          // process id
        "v": VERSION               // version
      };

      this.appenders = arg0.appenders;

      for (var i = 0, n = this.appenders.length; i < n; i++) {
        var appender = this.appenders[i];

        if (typeof appender.level !== "number") {
          appender.level = appender.level || arg0.level || (process.env.NODE_ENV === "production" ? "INFO" : "TRACE");
          if (appender.level && LEVEL[appender.level.toUpperCase()]) {  // eslint-disable-line max-depth
            appender.level = LEVEL[appender.level.toUpperCase()];
          } else {
            throw new TypeError("appender.level is not valid");
          }
        }

        appender.formatter = appender.formatter || arg0.formatter || JSON.stringify;
        if (typeof appender.formatter !== "function") {
          throw new TypeError("appender.formatter is not a function");
        }

        switch (appender.type) {
        case "file":
          appender.write = require("./fileAppender.js")(appender);
          break;
        default:
          appender.write = appender.write || require("./consoleAppender.js")();
          break;
        }

        appender.write.bind(appender);
      }

      return this;
    }
  }

  throw new Error("failed to instantiate ln");
};

var log = function(level) {
  return function() {  // eslint-disable-line max-statements
    if (!arguments.length) {
      return;
    }

    var appenders = [],
        i, n;  // eslint-disable-line init-declarations

    for (i = 0, n = this.appenders.length; i < n; i++) {
      if (this.appenders[i].level <= level) {
        appenders.push(this.appenders[i]);
      }
    }

    if (!appenders.length) {
      return;
    }

    var timestamp = Date.now(),  // eslint-disable-line one-var
        arg;  // eslint-disable-line init-declarations

    this.fields.t = timestamp;  // timestamp
    this.fields.l = level;      // level

    for (i = 0, n = arguments.length; i < n; i++) {
      arg = arguments[i];
      if (arg instanceof Error) {
        this.fields.m = arg.stack;
      } else if (typeof arg === "object") {
        this.fields.j = arg;
      } else {
        this.fields.m = arg;
      }
    }

    if (level === 10) {  // eslint-disable-line no-magic-numbers
      var prepareStackTrace = Error.prepareStackTrace,
          m = this.fields.m;

      Error.prepareStackTrace = function(error, stack) {
        var string = "Trace : " + m;

        for (var i = 1, n = stack.length; i < n; i++) {  // eslint-disable-line no-shadow
          string += "\n    at " + stack[i].toString();
        }
        Error.prepareStackTrace = prepareStackTrace;
        return string;
      };

      this.fields.m = new Error().stack;
    }

    for (i = 0, n = appenders.length; i < n; i++) {
      var appender = appenders[i];

      appender.write(timestamp, appender.formatter(this.fields) + "\n");
    }

    delete this.fields.m;
    delete this.fields.j;
  };
};

/*eslint-disable no-magic-numbers */

ln.prototype.trace = ln.prototype.t = log(10);
ln.prototype.debug = ln.prototype.d = log(20);
ln.prototype.info = ln.prototype.i = log(30);
ln.prototype.warn = ln.prototype.w = log(40);
ln.prototype.error = ln.prototype.e = log(50);
ln.prototype.fatal = ln.prototype.f = log(60);

/*eslint-enable no-magic-numbers */

module.exports = ln;
module.exports.PIPE_BUF = 4096;
module.exports.LEVEL = LEVEL;

// ES6's let, class, Map and => will decrease the performance
