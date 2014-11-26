n = process.argv[2] ? parseInt(process.argv[2]) : 100000;

var exec = require('child_process').exec;
var async = require("async");
var util = require("util");
var os = require("os");

var files = [
  "bunyan",
  "log4js",
  "winston",
  "ln"
];
var tasks = new Array();
for (var i = 0; i < files.length; i++) {
  var arg = os.type();
  if (arg == "Darwin") {
    arg = "-l";
  } else if (arg == "Linux") {
    arg = "-v";
  } else {
    arg = "";
  }

  tasks.push({
    name: files[i],
    async: false,
    cmd: util.format("rm -rf %s.log && /usr/bin/time %s node %s.js sync %d", files[i], arg, files[i], n)
  });

  tasks.push({
    name: files[i],
    async: true,
    cmd: util.format("rm -rf %s.log && /usr/bin/time %s node %s.js async %d", files[i], arg, files[i], n)
  });
}

console.log("%s\t%s\t%s\t%s\t%s\t%s", "name", "(a)sync", "real", "user", "sys", "rss");
console.log("=============================================");
async.eachSeries(tasks,
  function (task, callback) {
    child = exec(task.cmd, function (error, stdout, stderr) {
      var array = stderr.split(/\D+?.\D+/g);
      array = array.splice(1, array.length - 2);
      console.log("%s\t%s\t%ds\t%ds\t%ds\t%sMB", task.name, (task.async ? "async" : "sync"), array[0], array[1], array[2], array[3] >> 20);
      callback(null);
    });
  }
);