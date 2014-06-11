/* global log:true */
var util = require("util");
var n = process.argv[2] ? parseInt(process.argv[2]) : 100000;
console.log(util.format("log.info(%d) with %d time(s)", process.pid, n));
for (var i = 0; i < n; i++) {
  log.info(i);
}
