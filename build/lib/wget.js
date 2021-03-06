"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var _http = require("http");

var _http2 = _interopRequireDefault(_http);

var _https = require("https");

var _https2 = _interopRequireDefault(_https);

var _url = require("url");

var _url2 = _interopRequireDefault(_url);

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

/**
 * Downloads a file using http get and request
 * @param {string} source - The http URL to download from
 * @param {object} options - Options object
 * @param {array} statusCodes - history of status codes for redirects
 * @returns {Promise}
 */
var download = function download(source) {
  var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  var verbose = _ref.verbose;
  var output = _ref.output;
  var onStart = _ref.onStart;
  var onProgress = _ref.onProgress;
  var _ref$followRedirects = _ref.followRedirects;
  var followRedirects = _ref$followRedirects === undefined ? true : _ref$followRedirects;
  var code = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

  return new Promise(function (y, n) {
    if (typeof output === "undefined") {
      output = _path2["default"].basename(_url2["default"].parse(source).pathname) || "unknown";
    }

    // Parse the source url into parts
    var sourceUrl = _url2["default"].parse(source);

    // Determine to use https or http request depends on source url
    var request = null;
    if (sourceUrl.protocol === "https:") {
      request = _https2["default"].request;
    } else if (sourceUrl.protocol === "http:") {
      request = _http2["default"].request;
    } else {
      throw new Error("protocol should be http or https");
    }

    // Issue the request
    var req = request({
      method: "GET",
      protocol: sourceUrl.protocol,
      host: sourceUrl.hostname,
      port: sourceUrl.port,
      path: sourceUrl.pathname + (sourceUrl.search || "")
    }, function (res) {
      var statusCodes = code ? code : [];
      statusCodes.push(res.statusCode);

      // Once the request got responsed
      if (res.statusCode === 200) {
        var writeStream;

        (function () {
          var fileSize = Number.isInteger(res.headers["content-length"] - 0) ? parseInt(res.headers["content-length"]) : 0;
          var downloadedSize = 0;

          // Create write stream
          writeStream = _fs2["default"].createWriteStream(output, {
            flags: "w+",
            encoding: "binary"
          });

          res.pipe(writeStream);

          // onStartCallback
          if (onStart) {
            onStart(res.headers);
          }

          // Data handlers
          res.on("data", function (chunk) {
            downloadedSize += chunk.length;
            if (onProgress) {
              onProgress({
                fileSize: fileSize,
                downloadedSize: downloadedSize,
                percentage: fileSize > 0 ? downloadedSize / fileSize : 0
              });
            }
          });

          res.on("error", function (err) {
            writeStream.end();
            n(err);
          });

          writeStream.on("finish", function () {
            writeStream.end();
            req.end("finished");
            y({ headers: res.headers, fileSize: fileSize, statusCodes: statusCodes });
          });
        })();
      } else if (followRedirects && (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307)) {
        var redirectLocation = res.headers.location;

        if (verbose) {
          console.log("node-wget-promise: Redirected to:", redirectLocation);
        }
        // Call download function recursively
        download(redirectLocation, {
          output: output,
          onStart: onStart,
          onProgress: onProgress
        }, statusCodes).then(y)["catch"](n);
      } else if (!followRedirects && (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307)) {
        y({ headers: res.headers, fileSize: 0, statusCodes: statusCodes });
      } else {
        n("Server responded with unhandled status: " + res.statusCode);
      }
    });

    req.end("done");
    req.on("error", function (err) {
      return n(err);
    });
  });
};
exports.download = download;