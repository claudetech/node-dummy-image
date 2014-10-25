var smartcrop = require('smartcrop');
var _         = require('lodash');
var Canvas    = require('canvas');
var path      = require('path');
var fs        = require('fs');
var async     = require('async');

var defaults = {
  width: 64,
  height: 64,
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

function createImage(options, cb) {
  var img = new Canvas.Image();
  var inputPath = getInputPath(options);
  fs.readFile(inputPath, function (err, data) {
    img.src = data;
    cb(err, options, img);
  });
}

function createCanvas(options, image, cb) {
  smartcrop.crop(image, options, function useCrop(result) {
    var canvas = new Canvas(options.width, options.height);
    ctx = canvas.getContext('2d');
    crop = result.topCrop;
    ctx.patternQuality = 'best';
    ctx.filter = 'best';
    ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height,
      0, 0, canvas.width, canvas.height);
    cb(null, options, canvas);
  });
}


function getOutputPath(options) {
  var imageName = options.type + '-' + options.width + 'x' + options.height;
  var imageExtension = options.extension || 'jpg';
  var imageFile = imageName + '.' + imageExtension;
  return path.join(options.outputDir, imageFile);
}

function createFile(options, canvas, cb) {
  var file = fs.createWriteStream(options.outputFile);
  file.on('error', function (err) {
    cb(err);
  });
  file.on('open', function () {
    // Async version not available yet
    canvas.syncJPEGStream({quality: options.quality}).pipe(file);
    cb(null, canvas);
  });
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

module.exports = function (options, cb) {
  options = _.defaults(options || {}, defaults);

  try {
    options.availableTypes = getAvailableTypes(options);
  } catch (err) {
    if (cb) cb(err);
    return "";
  }

  fixType(options);
  options.outputFile = getOutputPath(options);

  var checkFileWrapper = function (cb) { checkFile(options, cb); };

  async.waterfall([
    checkFileWrapper,
    createImage,
    createCanvas,
    createFile
  ], function (err, canvas) {
    if (cb) cb(err, options.outputFile, canvas);
  });

  return options.outputFile;
};
