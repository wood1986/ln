"use strict";

var cluster = require("cluster"),
    assert = require("assert"),
    fs = require("fs"),
    os = require("os");

if (cluster.isMaster) {
  var i = 0,
      n = require("os").cpus().length;

  while (i++ < n) cluster.fork(); // eslint-disable-line curly
  i = 0;
  cluster.on("exit", function (worker, code, signal) {
    assert.deepStrictEqual(code, 0);
    assert(!signal);
  });
} else {
  var ln = require("../lib/ln.js"),
      mm = require("micromatch"),
      util = require("util"),
      async = require("async");

  var log = new ln({  // eslint-disable-line new-cap
    "name": "cluster",
    "appenders": [
        {
          "type": "file",
          "path": util.format("[./cluster.%d.]x[.log]", process.pid)
        }
    ]
  });

  async.times(
    10000,
    function (n, callback) {
      log.i(n);
      setImmediate(callback);
    },
    function (err) {
      if (err) {
        throw err;
      }

      async.until(
        function () {
          return Object.keys(log.appenders[0].queue).length === 0;
        },
        function (callback) {
          setImmediate(callback);
        },
        function (err) {
          if (err) {
            throw err;
          }

          fs.readdir("./", function (err, files) {
            if (err) {
              throw err;
            }

            var i = 0;

            async.eachSeries(
              mm(files, util.format("cluster.%d.*.log", process.pid)),
              function (file, callback) {
                var rl = require("readline").createInterface(
                    {
                      "input": fs.createReadStream(
                        file,
                          {
                            "flag": "r",
                            "autoClose": true
                          }
                      )
                    }
                  );

                rl.on("line", function (line) {
                  var json = JSON.parse(line);

                  assert.deepStrictEqual(json.n, "cluster");
                  assert.deepStrictEqual(json.v, 0);
                  assert.deepStrictEqual(json.h, os.hostname());
                  assert.deepStrictEqual(json.l, 30);
                  assert.deepStrictEqual(json.p, process.pid);
                  assert.deepStrictEqual(json.t, parseInt(file.split(".")[2], 10));
                  assert.deepStrictEqual(json.m, i++);
                });
                rl.on("close", callback);
              },
              process.exit
            );
          });
        }
      );
    }
  );
}
