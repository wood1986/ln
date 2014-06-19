/* global log:true */
var n = process.argv[2] ? parseInt(process.argv[2]) : 100000;
console.info("log.info(%d) with %d time(s)", process.pid, n);
var i = 0;

function tick() {
  // log a "request" each tick
  log.info(i++);
  if (i < n) setImmediate(tick);
}

setImmediate(tick);
