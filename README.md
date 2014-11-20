###ln
#####master [![Build Status](https://travis-ci.org/wood1986/ln.svg?branch=master)](https://travis-ci.org/wood1986/ln) develop [![Build Status](https://travis-ci.org/wood1986/ln.svg?branch=develop)](https://travis-ci.org/wood1986/ln)

#####The SUPER BEST JSON logging library for Node.js

###Features
* Super fast file logging
* Super small memory footprint
* Support cluster logging on the same file with date rotation and custom file naming

###FAQ
####1. How to install?
     npm install ln

####2. How to use it?
####Instantiating ln
#####Code:
    var ln = require("ln");
    ln.PIPE_BUFF = 512; //set it in byte unit and based on the ulimit -a
                        //default is 4096
                        //for example
                        //pipe size            (512 bytes, -p) 2
                        //ln.PIPE_BUFF = 512 * 2;
                        //this controls the atomicity of the write operation
                        //writes of {PIPE_BUF} or fewer bytes shall be atomic

    var appenders = [{
      "level": "info",             //tell the appender what the minimum log level should log
      "type": "file",              //define the appender type. "console" and "file" is reserved
      "path": "[./log.]YYMMDDHHmm",//log to where
                                   //if you want to have log rotation, please define some tokens as a part of the filename
                                   //for the details and rules of tokens, you can take a look
                                   //http://momentjs.com/docs/#/displaying/format/
                                   //any chars inside [] will be escaped
                                   //if you do not need the rotation,
                                   //you can enclose the path with [] to be a static path, like "[./log]"
                                   //be aware of using [], static path is 400% faster than dynamic path.
      "isUTC": true                //optional. determinie the tokens, "YYMMDDHHmm", is in utc or local time
    }, {
      "level": "info",
      "type": "console"            //directly ouput to console
    }];

    var logA = new ln("a", appenders);
    logA.e("ln");
    logA.error(new Error("ln"));
    logA.e("ln", new Error("ln"), { a: true });  //you can call it with numbers of argument
                                                     //only the last json and string will used
#####Output:
    {"n":"a","h":"woods-mac-mini","p":340,"v":0,"t":1402197924414,"l":50,"m":"ln"}
    {"n":"a","h":"woods-mac-mini","p":340,"v":0,"t":1402197924428,"l":50,"m":"Error: ln\n    at Object.<anonymous> (/Users/wood/Desktop/ln/run.js:26:12)\n    at Module._compile (module.js:456:26)\n    at Object.Module._extensions..js (module.js:474:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:312:12)\n    at Function.Module.runMain (module.js:497:10)\n    at startup (node.js:119:16)\n    at node.js:906:3"}
    {"n":"a","h":"woods-mac-mini","p":340,"v":0,"t":1402197924431,"l":50,"m":"Error: ln\n    at Object.<anonymous> (/Users/wood/Desktop/ln/run.js:27:18)\n    at Module._compile (module.js:456:26)\n    at Object.Module._extensions..js (module.js:474:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:312:12)\n    at Function.Module.runMain (module.js:497:10)\n    at startup (node.js:119:16)\n    at node.js:906:3","j":{"a":true}}
####Referencing to existing appenders with another name
#####Code:
    logB = logA.clone("b");
    logB.error("Error");           //this is good for distinguishing the log messages from which ln
#####Output:
    {"n":"b","h":"woods-mac-mini","p":356,"v":0,"t":1402198400244,"l":50,"m":"Error"}
####Creating your formatter
#####Code:
    var log = new ln("a", [{
      "level": "info",
      "type": "console",
      "formatter": function(json) {  //define your formatter function in "format" attribute
        return util.format("[%s] [%s] [%s] - [%s]", json.t, ln.LEVEL[json.l], json.n, json.m);
      }
    }]);
    log.info("format");
#####Output:
    [1402490137999] [INFO] [a] - [format]
####Creating your appender
#####Code:
    var emitter = new events.EventEmitter();
    emitter.on("log", function(appender, timestamp, jsonString) {
      //please refer to the switch case statement
      //inside function ln(name, appenders) from ./lib/ln.js
      //as an example to write your custom code here
    });

    var log = new ln("ln", [{
      "level": "info"             //you just need to specify the "level" attributes for your custom appender
      "emitter": emitter
    }]);

####3. How super fast and small is it?
#####Testing environment
* Mac mini (Mid 2011)
* 2.3GHz i5
* 8GB RAM
* 128GB SSD
* OS X 10.10.1
* Node.js 0.10.33

#####Testing result

#####Thanks Ryan for making the benchmark script async. See [this](https://github.com/wood1986/ln/pull/3)

async `run.sh 100000`|ln (0.2.0)|ln (0.1.5)|bunyan (1.2.3)|log4js (0.6.20)|winston (0.8.3)
--:|:--:|:--:|:--:|:--:|:--:
real|**4.02s**|4.16s|5.60s|6.51s|6.35s
user|**3.66s**|3.79s|5.19s|6.10s|5.94s
sys |**1.35s**|1.35s|1.47s|1.44s|1.44s
maximum resident set size|**29.8M**|30.6M|52.4M|54.0M|33.6M|


####4. How can I verify your test?

* run `npm install log4js bunyan winston` in the main directory
* run `cd benchmark`
* run `run.sh 100000`

####5. What are `n`, `h`, `p`, `v`, `t`, `l`, `m` and `j` in the json message?
* `n`: name of the logger
* `h`: hostname
* `p`: process id
* `v`: version of the format
* `t`: timestamp in utc
* `l`: level
* `m`: message
* `j`: json

####6. Why does ln not use a readable name?
* This can make the write process and the file size slightly faster and smaller respectively.

####7. Existing logging libraries have rotation problem with cluster module. Why does ln not have this issue?
* Both bunyan and log4js rename the log file on ratation. The dissater happens on file renaming under cluster environment because of double files renaming.
* bunyan suggests using the process id as a part of the filename to tackle this issue. However, this will generate too many files.
* log4js provides a multiprocess appender and lets master to do the logging. However, this must have the bottleneck issue.
* To solve this, I just use `fs.createWriteStream(name, {"flags": "a"})` to create formatted log file at the beginning instead of `fs.rename` at the end. I tested this apporoach with millisecond rotation under cluster environment and no dissaters occured.

####8. Does ln have limitations?
* File size rotation does not support because keeping track of the file size before writing to the file is overhead and complicated.
* The logging messages are not in order under cluster environment. If you just focus on them from one process, they are in order.

####9. What are things missed?
* Decycle the json
* Let me know what you want to have?
