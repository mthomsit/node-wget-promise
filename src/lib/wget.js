import http from "http";
import https from "https";
import url from "url";
import path from "path";
import fs from "fs";

/**
 * Downloads a file using http get and request
 * @param {string} source - The http URL to download from
 * @param {object} options - Options object
 * @param {array} statusCodes - history of status codes for redirects
 * @returns {Promise}
 */
export const download = (
  source,
  { verbose, output, onStart, onProgress, followRedirects = true } = {},
  code = null
) => {
  return new Promise((y, n) => {
    if (typeof output === "undefined") {
      output = path.basename(url.parse(source).pathname) || "unknown";
    }

    // Parse the source url into parts
    const sourceUrl = url.parse(source);

    // Determine to use https or http request depends on source url
    let request = null;
    if (sourceUrl.protocol === "https:") {
      request = https.request;
    } else if (sourceUrl.protocol === "http:") {
      request = http.request;
    } else {
      throw new Error("protocol should be http or https");
    }

    // Issue the request
    const req = request(
      {
        method: "GET",
        protocol: sourceUrl.protocol,
        host: sourceUrl.hostname,
        port: sourceUrl.port,
        path: sourceUrl.pathname + (sourceUrl.search || "")
      },
      res => {
        const statusCodes = code ? code : [];
        statusCodes.push(res.statusCode);

        // Once the request got responsed
        if (res.statusCode === 200) {
          const fileSize = Number.isInteger(res.headers["content-length"] - 0)
            ? parseInt(res.headers["content-length"])
            : 0;
          let downloadedSize = 0;

          // Create write stream
          var writeStream = fs.createWriteStream(output, {
            flags: "w+",
            encoding: "binary"
          });

          res.pipe(writeStream);

          // onStartCallback
          if (onStart) {
            onStart(res.headers);
          }

          // Data handlers
          res.on("data", chunk => {
            downloadedSize += chunk.length;
            if (onProgress) {
              onProgress({
                fileSize,
                downloadedSize,
                percentage: fileSize > 0 ? downloadedSize / fileSize : 0
              });
            }
          });

          res.on("error", err => {
            writeStream.end();
            n(err);
          });

          writeStream.on("finish", () => {
            writeStream.end();
            req.end("finished");
            y({ headers: res.headers, fileSize, statusCodes });
          });
        } else if (
          followRedirects &&
          (res.statusCode === 301 ||
            res.statusCode === 302 ||
            res.statusCode === 307)
        ) {
          const redirectLocation = res.headers.location;

          if (verbose) {
            console.log("node-wget-promise: Redirected to:", redirectLocation);
          }
          // Call download function recursively
          download(
            redirectLocation,
            {
              output,
              onStart,
              onProgress
            },
            statusCodes
          )
            .then(y)
            .catch(n);
        } else if (
          !followRedirects &&
          (res.statusCode === 301 ||
            res.statusCode === 302 ||
            res.statusCode === 307)
        ) {
          y({ headers: res.headers, fileSize: 0, statusCodes });
        } else {
          n("Server responded with unhandled status: " + res.statusCode);
        }
      }
    );

    req.end("done");
    req.on("error", err => n(err));
  });
};
