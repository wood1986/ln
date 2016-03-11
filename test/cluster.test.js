/* eslint-disable prefer-arrow-callback, id-length, no-magic-numbers, new-cap, object-shorthand, prefer-template */

"use strict";

var cluster = require("cluster"),
    assert = require("assert"),
    fs = require("fs"),
    mm = require("micromatch"),
    async = require("async");

var w = 10000,
    x = {},
    useCluster = true;

if (cluster.isMaster && useCluster) {
  var i = 0,
      n = require("os").cpus().length,
      m = {};

  while (i++ < n) cluster.fork();  // eslint-disable-line curly
  i = 0;

  cluster.on("exit", function(worker, code, signal) {
    assert.deepStrictEqual(code, 0);
    assert(!signal);

    i++;
    m[worker.process.pid] = 0;

    if (i === n) {
      fs.readdir(
        "./",
        function(err, files) {
          if (err) {
            throw err;
          }

          async.eachSeries(
            mm(files, "cluster.*.log"),
            function(file, callback) {
              var rl = require("readline").createInterface({
                "input": fs.createReadStream(
                  file,
                  {
                    "flag": "r",
                    "autoClose": true
                  }
                )
              });

              rl.on("line", function(line) {
                var json = JSON.parse(line);

                if (x[json.p]) {
                  return;
                }

                if (json.m === m[json.p]) {
                  m[json.p]++;
                } else if (json.m > m[json.p]) {
                  x[json.p] = true;
                }
              });
              rl.on("close", callback);
            },
            function(err) {  // eslint-disable-line no-shadow
              if (err) {
                throw err;
              }

              for (var l in m) {
                assert.deepStrictEqual(m[l], w, "Wrong num of log entries " + JSON.stringify(m));
              }
            }
          );
        }
      );
    }
  });
} else {
  var ln = require("../lib/ln.js");

  var log = new ln({
        "name": "cluster",
        "appenders": [{
          "type": "file",
          "path": "[./cluster.]x[.log]"
        }]
      }),
      l = 0,
      immediate = function() {
        log.info(l++);
        if (l < w) {
          setImmediate(immediate);
        } else {
          process.exit();
        }
        return;
      };

  setImmediate(immediate);
}
