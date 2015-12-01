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

for (var l in LEVEL) {  // eslint-disable-line guard-for-in
  LEVEL[LEVEL[l].toString()] = l;
}

function ln() {
  var arg0 = arguments[0];

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
          appender.level = appender.level || arg0.level || (process.env.NODE_ENV === "production" ? "INFO" : "TRACE");  // eslint-disable-line no-process-env
          if (appender.level && LEVEL[appender.level.toUpperCase()]) {
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
  } else if (typeof arg0 === "string") {
    var arg1 = arguments[1];

    if (Array.isArray(arg1)) {
      console.warn("ln(name, appenders) will be deprecated in the next release");
      return new ln({ // eslint-disable-line new-cap
        "name": arg0,
        "appenders": arg1
      });
    } else if (arg1 instanceof ln) {
      console.warn("ln(name, ln) will be deprecated in the next release");
      return new ln({ // eslint-disable-line new-cap
        "name": arg0,
        "ln": arg1
      });
    }
  }

  throw new Error("failed to instantiate ln");
}

function log(level) {
  return function () {
    if (!arguments.length) {
      return;
    }

    var appenders = [],
        i, n;

    for (i = 0, n = this.appenders.length; i < n; i++) {
      if (this.appenders[i].level <= level) {
        appenders.push(this.appenders[i]);
      }
    }

    if (!appenders.length) {
      return;
    }

    var timestamp = Date.now(),
        arg;

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

    if (level === 10) {
      var prepareStackTrace = Error.prepareStackTrace,
          m = this.fields.m;

      Error.prepareStackTrace = function (error, stack) {
        var string = "Trace : " + m;

        for (var i = 1, n = stack.length; i < n; i++) {
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
}

ln.prototype.trace = ln.prototype.t = log(10);
ln.prototype.debug = ln.prototype.d = log(20);
ln.prototype.info = ln.prototype.i = log(30);
ln.prototype.warn = ln.prototype.w = log(40);
ln.prototype.error = ln.prototype.e = log(50);
ln.prototype.fatal = ln.prototype.f = log(60);

module.exports = ln;
module.exports.PIPE_BUF = 4096;
module.exports.LEVEL = LEVEL;

// ES6's let, class, Map and => will decrease the performance

Object.defineProperty(
  ln,
  "PIPE_BUFF",
  {
    "get": function () {
      console.warn("ln.PIPE_BUFF will be deprecated in the next release");
      return module.exports.PIPE_BUF;
    },
    "set": function (value) {
      console.warn("ln.PIPE_BUFF will be deprecated in the next release");
      module.exports.PIPE_BUF = value;
    }
  }
);

ln.prototype.clone = function (name) {
  console.warn("ln.clone(name) will be deprecated in the next release");
  return new ln({"name": name, "ln": this});  // eslint-disable-line new-cap
};
