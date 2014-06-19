/* global log:true */
var n = process.argv[2] ? parseInt(process.argv[2]) : 100000;
console.info("log.info(%d) with %d time(s)", process.pid, n);
for (var i = 0; i < n; i++) {
  log.info(i);
}
