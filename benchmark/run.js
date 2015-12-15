"use strict";

var n = process.argv[2] ? parseInt(process.argv[2], 10) : 100000;

var exec = require("child_process").exec,
    async = require("async"),
    util = require("util"),
    os = require("os");

var files = [
      "bunyan",
      "log4js",
      "winston",
      "ln"
    ],
    tasks = [],
    result = {};

for (var i = 0; i < files.length; i++) {
  var arg = os.type();

  if (arg === "Darwin") {
    arg = "-l";
  } else if (arg === "Linux") {
    arg = "-v";
  } else {
    arg = "";
  }

  result[files[i]] = {};

  tasks.push({
    "name": files[i],
    "async": false,
    "exit": false,
    "cmd": util.format("rm -rf %s.log && /usr/bin/time %s node %s.js sync %d", files[i], arg, files[i], n)
  });

  tasks.push({
    "name": files[i],
    "async": false,
    "exit": true,
    "cmd": util.format("rm -rf %s.log && node %s.js sync %d exit && tail -1 %s.log", files[i], files[i], n, files[i])
  });

  tasks.push({
    "name": files[i],
    "async": true,
    "exit": false,
    "cmd": util.format("rm -rf %s.log && /usr/bin/time %s node %s.js async %d", files[i], arg, files[i], n)
  });

  tasks.push({
    "name": files[i],
    "async": true,
    "exit": true,
    "cmd": util.format("rm -rf %s.log && node %s.js async %d exit && tail -1 %s.log", files[i], files[i], n, files[i])
  });
}

console.log("%s\t%s\t%s\t%s\t%s\t%s\t%s", "name", "async", "real(s)", "user(s)", "sys(s)", "rss(MB)", "tail");
console.log("====================================================");
async.eachSeries(
  tasks,
  function (task, callback) {
    exec(task.cmd, function (error, stdout, stderr) {
      var name = task.name;

      if (task.exit) {
        console.log("%s\t%s\t%s\t%s\t%s\t%s\t%s", task.name, task.async, result[name].real, result[name].user, result[name].sys, result[name].rss, stdout.slice(0, -1));
      } else {
        var array = stderr.split(/\D+?.\D+/g);

        array = array.splice(1, array.length - 2);
        result[name].real = array[0];
        result[name].user = array[1];
        result[name].sys = array[2];
        result[name].rss = array[3] >> 20;
      }

      callback(null);
    });
  }
);
