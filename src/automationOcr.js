(function initializeCrmAutomationOcr(global) {
  "use strict";

  const DEFAULT_LANGUAGES = "eng+chi_sim";
  const IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/bmp"]);
  let workerPromise = null;
  let pdfJsPromise = null;

  function isOcrAvailable() {
    return Boolean(global.Tesseract?.createWorker);
  }

  function canOcrFile(file) {
    if (!file) {
      return false;
    }

    const filename = String(file.name || "").toLowerCase();
    return isPdfFile(file)
      || IMAGE_TYPES.has(file.type)
      || filename.endsWith(".png")
      || filename.endsWith(".jpg")
      || filename.endsWith(".jpeg")
      || filename.endsWith(".webp")
      || filename.endsWith(".bmp");
  }

  function getUnsupportedReason(file) {
    if (!file) {
      return "No file is selected.";
    }
    if (isLegacyDocFile(file)) {
      return "Legacy .doc files are not reliably readable in browser JavaScript. Save as .docx or PDF first.";
    }
    return "OCR currently supports PDF or image files. DOCX text is extracted without OCR.";
  }

  async function recognizeFile(file, options = {}) {
    if (!isOcrAvailable()) {
      throw new Error("Tesseract OCR runtime is not loaded.");
    }
    if (!canOcrFile(file)) {
      throw new Error(getUnsupportedReason(file));
    }

    if (isPdfFile(file)) {
      return recognizePdfFile(file, options);
    }

    const image = await prepareImageForOcr(file, options).catch(() => file);
    const worker = await getWorker(options);
    const recognition = await worker.recognize(image);
    const data = recognition?.data || {};

    return {
      text: normalizeOcrText(data.text || ""),
      confidence: Number(data.confidence) || 0,
      language: options.languages || DEFAULT_LANGUAGES,
      sourceName: file.name || "",
      warnings: []
    };
  }

  async function recognizePdfFile(file, options = {}) {
    const pdfjsLib = await getPdfJs();
    const bytes = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({
      data: bytes,
      workerSrc: resolveExtensionUrl("vendor/pdfjs/pdf.worker.min.mjs"),
      standardFontDataUrl: resolveExtensionUrl("vendor/pdfjs/standard_fonts/")
    });
    const pdf = await loadingTask.promise;
    const maxPages = Math.min(pdf.numPages || 0, Number(options.maxPages) || 5);
    const textParts = [];
    const confidences = [];
    const pageImages = [];

    for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
      notifyProgress(options, "rendering pdf page", pageNumber / Math.max(maxPages, 1) * 0.35);
      const page = await pdf.getPage(pageNumber);
      const pageImage = await renderPdfPageToImage(page, {
        ...options,
        pageNo: pageNumber
      });
      const imageBlob = pageImage.blob;
      if (pageImage.dataUrl) {
        pageImages.push({
          dataUrl: pageImage.dataUrl,
          pageNo: pageNumber,
          width: pageImage.width,
          height: pageImage.height,
          regions: pageImage.regions || []
        });
      }
      notifyProgress(options, "ocr pdf page", 0.35 + (pageNumber - 1) / Math.max(maxPages, 1) * 0.65);
      const pageResult = await recognizeImageBlob(imageBlob, {
        ...options,
        sourceName: `${file.name || "PDF"} page ${pageNumber}`
      });
      if (pageResult.text) {
        textParts.push(`--- Page ${pageNumber} ---\n${pageResult.text}`);
      }
      if (Number.isFinite(pageResult.confidence)) {
        confidences.push(pageResult.confidence);
      }
      page.cleanup?.();
    }

    await pdf.destroy?.();

    return {
      text: normalizeOcrText(textParts.join("\n\n")),
      confidence: confidences.length
        ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
        : 0,
      language: options.languages || DEFAULT_LANGUAGES,
      sourceName: file.name || "",
      pageImages,
      warnings: pdf.numPages > maxPages
        ? [`OCR limited to first ${maxPages} pages of ${pdf.numPages}.`]
        : []
    };
  }

  async function recognizeImageBlob(imageBlob, options = {}) {
    const image = await prepareImageForOcr(imageBlob, options).catch(() => imageBlob);
    const worker = await getWorker(options);
    const recognition = await worker.recognize(image);
    const data = recognition?.data || {};

    return {
      text: normalizeOcrText(data.text || ""),
      confidence: Number(data.confidence) || 0,
      language: options.languages || DEFAULT_LANGUAGES,
      sourceName: options.sourceName || "",
      warnings: []
    };
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

  async function renderPdfPageToBlob(page, options = {}) {
    return (await renderPdfPageToImage(page, options)).blob;
  }

  async function renderPdfPageToImage(page, options = {}) {
    const scale = Number(options.pdfScale) || 2;
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d", { willReadFrequently: true });

    await page.render({
      canvasContext: context,
      viewport
    }).promise;

    const blob = await canvasToBlob(canvas);
    const pageImage = await createPageImagePayload(canvas, blob, options);
    return {
      blob,
      ...pageImage
    };
  }

  async function createPageImagePayload(canvas, blob, options = {}) {
    let preprocessed = null;
    if (global.CrmDocumentImagePreprocessor?.preprocessPageCanvas && typeof canvas.toDataURL === "function") {
      preprocessed = global.CrmDocumentImagePreprocessor.preprocessPageCanvas(canvas, {
        ...options,
        type: "image/png"
      });
    }

    const dataUrl = preprocessed?.pageImage?.dataUrl || await blobToDataUrl(blob);
    return {
      dataUrl,
      width: canvas.width || 0,
      height: canvas.height || 0,
      regions: preprocessed?.regions || []
    };
  }

  async function getWorker(options = {}) {
    if (workerPromise) {
      return workerPromise;
    }

    const languages = options.languages || DEFAULT_LANGUAGES;
    const workerPath = resolveExtensionUrl("vendor/tesseract/worker.min.js");
    const corePath = resolveExtensionUrl("vendor/tesseract/core/");
    const langPath = resolveExtensionUrl("vendor/tesseract/lang/");
    const logger = typeof options.onProgress === "function"
      ? (message) => options.onProgress(normalizeProgressMessage(message))
      : undefined;

    workerPromise = global.Tesseract.createWorker(languages, 1, {
      workerPath,
      corePath,
      langPath,
      gzip: true,
      logger
    }).then(async (worker) => {
      if (worker?.setParameters) {
        await worker.setParameters({
          preserve_interword_spaces: "1"
        });
      }
      return worker;
    }).catch((error) => {
      workerPromise = null;
      throw error;
    });

    return workerPromise;
  }

  async function terminateWorker() {
    if (!workerPromise) {
      return;
    }

    const worker = await workerPromise.catch(() => null);
    workerPromise = null;
    if (worker?.terminate) {
      await worker.terminate();
    }
  }

  async function prepareImageForOcr(file, options = {}) {
    if (!global.createImageBitmap || (!global.OffscreenCanvas && !global.document?.createElement)) {
      return file;
    }

    const bitmap = await global.createImageBitmap(file);
    const maxDimension = Number(options.maxDimension) || 2600;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = createCanvas(width, height);
    const context = canvas.getContext("2d", { willReadFrequently: true });

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    enhanceImageDataForOcr(imageData.data);
    context.putImageData(imageData, 0, 0);

    return canvasToBlob(canvas);
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
          reject(new Error("Could not render page image for OCR."));
        }
      }, "image/png");
    });
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Could not read page image."));
      reader.readAsDataURL(blob);
    });
  }

  function enhanceImageDataForOcr(data) {
    for (let index = 0; index < data.length; index += 4) {
      const gray = (data[index] * 0.299) + (data[index + 1] * 0.587) + (data[index + 2] * 0.114);
      const enhanced = gray > 170 ? 255 : gray < 90 ? 0 : gray;
      data[index] = enhanced;
      data[index + 1] = enhanced;
      data[index + 2] = enhanced;
      data[index + 3] = 255;
    }
  }

  function normalizeProgressMessage(message) {
    const status = String(message?.status || "");
    const progress = Number(message?.progress);
    return {
      status,
      progress: Number.isFinite(progress) ? progress : 0
    };
  }

  function normalizeOcrText(text) {
    return String(text || "")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function notifyProgress(options, status, progress) {
    if (typeof options.onProgress === "function") {
      options.onProgress({ status, progress });
    }
  }

  function isPdfFile(file) {
    return file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");
  }

  function isLegacyDocFile(file) {
    return file?.type === "application/msword" || /\.doc$/i.test(file?.name || "");
  }

  function resolveExtensionUrl(path) {
    if (global.chrome?.runtime?.getURL) {
      return global.chrome.runtime.getURL(path);
    }
    return path;
  }

  global.CrmAutomationOcr = Object.freeze({
    isOcrAvailable,
    canOcrFile,
    getUnsupportedReason,
    recognizeFile,
    terminateWorker
  });
})(typeof window !== "undefined" ? window : globalThis);
