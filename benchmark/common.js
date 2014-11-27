/* global log:true */
/* global n:true */
/* global sync:true */
sync = process.argv[2] == "sync" ? true : false;
n = process.argv[3] ? parseInt(process.argv[3]) : 100000;

if (sync) {
  for (var i = 0; i < n; i++) {
    log.info(i);
  }
} else {
  var i = 0;
  var tick = function () {
    log.info(i++);
    if (i < n) setImmediate(tick);
  };
  setImmediate(tick);
}
