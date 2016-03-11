/* eslint-disable no-console, no-magic-numbers */

"use strict";

module.exports = function() {
  return function(timestamp, string) {
    console.log(string.slice(0, -1));
  };
};
