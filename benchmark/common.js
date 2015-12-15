"use strict";

module.exports = function (log) {
  var sync = process.argv[2] === "sync",
      n = process.argv[3] ? parseInt(process.argv[3], 10) : 100000,
      exit = process.argv[4] === "exit";

  var i = 0;

  if (sync) {
    for (i; i < n; i++) {
      log.info(i);
    }

    if (exit) {
      process.exit(); // eslint-disable-line no-process-exit
    }
  } else {
    var immediate = function () {
      log.info(i++);
      if (i < n) {
        clearImmediate(this);
        setImmediate(immediate);
      } else if (exit) {
        process.exit(); // eslint-disable-line no-process-exit
      }
    };

    setImmediate(immediate);
  }
};
