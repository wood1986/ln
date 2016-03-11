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

  appender.queue = {};
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
        keys = Object.keys(queue),  // eslint-disable-line no-shadow
        key, q, ql, a, al, val;  // eslint-disable-line no-shadow, init-declarations

    for (q = 0, ql = keys.length; q < ql; q++) {
      key = keys[q];
      val = queue[key];
      for (a = 0, al = queue[key].length; a < al; a++) {
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

      var path = this.formattedPath,
          array = queue[path] = queue[path] || [],
          length = array.length;

      if (!length || array[length - 1].length + string.length > ln.PIPE_BUF) {
        array.push(string);
      } else {
        array[length - 1] += string;
      }
    }

    if (!this.isFlushed) {
      return;
    }

    var keys = Object.keys(queue);  // eslint-disable-line no-shadow

    if (!keys.length) {
      return;
    }

    var key = keys[0],  // eslint-disable-line no-shadow
        a0 = queue[key][0],
        s = this.stream;

    if (s.path !== key) {
      s.end();
      this.stream = s = fs.createWriteStream(key, {
        "flags": "a",
        "highWaterMark": 0
      });
      appender.lastBytesWritten = 0;
      s.on("drain", function() {
        var a = queue[key],
            a0 = queue[key][0];  // eslint-disable-line no-shadow

        a0 = a0.substring(appender.lastBytesWritten);

        if (a0.length) {
          queue[key][0] = a0;
        } else {
          a = a.slice(1);
          if (a.length) {
            queue[key] = a;
          } else {
            delete queue[key];
          }
        }

        appender.isFlushed = true;
        appender.write();
      });
    }

    this.lastBytesWritten = a0.length;
    this.isFlushed = s.write(a0);
  };
};
