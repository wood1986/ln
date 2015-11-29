"use strict";

module.exports = function (log) {
  var sync = process.argv[2] === "sync",
      n = process.argv[3] ? parseInt(process.argv[3], 10) : 100000;

  var i = 0;

  if (sync) {
    for (i; i < n; i++) {
      log.info(i);
    }
  } else {
    var tick = function () {
      log.info(i++);
      if (i < n) {
        setImmediate(tick);
      }
    };

    setImmediate(tick);
  }
};
