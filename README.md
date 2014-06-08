###ln[![Build Status](https://travis-ci.org/wood1986/ln.svg?branch=master)](https://travis-ci.org/wood1986/ln)
#####The BEST JSON logging library for Node.js

###Features
* Fast file logging
* Small memory footprint
* Support cluster logging on the same file with date rotation and custom file naming

###FAQ
####1. How to install?
     npm install ln

####2. How to use it?
#####Basic
#####Code:
    var ln = require("ln");
    ln.PIPE_BUFF = 512; //set it in byte unit and based on the ulimit -a
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
                                    //for the details of tokens, you can take a look
                                    //http://momentjs.com/docs/#/displaying/format/
                                    //any chars inside [] will be escaped
       "isUTC": true                //optional. determinie the tokens, "YYMMDDHHmm", is in utc or local time
    }, {
       "level": "info",
       "type": "console"            //directly ouput to console
    }];
    
    var logA = new ln("a", appenders);
    logA.error("ln");
    logA.error(new Error("ln"));
    logA.error("ln", new Error("ln"), { a: true });  //you can call it with numbers of argument
                                                     //only the last json and string will used
#####Output:
    {"n":"a","h":"woods-mac-mini","p":340,"v":0,"t":1402197924414,"l":50,"m":"ln"}
    {"n":"a","h":"woods-mac-mini","p":340,"v":0,"t":1402197924428,"l":50,"m":"Error: ln\n    at Object.<anonymous> (/Users/wood/Desktop/ln/run.js:26:12)\n    at Module._compile (module.js:456:26)\n    at Object.Module._extensions..js (module.js:474:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:312:12)\n    at Function.Module.runMain (module.js:497:10)\n    at startup (node.js:119:16)\n    at node.js:906:3"}
    {"n":"a","h":"woods-mac-mini","p":340,"v":0,"t":1402197924431,"l":50,"m":"Error: ln\n    at Object.<anonymous> (/Users/wood/Desktop/ln/run.js:27:18)\n    at Module._compile (module.js:456:26)\n    at Object.Module._extensions..js (module.js:474:10)\n    at Module.load (module.js:356:32)\n    at Function.Module._load (module.js:312:12)\n    at Function.Module.runMain (module.js:497:10)\n    at startup (node.js:119:16)\n    at node.js:906:3","j":{"a":true}}
#####Intermediate
#####Code:
    logB = logA.clone("b");    //the existing appenders can be referenced to a new one with another name
                               //this is good for distinguishing the log messages from which loggers
    logB.error("Error");

#####Output:
    {"n":"b","h":"woods-mac-mini","p":356,"v":0,"t":1402198400244,"l":50,"m":"ln"}

#####Advanced
#####Code:
    var appender = {
      "level": "info"                  //you just need to specify the "level" attributes for your custom appender
    };

    var log = new ln("c", [appender]); //create it first then add your event listener

    appender.emitter.on("log", function(appender, timestamp, jsonString) {
      //please refer to the switch case statement
      //inside function ln(name, appenders) from ./lib/ln.js
      //as an example to write your custom code
    });
    
####3. How fast and small?
#####Testing environment
* Mac mini (Mid 2011)
* 2.3GHz i5
* 8GB RAM
* 128GB SSD
* OS X 10.9.3
* Node.js 0.10.28
 
#####Testing result
`run.sh 100000`|ln|bunyan (0.23.1)|log4js (0.6.14)
--:|:--:|:--:|:--:
real|**4.77s**|13.28s|15.28s
user|**4.47s**|12.19s|14.05s
sys|**0.42s**|2.77s|2.78s
maximum resident set size|**72M**|79M|85M

####4. How I can verify your test?
#####Testing code
* run `npm install log4js bunyan` in the main directory
* run `cd benchmark`
* run `run.sh <# of calling log.info>`

####5. What `n`, `h`, `p`, `v`, `t`, `l`, `m` and `j` in the json message are?
* `n`: name of the logger
* `h`: hostname
* `p`: process id
* `v`: version of the format
* `t`: timestamp in utc
* `l`: level
* `m`: message
* `j`: json

####6. Why not using readable name?
* This can make the write process and the file size slightly faster and smaller respectively.

####7. Existing logging libraries have rotation problem with cluster module. Why ln don't have this issue?
* Both bunyan and log4js rename the log file on ratation. The dissater happens on file renaming under cluster environment because of double files renaming.
* bunyan suggests using the process id as a part of the filename to tackle this issue. However, this will generate too many files.
* log4js provides a multiprocess appender and lets master to do the logging. However, this must have the bottleneck issue.
* To solve this, I just use `fs.createWriteStream(name, {"flags": "a"})` to create formatted log file at the beginning instead of `fs.rename` at the end. I tested this apporoach with millisecond rotation under cluster environment and no dissaters occured.

####8. Does ln have limitations on file rotation?
* File size rotation does not support because keeping track of the file size before writing to the file is overhead and complicated.
* Logging message is out of order under cluster environment. If you just focus on the logging message from one process, it is in order.

####9. What things are missed?
* Decycle the json
* Let me know what you want to have?