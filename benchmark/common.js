var cluster = require("cluster");
var util = require("util");
var n = process.argv[3] ? parseInt(process.argv[3]) : 1;
if (cluster.isMaster && n > 1) {  
  for (var i = 0; i < n; i++) {
    cluster.fork();
  }
} else {
  var n = parseInt(process.argv[2]);
  if (isNaN(n)) {
    n = 100000;
  }
  console.log(util.format("log.info(%d) with %d time(s)", process.pid, n));  
  for (var i = 0; i < n; i++) {
    log.info(i);
  }
}