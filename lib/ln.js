"use strict";

var os = require("os");
var fs = require("fs");
var util = require("util");
var moment = require("moment");

var VERSION = 0;
var PIPE_BUFF = 4096;
var LEVEL = {
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

function ln(name, appenders) {
  if (typeof name !== "string" || !name || name === "") {
    throw new TypeError("name must be a non-empty string");
  }

  if (Array.isArray(appenders)) {
    if (appenders.length === 0) {
      throw new TypeError("it must have at least one appender");
    }

    this.fields = {
      n: name,          //name
      h: os.hostname(), //hostname
      p: process.pid,   //process id
      v: VERSION        //version
    };

    this.appenders = appenders;
    for (var i = 0, n = this.appenders.length; i < n; i++) {
      var appender = this.appenders[i];

      if (appender.hasOwnProperty("level") && LEVEL.hasOwnProperty(appender.level.toUpperCase())) {
        appender.level = LEVEL[appender.level.toUpperCase()];
      } else {
        throw new TypeError("each appender must have \"level\" attribute with valid value");
      }

      if (!appender.formatter) {
        appender.formatter = JSON.stringify;
      } else if (typeof appender.formatter !== "function") {
        throw new TypeError("the formatter is not a function");
      }

      switch (appender.type) {
        case "console":
          appender.write = function(timestamp, string) {
            console.log(string.slice(0, -1));
          };
          break;
        case "file":
          appender.queue = {};
          appender.isFlushed = true;
          var units = { "ms": 111, "s": 1, "m": 1, "h": 12, "d": 1, "w": 1, "M": 3, "y": 1 };
          var keys = Object.keys(units);
          var key = null;
          while ((key = keys.shift()) !== undefined && moment().format(appender.path) === moment().add(units[key], key).format(appender.path));
          if (keys.length === 0) {
            appender.formattedPath = moment().format(appender.path);
          } else {
            appender.period = key;
            appender.next = 0;
            appender.formattedPath = "";
          }

          var log = function(timestamp, string) {
            var appender = this;
            var queue = appender.queue;
            if (arguments.length > 0) {
              if (appender.hasOwnProperty("period") && timestamp >= appender.next) {
                appender.formattedPath = (appender.isUTC ? moment(timestamp).utc() : moment(timestamp)).format(appender.path);
                appender.next = moment(timestamp).startOf(appender.period).add(1, appender.period).valueOf();
              }
              var path = appender.formattedPath;
              queue[path] = queue[path] || [];
              var array = queue[path];
              if (array.length === 0 || array[array.length - 1].length + string.length > PIPE_BUFF) {
                array.push(string);
              } else {
                array[array.length - 1] += string;
              }
            }

            if (!appender.isFlushed) {
              return;
            }

            var keys = Object.keys(queue);
            var key = null;
            var i = 0, j = 0, n = 0, m = 0;

            for (j = 0, m = keys.length; appender.isFlushed && j < m; j++) {
              key = keys[j];
              if (!appender.stream || appender.stream.path != key) {
                if (appender.stream) {
                  appender.stream.end();
                }
                appender.stream = fs.createWriteStream(key, {
                  "flags": "a",
                  "encoding": "utf8",
                  "highWaterMark": 0
                });
                appender.stream.on("drain", function() {
                  appender.isFlushed = true;
                  appender.write();
                });
              }
              for (i = 0, n = queue[key].length; appender.isFlushed && i < n; i++) {
                appender.isFlushed = appender.stream.write(queue[key][i]);
              }
              if (n == i) {
                delete queue[key];
              } else {
                queue[key] = queue[key].slice(i);
              }
            }
          };
          appender.write = log;
          break;
        default:
          break;
      }
    }
  } else if (appenders instanceof ln) {
    this.fields = JSON.parse(JSON.stringify(appenders.fields));
    this.fields.n = name;
    this.appenders = appenders.appenders;
  } else {
    throw new TypeError("invalid appenders");
  }
}

function log(level) {
  return function() {
    if (arguments.length === 0) {
      return;
    }

    var appenders = [];
    var i = 0, n = 0;
    for (i = 0, n = this.appenders.length; i < n; i++) {
      if (this.appenders[i].level <= level) {
        appenders.push(this.appenders[i]);
      }
    }
    if (appenders.length === 0) {
      return;
    }

    var timestamp = Date.now();
    this.fields.t = timestamp; //timestamp
    this.fields.l = level;     //level

    for (i = 0, n = arguments.length; i < n; i++) {
      var arg = arguments[i];
      if (util.isError(arg)) {
        this.fields.m = arg.stack;
      } else if (typeof arg === "object") {
        this.fields.j = arg;
      } else if (typeof arg !== "undefined") {
        if (level === LEVEL["TRACE"]) {
          var _prepareStackTrace = Error.prepareStackTrace;
          Error.prepareStackTrace = function (error, stack) {
            var string = "Trace : " + arg;
            for (var j = 1, m = stack.length; j < m; j++) {
              string += "\n    at " + stack[j].toString();
            }
            Error.prepareStackTrace = _prepareStackTrace;
            return string;
          };
          this.fields.m = new Error().stack;
        } else {
          this.fields.m = arg;
        }
      }
    }

    for (i = 0, n = appenders.length; i < n; i++) {
      var appender = appenders[i];
      appender.write(timestamp, appender.formatter(this.fields) + "\n");
    }

    delete this.fields.m;
    delete this.fields.j;
  };
}

module.exports = ln;
module.exports.LEVEL = LEVEL;
module.exports.PIPE_BUFF = PIPE_BUFF;

ln.prototype.trace = ln.prototype.t = log(10);
ln.prototype.debug = ln.prototype.d = log(20);
ln.prototype.info  = ln.prototype.i = log(30);
ln.prototype.warn  = ln.prototype.w = log(40);
ln.prototype.error = ln.prototype.e = log(50);
ln.prototype.fatal = ln.prototype.f = log(60);

ln.prototype.clone = function(name) {
  return new ln(name, this);
};