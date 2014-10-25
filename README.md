# node-dummy-image

This package generates dummy images of any size. Useful to use as placeholders.

## Usage

```
var dummyImage = require('dummy-image');
dummyImage({
  height: 128,
  width: 128,
  type: 'random',
  outputDir: 'images'
}, function (err, imagePath) {
  // check for err and usage imagePath
});
```

`dummyImage` returns the expected path straight away to
make synchronous use (in templates for example) easier.

The available types are

* `user`
* `sea`
* `mountain`
* `food`

and `random` will randomly chooose between those.

Images are mainly taken from [https://unsplash.com/](https://unsplash.com/) and
the quality and size are reduced to avoid increasing the module size.
