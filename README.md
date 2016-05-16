[![Build Status](https://travis-ci.org/wood1986/ln.svg?branch=master)](https://travis-ci.org/wood1986/ln)

## Features

* Super fast file logging
* Super small memory footprint
* Super reliable no matter if node quits unexpectedly
* Support cluster logging on the same file with date rotation and custom file naming

## Changelog since 0.2.3

* Remove `ln.clone(name)`, `ln(name, appenders)` and `PIPE_BUFF`
  * `ln.clone(name) -> new ln({"name": name, "ln": ln})`
  * `new ln(name, ln) -> new ln({"name": name, "ln": ln})`
  * `new ln(name, appenders) -> new ln({"name": name, "appenders": appenders})`
  * `PIPE_BUFF -> PIPE_BUF`
* Modularize the console and file appender
* Increase the logging performance by ~5%
* Fix the filename bug when isUTC is true
* Pre-define the default values for certain parameters
* Handle unwritten log entries when node quits unexpectedly

## FAQ

### 1. How to install?

    npm install ln

### 2. How to use it?

#### Instantiating ln

    //Code:
    var ln = require("ln");
    ln.PIPE_BUF = 512;  //Set it in byte unit and based on the ulimit -a.
                        //Default is 4096.
                        //For example,
                        //pipe size            (512 bytes, -p) 2
                        //ln.PIPE_BUF = 512 * 2;
                        //This controls the atomicity of the write operation.
                        //Writes of {PIPE_BUF} or fewer bytes shall be atomic

    var appenders = [{
      "level": "info",              //Optional. It tells the appender what level should log.
                                    //Default level will be "INFO" and "TRACE" if NODE_ENV=production and NODE_ENV=development respectively.
      "type": "file",               //It defines the appender type. "file" is reserved and "console" is the default appender.
      "path": "[./log.]YYMMDDHHmm", //It defines the name and path of the log file.
                                    //If you want to have log rotation, please define some tokens as a part of the filename.
                                    //For the details and rules of tokens, you can take a look
                                    //http://momentjs.com/docs/#/displaying/format/.
                                    //Any chars inside [] will be escaped
                                    //If you do not need the rotation,
                                    //You can enclose the path with [] to be a static path, like "[./log]".
                                    //Be aware of using [], static path is 400% faster than dynamic path.
      "isUTC": true                 //Optional. It determines the tokens, "YYMMDDHHmm", is in UTC or local time
                                    //Default is true.
    }, {
      "level": "info",
      "type": "console"             //It directly outputs to console.
    }];

    var log = new ln({"name": "a", "appenders": appenders});
    log.e("ln");  //Android-like logging signature:
                  //log.trace = log.t
                  //log.debug = log.d
                  //log.info  = log.i
                  //log.warn  = log.w
                  //log.error = log.e
                  //log.fatal = log.f
    log.error(new Error("ln"));
    log.e("ln", new Error("ln"), { a: true });  //You can pass numbers of arguments,
                                                //however, only the last JSON and string will used.


    //Output:
    {"n":"a","h":"woods-mac-mini","p":340,"v":0,"t":1402197924414,"l":50,"m":"ln"}
    {"n":"a","h":"woods-mac-mini","p":340,"v":0,"t":1402197924428,"l":50,"m":"Error: ln\n    at Object.<anonymous> (/Users/wood/Desktop/ln/run.js:26:12)\n    at Module._compile (module.js:456:26)\n    at Object.Module._extensions..js (module.js:474:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:312:12)\n    at Function.Module.runMain (module.js:497:10)\n    at startup (node.js:119:16)\n    at node.js:906:3"}
    {"n":"a","h":"woods-mac-mini","p":340,"v":0,"t":1402197924431,"l":50,"m":"Error: ln\n    at Object.<anonymous> (/Users/wood/Desktop/ln/run.js:27:18)\n    at Module._compile (module.js:456:26)\n    at Object.Module._extensions..js (module.js:474:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:312:12)\n    at Function.Module.runMain (module.js:497:10)\n    at startup (node.js:119:16)\n    at node.js:906:3","j":{"a":true}}

#### Referencing to existing appenders with another name

    //Code:
    var logA = new ln({"name": "a", "appenders": [{}]}),
        logB = new ln({"name": "b", "ln": logA});
    logB.error("Error");  //This is good for distinguishing the log messages from which ln


    //Output:
    {"n":"b","h":"woods-mac-mini","p":356,"v":0,"t":1402198400244,"l":50,"m":"Error"}

#### Creating your formatter

    //Code:
    var log = new ln({
      "name": "a",
      "appenders": [
        {
          "formatter": function (json) {  //It customizes the log format.
            return util.format("[%s] [%s] [%s] - [%s]", json.t, ln.LEVEL[json.l], json.n, json.m);
          }
        }
      ]
    })
    log.info("format");


    //Output:
    [1402490137999] [INFO] [a] - [format]

#### Creating your appender

    //Code:
    var write = function(timestamp, string) {
      //please refer to consoleAppender or fileAppender
      //as an example to write your custom code here
    });

    var log = new ln({"name": "b", "appenders": [
      "level": "info"
      "write": write
    ]});

#### Hidden ways of instantiating

    //Code:
    var log = new ln({
      "name": "a",
      "level": "info",  //The level and formatter are shared across the appenders.
                        //The level and formatter inside the appenders take the highest priority.
      "formatter": function (json) {
        return util.format("[%s] [%s] [%s] - [%s]", json.t, ln.LEVEL[json.l], json.n, json.m);
      },
      "appenders": [
        ...
      ]
    );

### 3. How super fast, small and reliable is it?

#### Testing environment

Mac mini (Mid 2011)

* 2.3GHz i5
* 8GB RAM
* 128GB SSD
* OS X 10.11.4
* Node.js 6.1.0

#### Testing result

Thanks Ryan for making the benchmark script async. See [this](https://github.com/wood1986/ln/pull/3)

    name    version async  real(s)  user(s) sys(s)  rss(MB) tail
    ============================================================
    bunyan  1.8.1   false   3.71    3.51    0.11    85
    bunyan  1.8.1   true    6.70    6.24    1.81    30	    {"name":"bunyan","hostname":"WooDs-Mac-mini.local","pid":453,"level":30,"msg":"99998","time":"2016-05-16T06:31:03.107Z","v":0}
    log4js  0.6.36  false   3.00    2.94    0.07    78
    log4js  0.6.36  true    6.77    6.28    1.94    30	    [2016-05-15 23:31:22.055] [INFO] log4js - 99998
    winston 2.2.0   false   4.48    4.35    0.13    248
    winston 2.2.0   true    7.47    7.03    1.42    30	    {"level":"info","message":"99998","timestamp":"2016-05-16T06:31:45.347Z"}
    ln      0.4.1   false   1.23*   1.09*   0.12*   89      {"n":"ln","h":"WooDs-Mac-mini.local","p":496,"v":0,"t":1463380307604,"l":30,"m":99999}
    ln      0.4.1   true    3.98*   3.62*   1.31*   24*     {"n":"ln","h":"WooDs-Mac-mini.local","p":504,"v":0,"t":1463380315700,"l":30,"m":99999}


`bunyan`, `log4js` and `winston` lost all the logs in the sync test and the last log in the sync and async test respectively. In the async test, their final log entry was `99998` instead of `99999`.

### 4. How can I verify your test?

* run `npm install log4js bunyan winston` in the main directory
* run `cd comparison`
* run `node run.js <Optional number of writes with default value 100000>`

### 5. What are `n`, `h`, `p`, `v`, `t`, `l`, `m` and `j` in the json message?

* `n`: name of the logger
* `h`: hostname
* `p`: process id
* `v`: version of the format
* `t`: timestamp in UTC
* `l`: level
* `m`: message
* `j`: json

### 6. Why doesn't ln use a readable name?

* This can make the write process and the file size slightly faster and smaller respectively.

### 7. Existing logging libraries have rotation problem with cluster module. Why doesn't ln have this issue?

* Both `bunyan` and `log4js` rename the log file on rotation. The disaster happens on file renaming under cluster environment because of double files renaming.
* `bunyan` suggests using the process id as a part of the filename to tackle this issue. However, this will generate too many files.
* `log4js` provides a multiprocess appender and lets master log everything. However, this must have the bottleneck issue.
* To solve this, I just use `fs.createWriteStream(name, {"flags": "a"})` to create a formatted log file at the beginning instead of `fs.rename` at the end. I tested this approach with millisecond rotation under cluster environment and no disasters occurred.

### 8. Does ln have limitations?

* File size rotation does not support because keeping track of the file size before writing to the file is overhead and complicated.
* The logging messages are not in order under cluster environment. If you just focus on one process, they are in order.
* Duplicated log entries is a known issue when node quits unexpectedly during the write and it cannot be fixed.
  * Because node no longer runs any async operations in the event loop. The async operation in this case is `drain`'s callback and it is the place of deleting the written log entries from RAM. Therefore, it's impossible to know the previous write is successful or not. My goal is to make sure everything is written to the file before the quit.

### 9. What are things missed?

* Decycle the json
* Let me know what you want to have?
