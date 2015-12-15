"use strict";

var ln = require("../lib/ln.js");

var log = new ln({  // eslint-disable-line new-cap
  "name": "ln",
  "appenders": [{
    "type": "file",
    "path": "[./ln.log]"
  }]
});

require("./common.js")(log);
