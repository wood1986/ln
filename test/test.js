/*global describe, it*/
"use strict";
var assert = require("assert");
var ln = require("../lib/ln.js");
var util = require("util");
var os = require("os");
var VERSION = 0;

describe("new ln", function() {
  it("with passing less than 2 arguemnts", function () {
    assert.throws(function() { new ln(); });
    assert.throws(function() { new ln(""); });
  });

  it("with invalid logger name", function () {
    assert.throws(function() { new ln("", [ { "type": "console", "level": "info" } ]); });
    assert.throws(function() { new ln(null, [ { "type": "console", "level": "info" } ]); });
  });

  it("with invalid appenders", function () {
    assert.throws(function() { new ln("empty", []); });
    assert.throws(function() { new ln("empty", {}); });
    assert.throws(function() { new ln("empty", null); });
    assert.throws(function() { new ln("empty", true); });
    assert.throws(function() { new ln("empty", 1); });
    assert.throws(function() { new ln("empty", undefined); });
    assert.throws(function() { new ln("empty", ""); });
  });

  it("with valid params", function() {
    var a = null;

    assert.doesNotThrow(function() { a = new ln("a", [ {"type": "file", "level":"info"} ] ); });
    assert.ok(a.appenders[0].hasOwnProperty("emitter"));
    assert.ok(a.appenders[0].hasOwnProperty("queue"));
    assert.ok(a.appenders[0].hasOwnProperty("isFlushed"));
    assert.ok(a.appenders[0].hasOwnProperty("format"));

    assert.doesNotThrow(function() { a = new ln("a", [ {"type": "console", "level":"info"} ] ); });
    assert.ok(a.appenders[0].hasOwnProperty("emitter"));
    assert.ok(a.appenders[0].hasOwnProperty("format"));

    var b = a.clone("b");

    assert.strictEqual(b.fields.n, "b");
    assert.strictEqual(a.fields.n, "a");
  });

  it("with invoking clone", function() {
    assert.throws(function() { new ln("empty", [ {"type": "console", "level":"info"} ] ).clone(""); });
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

  it("a simple string", function (done) {
    appender.emitter.removeAllListeners();
    appender.emitter.on("log", function (appender, timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message1);
      done();
    });
    log.info(message1);
  });

  it("an error", function (done) {
    appender.emitter.removeAllListeners();
    appender.emitter.on("log", function (appender, timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, error1.stack);
      done();
    });
    log.info(error1);
  });

  it("a simple string and an object", function (done) {
    appender.emitter.removeAllListeners();
    appender.emitter.on("log", function (appender, timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message1);
      assert.strictEqual(JSON.stringify(data.j), JSON.stringify(json1));
      done();
    });
    log.info(message1, json1);
  });

  it("multiple strings, objects and errors", function (done) {
    appender.emitter.removeAllListeners();
    appender.emitter.on("log", function (appender, timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message2);
      assert.strictEqual(JSON.stringify(data.j), JSON.stringify(json2));
      done();
    });
    log.info(error1, error2, message1, message2, json1, json2);
  });

  it("with multiple strings, objects, errors", function (done) {
    appender.emitter.removeAllListeners();
    appender.emitter.on("log", function (appender, timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message2);
      assert.strictEqual(JSON.stringify(data.j), JSON.stringify(json2));
      done();
    });
    log.info(error1, error2, message1, message2, json1, json2);
  });

  it("a simple string", function (done) {
    appender.emitter.removeAllListeners();
    appender.emitter.on("log", function (appender, timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.strictEqual(data.m, message1);
      assert.ok(!data.hasOwnProperty("j"));
      done();
    });
    log.info(message1);
  });

  it("a simple json", function (done) {
    appender.emitter.removeAllListeners();
    appender.emitter.on("log", function (appender, timestamp, string) {
      var data = JSON.parse(string);
      assert.strictEqual(data.n, name);
      assert.strictEqual(data.h, os.hostname());
      assert.strictEqual(data.l, log.appenders[0].level);
      assert.strictEqual(data.p, process.pid);
      assert.strictEqual(data.v, VERSION);
      assert.strictEqual(data.t, timestamp);
      assert.ok(!data.hasOwnProperty("m"));
      assert.strictEqual(JSON.stringify(data.j), JSON.stringify(json1));
      done();
    });
    log.info(json1);
  });

  it("with a custom formatter", function (done) {
    appender.emitter.removeAllListeners();
    appender.format = function (json) {
      return util.format("[%s] [%s] [%s] - [%s]", json.t, ln.LEVEL[json.l], json.n, json.m);
    };
    appender.emitter.on("log", function (appender, timestamp, string) {
      assert.strictEqual(string, util.format("[%s] [%s] [%s] - [%s]\n", timestamp, ln.LEVEL[log.appenders[0].level], name, message1));
      done();
    });
    log.info(message1);
  });
});

describe("verify", function () {
  var count = 0;
  var add = function () {
    count++;
  };

  it("all levels", function (done) {
    var log = new ln("level", [ { "type": "test", "level": "trace" } ]);
    count = 0;
    log.appenders[0].emitter.on("log", add);
    log.trace("");
    log.debug("");
    log.info("");
    log.error("");
    log.fatal("");
    setTimeout(function () {
      assert.strictEqual(count, 5);
      done();
    }, 10);
  });

  it("a single level", function (done) {
    var log = new ln("level", [ { "type": "test", "level": "fatal" } ]);
    count = 0;
    log.appenders[0].emitter.on("log", add);
    log.trace("");
    log.debug("");
    log.info("");
    log.error("");
    log.fatal("");
    setTimeout(function () {
      assert.strictEqual(count, 1);
      done();
    }, 10);
  });

  it("multiple streams with multiple levels", function (done) {
    var log = new ln("level", [
      { "type": "error", "level": "error" },
      { "type": "debug", "level": "debug" }
    ]);
    count = 0;
    log.appenders[0].emitter.on("log", add);
    log.appenders[1].emitter.on("log", add);
    log.trace("");
    log.debug("");
    log.info("");
    log.error("");
    log.fatal("");
    setTimeout(function () {
      assert.strictEqual(count, 6);
      done();
    }, 10);
  });
});
