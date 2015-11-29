"use strict";

var fs = require("fs"),
    moment = require("moment"),
    ln = require("./ln.js");

module.exports = function (appender) {
  if (!appender.hasOwnProperty("isUTC")) {
    appender.isUTC = true;
  }

  if (typeof appender.path !== "string") {
    throw new TypeError("appender.path is not a string");
  }

  appender.queue = {};
  appender.isFlushed = true;

  var units = {"ms": 111, "s": 1, "m": 1, "h": 12, "d": 1, "w": 1, "M": 3, "y": 1},
      mm = moment.utc([1970]),
      keys = Object.keys(units),
      key;

  while ((key = keys[0]) && mm.format(appender.path) === mm.add(units[key], key).format(appender.path)) {
    keys.shift();
  }

  if (key) {
    appender.period = key;
    appender.next = 0;
    appender.formattedPath = "";
  } else {
    appender.formattedPath = moment().format(appender.path);
  }

  return function (timestamp, string) {
    var queue = this.queue;

    if (arguments.length) {
      if (this.period && timestamp >= this.next) {
        var mm = moment(timestamp);

        if (this.isUTC) {
          mm = mm.utc();
        }
        this.formattedPath = mm.format(this.path);
        this.next = mm.startOf(this.period).add(1, this.period).valueOf();
      }

      var path = this.formattedPath,
          array = queue[path] = queue[path] || [];

      if (!array.length || array[array.length - 1].length + string.length > ln.PIPE_BUF) {
        array.push(string);
      } else {
        array[array.length - 1] += string;
      }
    }

    if (!this.isFlushed) {
      return;
    }

    var s, q, ql, a, al, val, key, keys = Object.keys(queue);

    for (q = 0, ql = keys.length; this.isFlushed && q < ql; q++) {
      key = keys[q];
      s = this.stream;

      if (!s || s.path !== key) {
        if (s) {
          s.end();
        }

        this.stream = s = fs.createWriteStream(key, {
          "flags": "a",
          "encoding": "utf8",
          "highWaterMark": 0
        });

        s.on("drain", function () {
          appender.isFlushed = true;
          appender.write();
        });
      }

      val = queue[key];
      for (a = 0, al = val.length; this.isFlushed && a < al; a++) {
        this.isFlushed = s.write(val[a]);
      }

      if (a === al) {
        delete queue[key];
      } else {
        queue[key] = val.slice(a);
      }
    }
  };
};
