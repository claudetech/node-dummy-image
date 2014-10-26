var request = require('request');
var fs      = require('fs-extra');
var path    = require('path');
var async   = require('async');
var tar     = require('tar');
var unzip   = require('unzip');
var zlib    = require('zlib');

var BASE_URL = 'https://github.com/claudetech/cropper/releases/download/v0.1.0/';
var BINARY_NAME = 'cropper';

var BIN_DIR = path.join(path.dirname(__dirname), 'bin');
var TMP_DIR = path.join(BIN_DIR, 'tmp');

var architectureMaping = {
  arm: 'arm',
  x64: 'amd64',
  ia32: '386',
};

var platformMapping = {
  darwin: 'darwin',
  freebsd: 'freebsd',
  linux: 'linux',
  sunos: 'solaris',
  win32: 'windows',
};

var headers = {
  "accept-charset" : "ISO-8859-1,utf-8;q=0.7,*;q=0.3",
  "accept-language" : "en-US,en;q=0.8",
  "accept" : "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "user-agent" : "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/537.13+ (KHTML, like Gecko) Version/5.1.7 Safari/534.57.2",
  "accept-encoding" : "gzip,deflate",
};

function isLinux() {
  return process.platform === 'linux';
}

function getName(cb) {
  var arch = architectureMaping[process.arch];
  var platform = platformMapping[process.platform];
  var extension = isLinux() ? 'tar' : 'zip';
  // if not supported
  if (!arch || !platform) {
    return cb(new Error("platform not supported"));
  }
  cb(null, BINARY_NAME + '_' + platform + '_' + arch + '.' + extension);
}

function makeDir(cb) {
  fs.mkdir(BIN_DIR, cb);
}

function makeTmpDir(cb) {
  fs.mkdir(TMP_DIR, cb);
}

function download(name, cb) {
  var url = BASE_URL + name;
  if (isLinux()) url += '.gz';
  var outputName = path.join(TMP_DIR, name);
  var out = fs.createWriteStream(outputName);
  out.on('error', cb);
  request.get({url: url, headers: headers})
         .on('response', function (res) {
            if (res.statusCode !== 200) cb(new Error("could not download file"));
            var pipe = res;
            if (isLinux()) {
              pipe = pipe.pipe(zlib.createGunzip());
              pipe = pipe.pipe(tar.Extract({path: TMP_DIR}));
            } else {
              pipe = pipe.pipe(unzip.Extract({path: TMP_DIR}));
            }
            pipe.on('close', function () {
              cb(null, outputName);
            });
         });
}

function move(outputName, cb) {
  var extension = isLinux() ? '.tar' : '.zip';
  var file = path.join(TMP_DIR, path.basename(outputName, extension), 'cropper');
  fs.rename(file, path.join(BIN_DIR, 'cropper'), cb);
}

function purge(cb) {
  fs.remove(BIN_DIR, cb);
}

function clean(cb) {
  fs.remove(TMP_DIR, cb);
}

function fixPermission(cb) {
  fs.chmod(path.join(BIN_DIR, 'cropper'), '755', cb);
}

function run() {
  async.waterfall([
    purge,
    makeDir,
    makeTmpDir,
    getName,
    download,
    move,
    clean,
    fixPermission,
  ], function (err) {
    if (err) {
      console.warn('failed to download executable. this will not work properly' + err);
    }
  });
}

run();
