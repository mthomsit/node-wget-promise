import { expect } from "chai";
import fs from "fs";
import wget from "./index";

describe("Integration tests", function() {
  this.timeout(15 * 1000);

  it("should download the file with HTTP protocol", function(done) {
    const Bytes = 1024;
    const fileName = "logo.svg";
    wget("http://www.president.gov.tw/images/logo.svg", {
      onStart: headers => {
        expect(headers["content-type"]).to.be.contains("image/svg+xml");
      },
      onProgress: progress => {
        console.log("downloaded", progress, "%");
      },
      output: fileName
    })
      .then(result => {
        expect(result.headers["content-type"]).to.be.contains("image/svg+xml");
        expect(result.fileSize).to.be.a("number");
        expect(result.fileSize).to.be.above(0 * Bytes);
        expect(result.fileSize).to.be.below(100 * Bytes);
        // Check if file existed
        expect(fs.existsSync(fileName)).to.be.true;
        // Delete download file
        fs.unlinkSync(fileName);
        done();
      })
      .catch(err => {
        console.log(err);
        expect(err).to.be.null;
      });
  });

  it("should download the file with HTTPS protocol", function(done) {
    const Bytes = 1024;
    const fileName = "__nodejs-logo.png";
    wget(
      "https://raw.githubusercontent.com/ajhsu/node-wget-promise/master/assets/nodejs-logo.png",
      {
        onStart: headers => {
          expect(headers["content-type"]).to.be.contains("image/png");
        },
        onProgress: progress => {
          console.log("downloaded", progress, "%");
        },
        output: fileName
      }
    )
      .then(result => {
        expect(result.headers["content-type"]).to.be.contains("image/png");
        expect(result.fileSize).to.be.a("number");
        expect(result.fileSize).to.be.above(0 * Bytes);
        expect(result.fileSize).to.be.below(50 * Bytes);
        // Check if file existed
        expect(fs.existsSync(fileName)).to.be.true;
        // Delete download file
        fs.unlinkSync(fileName);
        done();
      })
      .catch(err => {
        console.log(err);
        expect(err).to.be.null;
      });
  });

  it("should download file even options is not given", function(done) {
    const fileName = "nodejs-logo.png";
    wget(
      "https://raw.githubusercontent.com/ajhsu/node-wget-promise/master/assets/nodejs-logo.png"
    )
      .then(result => {
        // Check if file existed
        expect(fs.existsSync(fileName)).to.be.true;
        // Delete download file
        fs.unlinkSync(fileName);
        done();
      })
      .catch(err => {
        console.log(err);
        expect(err).to.be.null;
      });
  });

  it("should download with unknown file name", function(done) {
    const fileName = "unknown";
    wget("https://www.apple.com/")
      .then(result => {
        // Check if file existed
        expect(fs.existsSync(fileName)).to.be.true;
        // Delete download file
        fs.unlinkSync(fileName);
        done();
      })
      .catch(err => {
        console.log(err);
        expect(err).to.be.null;
      });
  });

  it("should download file via 301 redirection", function(done) {
    const Bytes = 1024;
    const fileName = "index.html";
    wget("http://www.kimo.com/index.html", {
      onStart: headers => {
        expect(headers["content-type"]).to.be.contains("text/html");
      },
      onProgress: progress => {
        console.log("downloaded", progress, "%");
      },
      output: fileName
    })
      .then(result => {
        expect(result.headers["content-type"]).to.be.contains("text/html");
        expect(result.fileSize).to.be.a("number");
        expect(result.fileSize).to.be.above(0 * Bytes);
        expect(result.fileSize).to.be.below(1024 * Bytes);
        // Check if file existed
        expect(fs.existsSync(fileName)).to.be.true;
        // Delete download file
        fs.unlinkSync(fileName);
        done();
      })
      .catch(err => {
        console.log(err);
        expect(err).to.be.null;
      });
  });

  it("should retain status codes for redirects", function(done) {
    const Bytes = 1024;
    const fileName = "index.html";
    wget("http://www.kimo.com/index.html", {
      onStart: headers => {
        expect(headers["content-type"]).to.be.contains("text/html");
      },
      onProgress: progress => {},
      output: fileName
    })
      .then(result => {
        expect(result.statusCodes).to.exist;
        expect(result.statusCodes.length).to.equal(5);
        expect(result.statusCodes[0]).to.equal(301);
        expect(result.statusCodes[4]).to.equal(200);

        // Delete download file
        fs.unlinkSync(fileName);
        done();
      })
      .catch(err => {
        console.log(err);
        expect(err).to.be.null;
      });
  });

  it("should ignore redirects if followRedirects is false", function(done) {
    const Bytes = 1024;
    const fileName = "index.html";
    wget("http://www.kimo.com/index.html", {
      onStart: headers => {
        expect(headers["content-type"]).to.be.contains("text/html");
      },
      onProgress: progress => {},
      output: fileName,
      followRedirects: false
    })
      .then(result => {
        expect(result.statusCodes).to.exist;
        expect(result.statusCodes.length).to.equal(1);
        expect(result.statusCodes[0]).to.equal(301);
        expect(result.fileSize).to.equal(0);

        done();
      })
      .catch(err => {
        console.log(err);
        expect(err).to.be.null;
      });
  });
});
