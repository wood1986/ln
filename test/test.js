/* eslint-disable new-cap, no-new, no-sync*/

"use strict";

var assert = require("assert"),
    ln = require("../lib/ln.js"),
    os = require("os"),
    fs = require("fs"),
    moment = require("moment");

var VERSION = 0;

describe("Instantiate an object", function () {
  describe("with invalid parameters", function () {
    it("should throw an exception", function () {
      assert.throws(function () {
        new ln();
      });
      assert.throws(function () {
        new ln({"appenders": []});
      });
      assert.throws(function () {
        new ln({"name": "ln", "appenders": [{"level": "ln"}]});
      });
      assert.throws(function () {
        new ln({"name": "ln", "appenders": [{"formatter": {}}]});
      });
      assert.throws(function () {
        new ln({"name": "ln", "appenders": [{"write": {}}]});
      });
      assert.throws(function () {
        new ln("ln");
      });
      assert.throws(function () {
        new ln("ln", []);
      });
      assert.throws(function () {
        new ln("ln", {});
      });
      assert.throws(function () {
        new ln({"name": "ln", "appenders": [{"type": "file"}]});
      });
    });
  });

  describe("with valid parameters", function () {
    it("should not throw an exception", function () {
      assert.doesNotThrow(function () {
        new ln("ln", new ln({"name": "ln", "appenders": [{"type": "console"}]}));
        new ln({"name": "ln", "appenders": [{"type": "file", "path": "./a"}]});
        new ln("ln", [{"type": "console"}]);
        new ln("", [{}]);
      });
    });

    it("should have t, d, i, w, e, f, trace, debug, info, warn, error, fatal", function () {
      var log = new ln({"name": "ln", "appenders": [{}]});

      assert(log.t);
      assert(log.d);
      assert(log.i);
      assert(log.w);
      assert(log.e);
      assert(log.f);

      assert(log.trace);
      assert(log.debug);
      assert(log.info);
      assert(log.warn);
      assert(log.error);
      assert(log.fatal);

      assert.strictEqual(log.t, log.trace);
      assert.strictEqual(log.d, log.debug);
      assert.strictEqual(log.i, log.info);
      assert.strictEqual(log.w, log.warn);
      assert.strictEqual(log.e, log.error);
      assert.strictEqual(log.f, log.fatal);
    });

    it("should have correct level and formatter attribute", function () {
      var formatter0 = function () { },
          formatter1 = function () { },
          log = new ln({"name": "ln", "level": "info", "formatter": formatter0, "appenders": [{}, {"level": "trace", "formatter": formatter1}]});

      assert.strictEqual(log.appenders[0].level, 30);
      assert.strictEqual(log.appenders[0].formatter, formatter0);
      assert.strictEqual(log.appenders[1].level, 10);
      assert.strictEqual(log.appenders[1].formatter, formatter1);
    });
  });
});

