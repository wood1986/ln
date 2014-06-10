log = require("winston");
log.add(log.transports.File, { filename: "winston.log" });
log.remove(log.transports.Console);
require("./common.js");