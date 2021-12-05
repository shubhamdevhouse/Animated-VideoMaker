const config = require('./config.js')

const http = require('http');
const https = require('https');
const fs = require('fs')
const getDimensions = require('get-video-dimensions');
const url = require("url");
const Path = require('path');
const Stream = require('stream').Transform
 class Utils {
  static block = { title: "", subtitle: "", type: "", url: "", width: 0, height: 0 }
  static tgmStruct =
    {
      currentGM: 0.0, i: 0, tgmPre: 0.0,
      tgmValuePre: 0.0,
      isRun: false,
      tgm: 0.0,
      tgmValue: 0.0,
      _tgm: 0.0,
      _tgmValue: 0.0,

    };

  static getVideoSize = async function (file) {
    const dimensions = await getDimensions(file);
    return dimensions;

  }
  static generateRandomID = function () {
    // Math.random should be unique because of its seeding algorithm.
    // Convert it to base 36 (numbers + letters), and grab the first 9 characters
    // after the decimal.
    return '_' + Math.random().toString(36).substr(2, 9);
  };
  static generateUuid = function () {
    return Math.random().toString() +
      Math.random().toString() +
      Math.random().toString();
  }

  static runProcessWithProgress = function (argv, callback) {
    return new Promise((resolve, reject) => {
      var spawn = require('child_process').spawn
      var prc = spawn(config.ffmpeg_path, argv);



      prc.on('error', function () {
        console.log("Failed to start child.");
      });
      var data = "";
      prc.stdout.setEncoding('utf8');
      prc.stdout.on('data', function (datae) {
        var str = datae.toString()
        var lines = str.split(/(\r?\n)/g)
        data += lines.join("");

      });
      prc.stderr.on('data', function (datae) {

        var lines = datae.toString(); data += lines;
        callback(lines, data);

      });

      prc.stdout.on('end', function () {

        resolve(data)
      });
      prc.on('exit', function () {

      })
      prc.on('close', function (code) {
        reject(code);

      });

    })
  }

  static runProcess = function (name, argv) {

    return new Promise((resolve, reject) => {
      var spawn = require('child_process').spawn
      var prc = ""

      if (name == "ffmpeg") {
        prc = spawn(config.ffmpeg_path, argv);


      } else if (name == "convert") {
        prc = spawn(config.convert_path, argv);
      } else if (name == "magick") {
        prc = spawn(config.magick_path, argv);
      }
      var data = "";
      try {
        prc.stdout.setEncoding('utf8');
      } catch (e) {
        throw (e)

      }
      prc.stdout.on('data', function (datae) {
        var str = datae.toString()
        var lines = str.split(/(\r?\n)/g)
        data += lines.join("");

      });
      prc.stderr.on('data', function (datae) {
        //Here is where the error output goes

        var lines = datae.toString();
        data += lines;

      });

      prc.stdout.on('end', function () {

      });
      prc.on('exit', function () {
        resolve(data)
      })
      prc.on('close', function (code) {
        // resolve(data)
        reject(code)

      });

    })
  }

  static deleteFolderRecursive = function (path) {
    if (fs.existsSync(path)) {
      fs.readdirSync(path).forEach((file, index) => {
        const curPath = Path.join(path, file);
        if (fs.lstatSync(curPath).isDirectory()) { // recurse
          deleteFolderRecursive(curPath);
        } else { // delete file
          fs.unlinkSync(curPath);
        }
      });
      fs.rmdirSync(path);
    }
  };
  static hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function (m, r, g, b) {
      return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
  static async readFile(path) {
    return new Promise((resolve, reject) => {
      fs.readFile(path, 'utf8', function (err, data) {
        if (err) {
          reject(err);
        }
        resolve(data);
      });
    });
  }

  // function returns a Promise
  static getPromise(urlLink, fileName) {
    return new Promise((resolve, reject) => {
      var urlVal = new URL(urlLink);
      var parsed = url.parse(urlLink);
      var client = http;
      client = (urlVal.protocol == "https:") ? https : client;

      const request = client.get(urlLink, function (response) {

        var data = new Stream();

        response.on('data', function (chunk) {
          data.push(chunk);
        });

        response.on('end', function () {
          resolve("success");

          fs.writeFileSync(fileName, data.read());
        });
        response.on('error', (error) => {
          console.log("errorcode")
          reject(error);
        });
      });
    });
  }

  static async makeSynchronousRequest(url, file) {
    try {
      let http_promise = Utils.getPromise(url, file);
      await http_promise;

    }
    catch (error) {
      // Promise rejected
      console.log(error);
    }
  }
  static componentToHex(c) {
    var hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
  }
  static rgbToHex(r, g, b) {
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
  }
  static checkFileExists(file) {
    return fs.promises.access(file, fs.constants.F_OK)
      .then(() => (true))
      .catch(() => (false))
  }
//Get data in between functions from index start & end
static getDataInBetweenInt(text,iFrom,iTo){
  let result = text.substr(iFrom, iTo );
  return result;
}
//Get data in between
static getDataInBetween(text, startText,endText){
  let iFrom = this.getDataStartPoint(text,startText);
  let iTo = this.getDataEndPoint(text,endText);
  let result = this.getDataInBetweenInt(text,iFrom, iTo - iFrom );
  return result;

}
//Get index position
static getDataEndPoint(text,endText,isLast = true,startIndex = 0){
  if(isLast){
    return text.lastIndexOf(endText);
  }else{
    return text.indexOf(endText,startIndex);
  } 
}
//Get index position with length
static getDataStartPoint(text,startText){
  return text.indexOf(startText) + startText.length;
}

  //module.exports = { runProcess,block,deleteFolderRecursive ,runProcessWithProgress,readFile,hexToRgb,rgbToHex,makeSynchronousRequest,getVideoSize,checkFileExists,generateUuid}
}
module.exports=Utils;