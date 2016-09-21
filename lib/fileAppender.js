/* eslint-disable id-length, no-magic-numbers, prefer-arrow-callback, prefer-reflect */

"use strict";

var fs = require("fs"),
    moment = require("moment"),
    ln = require("./ln.js");

module.exports = function(appender) {  // eslint-disable-line max-statements
  if (!appender.hasOwnProperty("isUTC")) {
    appender.isUTC = true;
  }

  if (typeof appender.path !== "string") {
    throw new TypeError("appender.path is not a string");
  }

  appender.queue = [];
  appender.isFlushed = true;
  appender.stream = {
    "path": "",
    "end": function() { }  // eslint-disable-line no-empty-function, object-shorthand
  };

  var units = {"ms": 111, "s": 1, "m": 1, "h": 12, "d": 1, "w": 1, "M": 3, "y": 1},
      mm = moment.utc([1970]),
      keys = Object.keys(units),
      key;  // eslint-disable-line init-declarations

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

  process.on("exit", function() {
    var queue = appender.queue,
        key, q, ql, a, al, val;  // eslint-disable-line no-shadow, init-declarations

    for (q = 0, ql = queue.length; q < ql; q++) {
      key = queue[q][0];
      val = queue[q];
      for (a = 1, al = val.length; a < al; a++) {
        fs.appendFileSync(key, val[a]);  // eslint-disable-line no-sync
      }
    }
  });

  return function(timestamp, string) {  // eslint-disable-line max-statements
    var queue = this.queue;

    if (arguments.length) {
      var period = this.period;

      if (period && timestamp >= this.next) {
        var mm = moment(timestamp);  // eslint-disable-line no-shadow

        if (this.isUTC) {
          mm = mm.utc();
        }
        this.formattedPath = mm.format(this.path);
        this.next = mm.startOf(period).add(1, period).valueOf();  // eslint-disable-line newline-per-chained-call
      }

      var path = this.formattedPath;

      if (!queue.length || queue[queue.length - 1][0] !== path) {
        queue.push([path]);
      }

      var array = queue[queue.length - 1],
          length = array.length;

      if (length === 1 || array[length - 1].length + string.length > ln.PIPE_BUF) {
        array.push(string);
      } else {
        array[length - 1] += string;
      }
    }

    if (!this.isFlushed) {
      return;
    }

    if (!queue.length) {
      return;
    }

    var key = queue[0][0],  // eslint-disable-line no-shadow
        a1 = queue[0][1],
        s = this.stream;

    if (s.path !== key) {
      s.end();
      this.stream = s = fs.createWriteStream(key, {
        "flags": "a",
        "highWaterMark": 0
      });
      appender.lastBytesWritten = 0;
      s.on("drain", function() {  // eslint-disable-line max-statements
        var queue = appender.queue,  // eslint-disable-line no-shadow
            a = queue[0],
            a1 = a[1];  // eslint-disable-line no-shadow

        a1 = a1.substring(appender.lastBytesWritten);

        if (a1.length) {
          a[1] = a1;
        } else {
          a[1] = a[0];
          a = a.slice(1);
          if (a.length < 2) {
            appender.queue = queue.slice(1);
          } else {
            appender.queue[0] = a;
          }
        }

        appender.isFlushed = true;
        appender.write();
      });
    }

    this.lastBytesWritten = a1.length;
    this.isFlushed = s.write(a1);
  };
};
