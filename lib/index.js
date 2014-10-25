var _         = require('lodash');
var path      = require('path');
var fs        = require('fs');
var spawn     = require('child_process').spawn;

var CROP_BIN = path.join(path.dirname(__dirname), 'bin', 'cropper');

var defaults = {
  width: 128,
  height: 128,
  type: 'user',
  quality: 90,
  outputDir: process.cwd(),
  canvasFactory: function(w, h) {
    return new Canvas(w, h);
  },
};

function isValidType(options) {
  return options.availableTypes.concat(['random']).indexOf(options.type) >= 0;
}

function getBasedir() {
  return path.join(path.dirname(__dirname), 'images');
}

function getInputPath(options) {
  var filename = options.type + '.jpg';
  return path.join(getBasedir(), filename);
}

function getOutputPath(options) {
  var imageName = options.type + '-' + options.width + 'x' + options.height;
  var imageExtension = options.extension || 'jpg';
  var imageFile = imageName + '.' + imageExtension;
  return path.join(options.outputDir, imageFile);
}

function checkFile(options, cb) {
  fs.exists(options.outputFile, function (exists) {
    if (exists && !options.force) {
      cb(new Error("outputFile already exists"));
    } else {
      cb(null, options);
    }
  });
}

function fixType(options) {
  if (!isValidType(options)) {
    options.type = 'user';
  }
  if (options.type === 'random') {
    var n = options.availableTypes.length;
    options.type = options.availableTypes[Math.floor(Math.random() * n)];
  }
}

function getAvailableTypes(options) {
  var images = fs.readdirSync(getBasedir());
  return _.map(images, function (image) {
    return path.basename(image, ".jpg");
  });
}

function crop(options, cb) {
  var args = [
    '--input', getInputPath(options),
    '--output', options.outputFile,
    '--width', options.width,
    '--height', options.height,
  ];
  var cropper = spawn(CROP_BIN, args);
  cropper.on('close', function (code) {
    if (code === 0) cb(null, options.outputFile);
    else cb(new Error("could not crop"));
  });
}

module.exports = function (options, cb) {
  options = _.defaults(options || {}, defaults);
  cb = cb || function() {};

  try {
    options.availableTypes = getAvailableTypes(options);
  } catch (err) {
    if (cb) cb(err);
    return "";
  }

  fixType(options);
  options.outputFile = getOutputPath(options);

  checkFile(options, function (err) {
    if (err) return cb(null, options.outputFile);
    crop(options, cb);
  });

  return options.outputFile;
};
