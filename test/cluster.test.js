/*global describe, it*/
"use strict";
var cluster = require("cluster");
var fs = require("fs");
var glob = require("glob");
var path = "./ln.log.";
var assert = require("assert");
var async = require("async");

describe("run ln in cluster environment", function() {
  this.timeout(10000);
  var n = 1000; //#calling log.info
  var i = 0;
  it("with large write and frequent log rotation", function(done) {
    assert.doesNotThrow(function() {
      if (cluster.isMaster) {
        var stats = {};
        var m = 4; //spawn m processes
        for (i = 0; i < m; i++) {
          var worker = cluster.fork();
          stats[worker.process.pid.toString()] = -1;
          cluster.on("exit", function() {
            if (!--m) {
              glob(path + "*", {}, function(err, matches) {
                if (err) {
                  throw err;
                }
                async.eachSeries(matches, function(file, callback) {
                  var stream = fs.createReadStream(file, {
                    flags: "r",
                    autoClose: true
                  });
                  var c = "",
                      line = "";
                  stream.on("readable", function() {
                    while ((c = stream.read(1))) {
                      c = c.toString();
                      if (c === "\n") {
                        var json = JSON.parse(line);
                        assert.strictEqual(json.t % 1000, parseInt(file.substring(file.length - 3))); //check whether the log messages exist in the correct file
                        assert.strictEqual(stats[json.p.toString()] + 1, json.m);                     //check whether the log message is in order for each process
                        stats[json.p.toString()] = json.m;
                        line = "";
                      } else {
                        line += c;
                      }
                    }
                    stream.resume();
                  });
                  stream.on("end", function() {
                    callback();
                  });
                }, function() {
                  for (var p in log) {
                    assert.strictEqual(stats[p], n - 1);
                  }
                  done();
                });
              });
            }
          });
        }
      } else {
        var ln = require("../lib/ln.js");
        var appender = {
          "type": "file",
          "path": "[" + path + "]YYYYMMDDHHmmssSSS",
          "level": "info"
        };
        ln.PIPE_BUFF = 512;
        /* jshint newcap: false */
        var log = new ln("ln", [appender]);
        var tick = function() {
          log.info(i++);
          if (i < n) {
            setImmediate(tick);
          } else {
            setTimeout(function () {
              process.exit(0);
            }, 100); //provide enough time for the write process
          }
        };
        setImmediate(tick);
      }
    });
  });
});
