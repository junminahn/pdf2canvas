'use strict';

const fs = require('fs');
const path = require('path');
const PDFJSLib = require('pdfjs-dist');
const { createCanvas } = require('canvas');
const NodeCanvasFactory = require('./NodeCanvasFactory');

const isArray = Array.isArray;
const isBuffer = Buffer.isBuffer;

const isNumber = (value) => typeof value === 'number';
const isFunction = (value) => typeof value === 'function';

const defaultPageRange = [1, Infinity];
const defaultJpegQuality = 0.8;

class Pdf2Canvas {
  constructor(pdfPathOrBuffer, { viewportScale } = {}) {
    if (isBuffer(pdfPathOrBuffer)) {
      this.pdfPath = null;
      this.pdfBuffer = pdfPathOrBuffer;
    } else {
      this.pdfPath = pdfPathOrBuffer;
      this.pdfBuffer = fs.readFileSync(pdfPathOrBuffer);
    }

    this.rowData = new Uint8Array(this.pdfBuffer);
    this.viewportScale = viewportScale;
  }

  async toDataURL({ pageRange, viewportScale, isPNG, quality } = {}) {
    return this.convert({ isDataURL: true, pageRange, viewportScale, isPNG, config: quality });
  }

  async download({ pageRange, outputDir, viewportScale, isPNG, config } = {}) {
    return this.convert({ isDataURL: false, pageRange, outputDir, viewportScale, isPNG, config });
  }

  async downloadPNG({ pageRange, outputDir, viewportScale, config } = {}) {
    return this.convert({ isDataURL: false, pageRange, outputDir, viewportScale, isPNG: true, config });
  }

  async downloadJPEG({ pageRange, outputDir, viewportScale, config } = {}) {
    return this.convert({ isDataURL: false, pageRange, outputDir, viewportScale, isPNG: false, config });
  }

  async convert({
    pageRange = defaultPageRange,
    viewportScale = this.viewportScale || 1.5,
    outputDir = './',
    isPNG = true,
    isDataURL = false,
    config,
  } = {}) {
    if (isArray(pageRange)) {
      pageRange.sort();
      if (pageRange[0] < 1) pageRange = defaultPageRange;
    } else if (isNumber(pageRange) && pageRange > 0) {
      pageRange = [pageRange, pageRange];
    } else {
      pageRange = defaultPageRange;
    }

    try {
      const doc = await PDFJSLib.getDocument({
        data: this.rowData,
        nativeImageDecoderSupport: PDFJSLib.NativeImageDecoding.DISPLAY,
      }).promise;

      const numPages = doc.numPages;
      const minPage = pageRange[0];
      const maxPage = pageRange[1] > numPages ? numPages : pageRange[1];

      const results = [];

      for (let x = minPage; x <= maxPage; x++) {
        const page = await doc.getPage(x);

        let viewport;
        if (isNumber(viewportScale)) {
          viewport = page.getViewport({ scale: viewportScale });
        } else if (isFunction(viewportScale)) {
          viewport = page.getViewport({ scale: 1 });
          const scale = viewportScale(viewport.width, viewport.height);
          viewport = page.getViewport({ scale });
        }

        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext('2d');
        const canvasFactory = new NodeCanvasFactory();

        const renderContext = {
          canvasContext: context,
          viewport,
          canvasFactory,
        };

        await page.render(renderContext).promise;

        if (isDataURL) {
          const dataURL = canvas.toDataURL(isPNG ? 'image/png' : 'image/jpeg', config || defaultJpegQuality);
          results.push(dataURL);
        } else {
          const { stream, ext } = isPNG ? this.createPNGStream(canvas, config) : this.createJPEGStream(canvas, config);

          const filePath = path.join(outputDir, `page-${x}.${ext}`);
          await this.writeStreamToFile(stream, filePath);
          results.push(filePath);
        }
      }

      return results;
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  }

  createPNGStream(
    canvas,
    {
      compressionLevel = 6,
      filters = canvas.PNG_ALL_FILTERS,
      palette = undefined,
      backgroundIndex = 0,
      resolution = undefined,
    } = {}
  ) {
    const stream = canvas.createPNGStream({
      compressionLevel,
      filters,
      palette,
      backgroundIndex,
      resolution,
    });

    return { stream, ext: 'png' };
  }

  createJPEGStream(canvas, { quality = defaultJpegQuality, progressive = false, chromaSubsampling = true } = {}) {
    const stream = canvas.createJPEGStream({
      quality,
      progressive,
      chromaSubsampling,
    });

    return { stream, ext: 'jpg' };
  }

  writeStreamToFile(readableStream, filePath) {
    let writableStream = fs.createWriteStream(filePath);

    readableStream.pipe(writableStream);

    return new Promise(function (resolve, reject) {
      readableStream.once('error', reject);
      writableStream.once('error', reject);
      writableStream.once('finish', resolve);
    }).catch(function (err) {
      readableStream = null; // Explicitly null because of v8 bug 6512.
      writableStream.end();
      throw err;
    });
  }
}

module.exports = Pdf2Canvas;
