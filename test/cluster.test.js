/*global describe, it*/
"use strict";
var cluster = require("cluster");
var fs = require("fs");
var glob = require("glob");
var path = "./ln.log.";
var assert = require("assert");

describe("run ln in cluster environment", function() {
  this.timeout(60000);
  var n = 0;
  var i = 0;
  it("with large write and frequent log rotation", function(done) {
    assert.doesNotThrow(function() {
      if (cluster.isMaster) {
        n = 4;
        for (i = 0; i < n; i++) {
          cluster.fork().on("exit", function() {
            if (--n === 0) {
              glob(path + "*", {}, function(err, matches) {
                if (err) {
                  throw err;
                }
                matches.forEach(function(file) {
                  var stream = fs.createReadStream(file, {
                    flags: "r",
                    autoClose: true
                  });
                  var c = "";
                  var line = "";
                  stream.on("readable", function() {
                    while (null !== (c = stream.read(1))) {
                      c = c.toString();
                      if (c === "\n") {
                        JSON.parse(line);
                        line = "";
                      } else {
                        line += c;
                      }
                    }
                    stream.resume();
                  });
                });
                done();
              });
            }
          });
        }
      } else {
        var ln = require("../lib/ln.js");
        var appender = {
          "type": "file",
          "path": "[" + path + "]YYYYMMDDHHmmss",
          "level": "info"
        };
        ln.PIPE_BUFF = 512;
        /* jshint newcap: false */
        var log = new ln("ln", [appender]);
        n = 100000;
        var tick = function() {
          log.info(i);
          if ((i++) < n) {
            setImmediate(tick);
          } else {
            process.exit(0);
          }
        };
        setImmediate(tick);
      }
    });
  });
});