describe("Verify the ln object", function () {
  var formatter = function () { },
      path = "[./ln]YYYYMMDDHH[][][][][[][][][][]][.log]",
      log = new ln({"name": "ln", "appenders": [{"type": "console", "level": "trace", "formatter": formatter}, {"type": "file", "path": path, "isUTC": false}]});

  it("should have basic props", function () {
    assert(log);
    assert(log.appenders);
    assert(log.fields);
    assert.strictEqual(log.fields.n, "ln");
    assert.strictEqual(log.fields.h, os.hostname());
    assert.strictEqual(log.fields.p, process.pid);
    assert.strictEqual(log.fields.v, VERSION);
  });

  describe("whose console appender", function () {
    it("should have specific props and functions", function () {
      var l = log.appenders[0];

      assert(l.write);
      assert.strictEqual(l.level, 10);
      assert.strictEqual(l.formatter, formatter);
    });
  });

  describe("whose file appender", function () {
    it("should have specific props and functions", function () {
      var l = log.appenders[1];

      ln.PIPE_BUF = 512;
      assert(l.write);
      assert.strictEqual(l.level, 10);
      assert.strictEqual(l.formatter, JSON.stringify);
      assert.strictEqual(l.period, "h");
      assert(l.isFlushed);
      assert(l.queue);
      log.i("i");
      assert(l.stream);
      assert.strictEqual(ln.PIPE_BUF, 512);
      assert.strictEqual(l.formattedPath, moment().format(path));
      var date = new Date();

      assert.strictEqual(l.next, moment([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).add(1, "h").valueOf());
      assert.ok(fs.existsSync(moment().format(path)));
    });
  });
});

describe("Verify the log level", function () {
  var n,
      write = function () {
        n++;
      },
      logFunction = function (log) {
        log.t("ln");
        log.d("ln");
        log.i("ln");
        log.w("ln");
        log.e("ln");
        log.f("ln");
      };

  it("with a single ln should log certain times", function (done) {
    var log = new ln({"name": "ln", "appenders": [{"write": write, "level": "error"}]});

    n = 0;
    logFunction(log);
    assert.strictEqual(n, 2);
    done();
  });

  it("with multiple ln(s) should log certain times", function (done) {
    var log0 = new ln({"name": "ln", "appenders": [{"write": write, "level": "error"}]}),
        log1 = new ln({"name": "ln", "appenders": [{"write": write, "level": "debug"}]});

    n = 0;
    logFunction(log0);
    logFunction(log1);
    assert.strictEqual(n, 7);
    done();
  });
});

describe("Log", function () {
  var log = new ln({"name": "test", "appenders": [{"level": "trace"}]});

  describe("without pass anything", function () {
    it("should have nothing", function () {
      log.appenders[0].write = function () {
        assert(false);
      };

      log.trace();
    });
  });

  describe("a simple string at trace level", function () {
    it("should have the trace stack and the fields, n, h, l, p, v and t with correct values", function () {
      log.appenders[0].write = function (timestamp, string) {
        var json = JSON.parse(string);

        assert.strictEqual(json.n, "test");
        assert.strictEqual(json.h, os.hostname());
        assert.strictEqual(json.l, log.appenders[0].level);
        assert.strictEqual(json.p, process.pid);
        assert.strictEqual(json.v, VERSION);
        assert.strictEqual(json.t, timestamp);
        assert(json.m.length);
      };

      log.trace(1);
    });
  });

  describe("a simple string", function () {
    it("should have this string", function () {
      var m = "string";

      log.appenders[0].write = function (timestamp, string) {
        var json = JSON.parse(string);

        assert.strictEqual(json.m, m);
      };

      log.info(m);
    });
  });

  describe("an error", function () {
    it("should have the error stack", function () {
      var e = new Error("error");

      log.appenders[0].write = function (timestamp, string) {
        var json = JSON.parse(string);

        assert.strictEqual(json.m, e.stack);
      };

      log.info(e);
    });
  });

  describe("a json", function () {
    it("should have this json", function () {
      var j = {"json": "json"};

      log.appenders[0].write = function (timestamp, string) {
        var json = JSON.parse(string);

        assert.strictEqual(JSON.stringify(j), JSON.stringify(json.j));
      };

      log.info(j);
    });
  });

  describe("multiple messages, errors and objects", function () {
    it("should log the last values", function () {
      var j0 = {"json0": "json0"},
          j1 = {"json1": "json1"},
          m0 = "string0",
          m1 = "string1",
          e0 = new Error("error0"),
          e1 = new Error("error1");

      log.appenders[0].write = function (timestamp, string) {
        var json = JSON.parse(string);

        assert.strictEqual(JSON.stringify(j1), JSON.stringify(json.j));
        assert.strictEqual(JSON.stringify(m1), JSON.stringify(json.m));
      };

      log.info(j0, j1, e0, e1, m0, m1);

      log.appenders[0].write = function (timestamp, string) {
        var json = JSON.parse(string);

        assert.strictEqual(JSON.stringify(j1), JSON.stringify(json.j));
        assert.strictEqual(JSON.stringify(e1.stack), JSON.stringify(json.m));
      };

      log.info(j0, j1, m0, m1, e0, e1);
    });
  });
});
