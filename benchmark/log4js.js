"use strict";

var log4js = require("log4js");

log4js.configure({
  "appenders": [{
    "type": "file",
    "filename": "./log4js.log"
  }]
});

require("./common.js")(log4js.getLogger("log4js"));
