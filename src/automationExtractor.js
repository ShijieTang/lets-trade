/**
 * Automation Hub extraction orchestration.
 *
 * This module chooses the extraction mode. The default is Gemini direct PDF
 * when Gemini is enabled and configured; otherwise it falls back to local rules.
 */
(function initializeCrmAutomationExtractor() {
  const MODES = {
    GEMINI_PDF_DIRECT: "gemini_pdf_direct",
    GEMINI_PAGE_IMAGES: "gemini_page_images",
    RULE_ONLY: "rule_only"
  };

  async function resolveMode(requestedMode) {
    const provider = window.CrmGeminiExtractionProvider;
    if (requestedMode && Object.values(MODES).includes(requestedMode)) {
      return requestedMode;
    }
    const configured = provider?.isConfigured ? await provider.isConfigured() : false;
    const config = provider?.getConfig ? await provider.getConfig() : {};
    return configured && config.apiKey
      ? MODES.GEMINI_PDF_DIRECT
      : MODES.RULE_ONLY;
  }

  async function extractFromFile(file, options = {}) {
    const mode = await resolveMode(options.mode);
    const startedAt = new Date().toISOString();

    if (mode === MODES.RULE_ONLY) {
      return buildRuleOnlyResult(options.ruleText || "", {
        startedAt,
        file
      });
    }

    const provider = await requireGeminiProvider();
    if (mode === MODES.GEMINI_PDF_DIRECT) {
      if (!file || !isPdf(file)) {
        throw new Error("Gemini PDF Direct mode requires a PDF file.");
      }
      const result = await provider.extractFromPdfFile(file);
      return {
        ...result,
        mode,
        startedAt,
        fileSummary: summarizeFile(file)
      };
    }

    if (mode === MODES.GEMINI_PAGE_IMAGES) {
      if (!Array.isArray(options.pageImages) || options.pageImages.length === 0) {
        throw new Error("Gemini Page Images fallback/debug mode requires page images. Direct PDF mode does not convert PDFs to images automatically.");
      }
      const result = await provider.extractFromPageImages(options.pageImages);
      return {
        ...result,
        mode,
        startedAt,
        fileSummary: summarizeFile(file),
        pageImageCount: options.pageImages.length
      };
    }

    throw new Error(`Unsupported extraction mode: ${mode}`);
  }

  function buildRuleOnlyResult(text, metadata = {}) {
    return {
      mode: MODES.RULE_ONLY,
      method: "rule",
      startedAt: metadata.startedAt || new Date().toISOString(),
      fileSummary: summarizeFile(metadata.file),
      documentType: "",
      documentSubType: "",
      overallConfidence: 0,
      crmFields: {},
      tradeFields: {},
      lineItems: [],
      alternatives: {},
      warnings: [],
      validation: {
        status: "rule_only",
        issues: []
      },
      rawText: String(text || "")
    };
  }

  async function requireGeminiProvider() {
    const provider = window.CrmGeminiExtractionProvider;
    if (!provider) {
      throw new Error("Gemini extraction provider is not loaded.");
    }
    if (!(await provider.isConfigured())) {
      throw new Error("Gemini extraction is not configured. Enable Gemini and add an API key in Automation AI Settings.");
    }
    return provider;
  }

  function summarizeFile(file) {
    if (!file) {
      return null;
    }
    return {
      name: file.name || "",
      size: file.size || 0,
      type: file.type || ""
    };
  }

  function isPdf(file) {
    return file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");
  }

  window.CrmAutomationExtractor = {
    MODES,
    resolveMode,
    extractFromFile,
    buildRuleOnlyResult
  };
})();
