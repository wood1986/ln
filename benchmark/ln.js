var ln = require("../lib/ln.js");
ln.PIPE_BUFF = 512;
log = new ln("ln", [{
  "type": "file",
  "path": "[./ln.log]",
  "level": "info"
}]);
require("./common.js");