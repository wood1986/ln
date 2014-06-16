"use strict";

var os = require("os");
var fs = require("fs");
var util = require("util");
var moment = require("moment");
var events = require("events");

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
        throw new TypeError("each appender must have \"level\" attribute");
      }

      if (!appender.emitter) {
        appender.emitter = new events.EventEmitter();
      } else if (!(appender.emitter instanceof events.EventEmitter)) {
        throw new TypeError("the emitter is not in events.EventEmitter type");
      }

      if (!appender.formatter) {
        appender.formatter = JSON.stringify;
      } else if (typeof appender.formatter !== "function") {
        throw new TypeError("the formatter is not a function");
      }

      switch (appender.type) {
        case "console":
          appender.emitter.on("log", function(appender, timestamp, string) {
            process.stdout.write(string);
          });
          break;
        case "file":
          appender.queue = {};
          appender.isFlushed = true;
          var fixedPath = /^\[[^\]]+\]$/.test(appender.path) ? appender.path.slice(1, -1) : false;
          var log = function(appender, timestamp, string) {
            var queue = appender.queue;

            if (arguments.length > 1) {
              var path = fixedPath ||
                      (appender.isUTC ? moment(timestamp).utc() : moment(timestamp)).format(appender.path);
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
                  appender.emitter.emit("log", appender);
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
          appender.emitter.on("log", log);
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

    var timestamp = new Date();
    this.fields.t = timestamp; //timestamp
    this.fields.l = level;     //level

    for (i = 0, n = arguments.length; i < n; i++) {
      var arg = arguments[i];
      if (util.isError(arg)) {
        this.fields.m = arg.stack;
      } else if (typeof arg === "object") {
        this.fields.j = arg;
      } else if (typeof arg !== "undefined") {
        this.fields.m = arg;
      }
    }

    for (i = 0, n = appenders.length; i < n; i++) {
      var appender = appenders[i];
      appender.emitter.emit("log", appender, timestamp, appender.formatter(this.fields) + "\n");
    }

    delete this.fields.m;
    delete this.fields.j;
  };
}

module.exports = ln;
module.exports.LEVEL = LEVEL;
module.exports.PIPE_BUFF = PIPE_BUFF;

ln.prototype.trace = log(10);
ln.prototype.debug = log(20);
ln.prototype.info = log(30);
ln.prototype.warn = log(40);
ln.prototype.error = log(50);
ln.prototype.fatal = log(60);
ln.prototype.clone = function(name) {
  return new ln(name, this);
};
