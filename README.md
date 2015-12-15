[![Build Status](https://travis-ci.org/wood1986/ln.svg?branch=master)](https://travis-ci.org/wood1986/ln)

## Features

* Super fast file logging
* Super small memory footprint
* Super reliable when the node quits unexpectedly
* Support cluster logging on the same file with date rotation and custom file naming

## Changelog since 0.2.3

* Prepare the deprecation for `ln.clone(name)`, `ln(name, appenders)` and `PIPE_BUFF`
  * `ln.clone(name) -> new ln({"name": name, "ln": ln})`
  * `new ln(name, ln) -> new ln({"name": name, "ln": ln})`
  * `new ln(name, appenders) -> new ln({"name": name, "appenders": appenders})`
  * `PIPE_BUFF -> PIPE_BUF`
* Modularize the console and file appender
* Increase the logging performance by ~5%
* Fix the filename bug when isUTC is true
* Pre-define the default values for certain parameters
* Handle the log entries when the node quits unexpectedly
  * Duplicated log entries is a known issue and it cannot be fixed at this moment
    * It happens when the node quits unexpectedly during the write because the event loop is no longer executing any async operations. The async operation in this case is `drain`'s callback which is the place of deleting the written log entries from queue. Therefore, it's impossible to know whether the previous write is successful in this situation. My goal is to make sure everything is written to file before the quit.

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
    log.e("ln", new Error("ln"), { a: true });  //You can pass numbers of argument,
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
* OS X 10.11.2
* Node.js 5.2.0

#### Testing result

Thanks Ryan for making the benchmark script async. See [this](https://github.com/wood1986/ln/pull/3)

    name    version async  real(s)  user(s) sys(s)  rss(MB) tail
    ============================================================
    bunyan  1.5.1   false   3.32    3.17    0.10    82
    bunyan  1.5.1   true    6.28    5.82    1.68    24	    {"name":"bunyan","hostname":"WooDs-Mac-mini.local","pid":6984,"level":30,"msg":"99998","time":"2015-12-15T07:32:53.825Z","v":0}
    log4js  0.6.29  false   4.11    4.04    0.08    77
    log4js  0.6.29  true    6.95    6.54    1.55    29	    [2015-12-14 23:33:16.602] [INFO] log4js - 99998
    winston 2.1.1   false   6.22    6.01    0.21    262
    winston 2.1.1   true    7.97    7.51    1.66    48	    {"level":"info","message":"99998","timestamp":"2015-12-15T07:33:44.081Z"}
    ln	    0.4.0   false   1.04*   0.94*   0.09*   88	    {"n":"ln","h":"WooDs-Mac-mini.local","p":7084,"v":0,"t":1450164826015,"l":30,"m":99999}
    ln	    0.4.0   true    4.03*   3.66*   1.45*   22*	    {"n":"ln","h":"WooDs-Mac-mini.local","p":7100,"v":0,"t":1450164834237,"l":30,"m":99999}


`bunyan`, `log4js` and `winston` lost all the logs in sync test and lost the last log in async test because their final message was 99998 instead of 99999.

### 4. How can I verify your test?

* run `npm install log4js bunyan winston` in the main directory
* run `cd benchmark`
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

* Both bunyan and log4js rename the log file on rotation. The disaster happens on file renaming under cluster environment because of double files renaming.
* bunyan suggests using the process id as a part of the filename to tackle this issue. However, this will generate too many files.
* log4js provides a multiprocess appender and lets master to do the logging. However, this must have the bottleneck issue.
* To solve this, I just use `fs.createWriteStream(name, {"flags": "a"})` to create formatted log file at the beginning instead of `fs.rename` at the end. I tested this approach with millisecond rotation under cluster environment and no disasters occurred.

### 8. Does ln have limitations?

* File size rotation does not support because keeping track of the file size before writing to the file is overhead and complicated.
* The logging messages are not in order under cluster environment. If you just focus on them from one process, they are in order.

### 9. What are things missed?

* Decycle the json
* Let me know what you want to have?
