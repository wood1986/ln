/* global log:true */
var bunyan = require("bunyan");
log = bunyan.createLogger({
  name: "bunyan",
  streams: [{
    path: "./bunyan.log",
  }]
});
require("./common.js");
