(function initializeCrmDocumentImagePreprocessor(global) {
  "use strict";

  let pdfJsPromise = null;

  async function convertPdfToPageImages(fileOrArrayBuffer, options = {}) {
    const pdfjsLib = await getPdfJs();
    const arrayBuffer = fileOrArrayBuffer instanceof ArrayBuffer
      ? fileOrArrayBuffer
      : await fileOrArrayBuffer.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
      workerSrc: resolveExtensionUrl("vendor/pdfjs/pdf.worker.min.mjs"),
      standardFontDataUrl: resolveExtensionUrl("vendor/pdfjs/standard_fonts/")
    });
    const pdf = await loadingTask.promise;
    const maxPages = Math.min(pdf.numPages || 0, Number(options.maxPages) || 8);
    const pages = [];
    const warnings = [];

    for (let pageNo = 1; pageNo <= maxPages; pageNo += 1) {
      const page = await pdf.getPage(pageNo);
      const pageImage = await renderPdfPageToImage(page, {
        ...options,
        pageNo
      });
      pages.push(pageImage);
      page.cleanup?.();
      notifyProgress(options, "rendering pdf page image", pageNo / Math.max(maxPages, 1));
    }

    if ((pdf.numPages || 0) > maxPages) {
      warnings.push(`PDF image conversion limited to first ${maxPages} pages of ${pdf.numPages}.`);
    }

    await pdf.destroy?.();
    return { pages, warnings };
  }

  async function getPdfJs() {
    if (pdfJsPromise) {
      return pdfJsPromise;
    }

    pdfJsPromise = import(resolveExtensionUrl("vendor/pdfjs/pdf.min.mjs")).then((pdfjsLib) => {
      pdfjsLib.GlobalWorkerOptions.workerSrc = resolveExtensionUrl("vendor/pdfjs/pdf.worker.min.mjs");
      return pdfjsLib;
    }).catch((error) => {
      pdfJsPromise = null;
      throw error;
    });

    return pdfJsPromise;
  }

  async function renderPdfPageToImage(page, options = {}) {
    const scale = Number(options.scale || options.pdfScale) || 2;
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d", { willReadFrequently: true });

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    const image = convertPdfPageCanvasToImage(canvas, {
      ...options,
      type: "image/png"
    });
    const imageBlob = await canvasToBlob(canvas);
    const imageDataUrl = image.dataUrl || await blobToDataUrl(imageBlob);

    return {
      pageNo: options.pageNo || null,
      width: image.width || canvas.width || 0,
      height: image.height || canvas.height || 0,
      imageDataUrl,
      dataUrl: imageDataUrl,
      imageBlob
    };
  }

  function convertPdfPageCanvasToImage(canvas, options = {}) {
    if (!canvas) {
      return null;
    }

    const type = options.type || "image/png";
    const quality = Number.isFinite(options.quality) ? options.quality : 0.92;
    return {
      dataUrl: typeof canvas.toDataURL === "function" ? canvas.toDataURL(type, quality) : "",
      width: canvas.width || 0,
      height: canvas.height || 0,
      type
    };
  }

  function cropMargins(imageLike, options = {}) {
    return {
      ...normalizeImageLike(imageLike),
      transform: "crop_margins_placeholder",
      cropRatio: Number.isFinite(options.cropRatio) ? options.cropRatio : 0
    };
  }

  function deskewImagePlaceholder(imageLike) {
    return {
      ...normalizeImageLike(imageLike),
      transform: "deskew_placeholder"
    };
  }

  function increaseContrastPlaceholder(imageLike, options = {}) {
    return {
      ...normalizeImageLike(imageLike),
      transform: "contrast_placeholder",
      contrast: Number.isFinite(options.contrast) ? options.contrast : 1
    };
  }

  function splitPageImageIntoRegions(imageLike) {
    const image = normalizeImageLike(imageLike);
    return [
      createRegion("header", image, 0, 0, 1, 0.18),
      createRegion("main_table", image, 0, 0.16, 1, 0.58),
      createRegion("notes_terms", image, 0, 0.70, 1, 0.18),
      createRegion("footer_signature", image, 0, 0.86, 1, 0.14)
    ];
  }

  function preprocessPageCanvas(canvas, options = {}) {
    const pageImage = convertPdfPageCanvasToImage(canvas, options);
    if (!pageImage) {
      return {
        pageImage: null,
        regions: [],
        warnings: [{
          code: "empty_canvas",
          message: "No PDF page canvas was available for preprocessing."
        }]
      };
    }

    const contrastImage = increaseContrastPlaceholder(deskewImagePlaceholder(cropMargins(pageImage, options)), options);
    return {
      pageImage: contrastImage,
      regions: splitPageImageIntoRegions(contrastImage),
      warnings: []
    };
  }

  function createRegion(name, image, x, y, width, height) {
    return {
      name,
      image: image.dataUrl || image.url || "",
      pageNo: image.pageNo || null,
      box: { x, y, width, height }
    };
  }

  function normalizeImageLike(imageLike) {
    if (!imageLike) {
      return {};
    }
    if (typeof imageLike === "string") {
      return { dataUrl: imageLike };
    }
    return { ...imageLike };
  }

  function createCanvas(width, height) {
    if (global.OffscreenCanvas) {
      return new global.OffscreenCanvas(width, height);
    }

    const canvas = global.document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  function canvasToBlob(canvas) {
    if (canvas.convertToBlob) {
      return canvas.convertToBlob({ type: "image/png" });
    }

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Could not convert PDF page canvas to image."));
        }
      }, "image/png");
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Could not read PDF page image."));
      reader.readAsDataURL(blob);
    });
  }

  function resolveExtensionUrl(path) {
    if (global.chrome?.runtime?.getURL) {
      return global.chrome.runtime.getURL(path);
    }
    return path;
  }

  function notifyProgress(options, status, progress) {
    if (typeof options.onProgress === "function") {
      options.onProgress({ status, progress });
    }
  }

  global.CrmDocumentImagePreprocessor = Object.freeze({
    convertPdfToPageImages,
    renderPdfPageToImage,
    convertPdfPageCanvasToImage,
    cropMargins,
    deskewImagePlaceholder,
    increaseContrastPlaceholder,
    splitPageImageIntoRegions,
    preprocessPageCanvas
  });
})(typeof window !== "undefined" ? window : globalThis);
