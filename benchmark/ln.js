"use strict";

var ln = require("../lib/ln.js");

var log = new ln("ln", [{ // eslint-disable-line new-cap
  "type": "file",
  "path": "[./ln.log]"
}]);

require("./common.js")(log);
