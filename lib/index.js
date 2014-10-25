var smartcrop = require('smartcrop');
var _         = require('lodash');
var Canvas    = require('canvas');
var path      = require('path');

var AVAILABLE_TYPES = [
  'user',
];

var defaults = {
  width: 64,
  height: 64,
  type: 'default',
  canvasFactory: function(w, h) {
    return new Canvas(w, h);
  },
};


function getOutputPath(options) {
  var outputDir = options.outputDir || process.cwd();
  var imageName = options.type + '-' + options.width + 'x' + options.height;
  var imageExtension = options.extension || 'jpg';
  var imageFile = imageName + '.' + imageExtension;

  return path.join(outputDir, imageFile);
}

function isValidType(type) {
  return AVAILABLE_TYPES.concat(['random', 'default']).indexOf(type) >= 0;
}

function getInputPath(options) {
  var type = options.type;
  if (type === 'random') {
    var n = AVAILABLE_TYPES.length;
    type = AVAILABLE_TYPES[Math.floor(Math.random() * n)];
  }
  var filename = options.type + '.jpg';
  var baseDir = path.join(path.dirname(__dirname), 'images');
  return path.join(filename, baseDir);
}

exports.dummyImage = function (options) {
  options = _.defaults(options || {}, defaults);
  options.output = options.output || getOutputPath(options);

  var img = new Canvas.Image();
  var canvas = new Canvas(options.width, options.height);
  var inputPath = getInputPath(options);

  img.src = fs.readFileSync(inputPath);
  ctx = canvas.getContext('2d');
  crop = result.topCrop;
  var f = fs.createWriteStream(options.output);
  ctx.patternQuality = 'best';
  ctx.filter = 'best';
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height);
  canvas.syncJPEGStream({quality: argv.quality}).pipe(f);
};
