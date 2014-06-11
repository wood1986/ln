/* global log:true */
var log4js = require("log4js");
log4js.configure({
  appenders: [{
    type: "file",
    filename: "./log4js.log"
  }]
});
log = log4js.getLogger("log4js");
require("./common.js");
