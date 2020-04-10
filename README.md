# pdf2canvas

[![NPM version](https://img.shields.io/npm/v/pdf2canvas.svg)](https://www.npmjs.com/package/pdf2canvas)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](/LICENSE)

Convert a pdf to image dataURL / file

## Installation

```sh
$ npm install pdf2canvas
```

## Initialize

### Example

```js
const Pdf2Canvas = require('pdf2canvas');

const pdfCanvas = new Pdf2Canvas('./test.pdf');
```

## API

### .downloadPNG (options)

- Convert a pdf to PNG file(s) asynchronously
- `options`: {Object}
  - `pageRange`: {Array{number}}
    - the start page number and the last page number
    - default to `[1, Infinity]`
  - `outputDir`: {string}
    - the specified directory to save image files
    - default to `./`
  - `viewportScale`: {number} | {Function}
    - the viewport scale
    - in case of a function is specified, the original width & height will be passed in as its arguments
    - default to `1.5`
  - `config`: {Object}
    - PNG encode config
    - `compressionLevel`: ZLIB compression level (between 0 and 9), default to 6
    - `filters`: the compression filter(s), default to `PNG-ALL-FILTERS`
    - `palette`: the palette (indexed PNGs only), default to undefined
    - `backgroundIndex`: the background palette index (indexed PNGs only), default to 0
    - `resolution`: the resolution in pixels per meter (ppi), default to undefined
- Returns: {Promise} containing the saved file paths {Array{string}}

```js
const result = await pdfCanvas.downloadPNG({
  outputDir: './images',
  pageRange: [1, 2],
  viewportScale: (width, height) => {
    return width > height ? 2200 / width : 1600 / width;
  },
});
// => ["images/page-1.png", "images/page-2.png"]
```

### .downloadJPEG (options)

- Convert a pdf to JPEG file(s) asynchronously
- `options`: {Object}
  - `pageRange`: {Array{number}}
    - the start page number and the last page number
    - default to `[1, Infinity]`
  - `outputDir`: {string}
    - the specified directory to save image files
    - default to `./`
  - `viewportScale`: {number} | {Function}
    - the viewport scale
    - in case of a function is specified, the original width & height will be passed in as its arguments
    - default to `1.5`
  - `config`: {Object}
    - JPEG encode config
    - `quality`: the quality (0 to 1), default to 0.8
    - `progressive`: if progressive compression should be used, default to false
    - `chromaSubsampling`: if chroma subsampling should be used, default to true
- Returns: {Promise} containing the saved file paths {Array{string}}

```js
const result = await pdfCanvas.downloadJPEG({
  outputDir: './images',
  pageRange: 1,
  viewportScale: 2,
  config: { quality: 0.9 },
});
// => ["images/page-1.jpg", "images/page-2.jpg"]
```

### .toDataURL (options)

- Convert a pdf to PNG / JPEG dataURL asynchronously
- `options`: {Object}
  - `pageRange`: {Array{number}}
    - the start page number and the last page number
    - default to `[1, Infinity]`
  - `viewportScale`: {number} | {Function}
    - the viewport scale
    - in case of a function is specified, the original width & height will be passed in as its arguments
    - default to `1.5`
  - `isPNG`: {boolean}
    - PNG or JPEG
    - default to true
  - `quality`: {number}, optional
    - the quality (0 to 1)
    - default to 0.8
- Returns: {Promise} containing dataURLs {Array{string}}

```js
const result = await pdfCanvas.toDataURL({
  pageRange: [1, 3],
  viewportScale: 1.2,
  isPNG: false,
  quality: 0.9,
});
// => ["data:image/jpeg;base64,...", ...]
```

### [MIT Licensed](LICENSE)
