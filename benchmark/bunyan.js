"use strict";

var bunyan = require("bunyan");

var log = bunyan.createLogger({
  "name": "bunyan",
  "streams": [{
    "path": "./bunyan.log"
  }]
});

require("./common.js")(log);
