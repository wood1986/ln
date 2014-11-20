/*global describe, it*/
"use strict";
var assert = require("assert");
var ln = require("../lib/ln.js");
var util = require("util");
var os = require("os");
var fs = require("fs");
var moment = require("moment");
var VERSION = 0;

describe("new ln", function() {
  it("with passing less than 2 arguemnts", function() {
    assert.throws(function() {
      new ln();
      new ln("");
    });
  });

  it("with invalid logger name", function() {
    assert.throws(function() {
      new ln("", [{ "type": "console", "level": "info" }]);
      new ln(null, [{ "type": "console", "level": "info" }]);
    });
  });

  it("with invalid appenders", function() {
    assert.throws(function() {
      new ln("empty", []);
      new ln("empty", {});
      new ln("empty", null);
      new ln("empty", true);
      new ln("empty", 1);
      new ln("empty", undefined);
      new ln("empty", "");
      new ln("empty", [{ "level": "info", "formatter": [] }]);
      new ln("a", [{ "type": "file", "level": "info" }]);
    });
  });

  it("with valid params", function() {
    var a = null;

    assert.doesNotThrow(function() {
      var path = "[./ln.log]";
      a = new ln("a", [{ "type": "file", "level": "info", "path": path }]);
      assert.ok(a.appenders[0].hasOwnProperty("queue"));
      assert.ok(a.appenders[0].hasOwnProperty("isFlushed"));
      assert.ok(a.appenders[0].hasOwnProperty("formatter"));
      assert.ok(!a.appenders[0].hasOwnProperty("key"));
      assert.ok(a.appenders[0].hasOwnProperty("formattedPath"));
      assert.ok(a.appenders[0].isFlushed);
      assert.strictEqual(a.appenders[0].path, path);
      assert.strictEqual(a.appenders[0].formattedPath, moment().format(path));

      a = new ln("a", [{ "type": "console", "level": "info" }]);
      assert.ok(a.appenders[0].hasOwnProperty("formatter"));

      a = new ln("a", [{ "level": "info", "formatter": JSON.stringify }]);
    });
  });
});

describe("log", function () {
  var name = "test";
  var message1 = "message1";
  var error1 = new Error("error1");
  var json1 = { "value": "json1" };
  var message2 = "message2";
  var error2 = new Error("error2");
  var json2 = { "value": "json2" };

  var log = new ln(name, [ { "type": "test", "level": "info" } ]);
  var appender = log.appenders[0];

  it("a simple string", function () {
    appender.write = function (timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message1);
    };
    log.info(message1);
  });

  it("an error", function () {
    appender.write = function (timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, error1.stack);
    };
    log.info(error1);
  });

  it("a simple string and an object", function () {
    appender.write = function (timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message1);
      assert.strictEqual(JSON.stringify(data.j), JSON.stringify(json1));
    };
    log.info(message1, json1);
  });

  it("multiple strings, objects and errors", function () {
    appender.write = function (timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message2);
      assert.strictEqual(JSON.stringify(data.j), JSON.stringify(json2));
    };
    log.info(error1, error2, message1, message2, json1, json2);
  });

  it("with multiple strings, objects, errors", function () {
    appender.write = function (timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message2);
      assert.strictEqual(JSON.stringify(data.j), JSON.stringify(json2));
    };
    log.info(error1, error2, message1, message2, json1, json2);
  });

  it("a simple string", function () {
    appender.write = function (timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message1);
      assert.ok(!data.hasOwnProperty("j"));
    };
    log.info(message1);
  });

  it("a simple json", function () {
    appender.write = function (timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.ok(!data.hasOwnProperty("m"));
      assert.strictEqual(JSON.stringify(data.j), JSON.stringify(json1));
    };
    log.info(json1);
  });

  it("with a custom formatter", function () {
    appender.formatter = function (json) {
      return util.format("[%s] [%s] [%s] - [%s]", json.t, ln.LEVEL[json.l], json.n, json.m);
    };
    appender.write = function (timestamp, string) {
      assert.strictEqual(string, util.format("[%s] [%s] [%s] - [%s]\n", timestamp, ln.LEVEL[log.appenders[0].level], name, message1));
    };
    log.info(message1);
  });
});

describe("file type appender", function () {
  var path = "", log = null;
  it("with a fixed path", function () {
    path = "[./ln.log][][][][][[][][][][]]";
    log = new ln("ln", [ { "type": "file", "level": "info", "path": path } ]);
    log.info("ln");
    assert.ok(log.appenders[0].hasOwnProperty("formattedPath"));
    assert.ok(!log.appenders[0].hasOwnProperty("period"));
    assert.ok(!log.appenders[0].hasOwnProperty("next"));
    assert.strictEqual(log.appenders[0].formattedPath, moment().format(path));
    assert.ok(fs.existsSync(moment().format(path)));
  });

  it("with a date path", function () {
    path = "[./ln.log.]YYYYMMDDHHmmss";
    log = new ln("ln", [ { "type": "file", "level": "info", "path": path } ]);
    log.info("ln");
    assert.ok(log.appenders[0].hasOwnProperty("formattedPath"));
    assert.ok(log.appenders[0].hasOwnProperty("period"));
    assert.ok(log.appenders[0].hasOwnProperty("next"));
    assert.strictEqual(log.appenders[0].formattedPath, moment().format(path));
    assert.ok(fs.existsSync(moment().format(path)));
    setTimeout(function () {
      log.info("ln");
      assert.ok(fs.existsSync(moment().format(path)));
    }, 3);
  });
});

describe("verify", function () {
  var count = 0;
  var add = function () {
    count++;
  };

  it("cloned log", function () {
    var log = new ln("ln", [ { "type": "test", "level": "info" } ]);
    var clog = log.clone("cln");
    assert.strictEqual(log.appenders, clog.appenders);
    assert.strictEqual(log.fields.n, "ln");
    assert.strictEqual(clog.fields.n, "cln");
    count = 0;
    log.appenders[0].write = add;
    log.info("");
    clog.info("");
    assert.strictEqual(count, 2);
  });

  it("all levels", function () {
    var log = new ln("level", [ { "type": "test", "level": "trace" } ]);
    count = 0;
    log.appenders[0].write = add;
    log.trace("");
    log.debug("");
    log.info("");
    log.error("");
    log.fatal("");
    assert.strictEqual(count, 5);
  });

  it("a single level", function () {
    var log = new ln("level", [ { "type": "test", "level": "fatal" } ]);
    count = 0;
    log.appenders[0].write = add;
    log.trace("");
    log.debug("");
    log.info("");
    log.error("");
    log.fatal("");
    assert.strictEqual(count, 1);
  });

  it("multiple streams with multiple levels", function () {
    var log = new ln("level", [
      { "type": "error", "level": "error" },
      { "type": "debug", "level": "debug" }
    ]);
    count = 0;
    log.appenders[0].write = add;
    log.appenders[1].write = add;
    log.trace("");
    log.debug("");
    log.info("");
    log.error("");
    log.fatal("");
    assert.strictEqual(count, 6);
  });
});
