(function initializeCrmVisionExtractionProvider(global) {
  "use strict";

  const STORAGE_KEY = "tradeOpsVisionExtractionConfig";
  const CONFIDENTIALITY_WARNING = "This may send commercial confidential documents to the configured AI provider. Only enable this if your company allows it.";

  function readConfig() {
    try {
      return JSON.parse(global.localStorage?.getItem(STORAGE_KEY) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveConfig(config) {
    const safeConfig = {
      enabled: config.enabled === true,
      provider: config.provider || "openai_compatible",
      confirmExternalSend: config.confirmExternalSend === true,
      endpoint: String(config.endpoint || "").trim(),
      model: String(config.model || "").trim(),
      apiKey: String(config.apiKey || "").trim(),
      sendImages: config.sendImages !== false,
      sendOcrText: config.sendOcrText !== false
    };
    global.localStorage?.setItem(STORAGE_KEY, JSON.stringify(safeConfig));
    return safeConfig;
  }

  function isConfigured(config = readConfig()) {
    return Boolean(
      config.enabled === true
      && config.confirmExternalSend === true
      && config.endpoint
      && config.model
      && config.apiKey
    );
  }

  function buildVisionPrompt(options = {}) {
    const requestedFields = [
      "buyer",
      "seller",
      "supplier",
      "manufacturer",
      "productName",
      "casNo",
      "hsCode",
      "quantity",
      "unit",
      "unitPrice",
      "currency",
      "totalAmount",
      "paymentTerm",
      "incoterm",
      "destinationPort",
      "portOfLoading",
      "packingTerms",
      "insuranceTerms",
      "bankName",
      "swift",
      "beneficiaryName",
      "accountNo"
    ];
    return [
      "Inspect the page images directly and extract structured trade document data.",
      "Return strict JSON only. Do not include markdown fences.",
      "Do not invent values. If a value is not visible, return an empty string.",
      "Prefer values visible in tables over noisy OCR text.",
      "Preserve original units and currency exactly as visible.",
      "Extract short evidence text for every non-empty field.",
      "Use pageNo for the page where the evidence appears.",
      "Allowed documentType values: purchase_order, sales_contract, purchase_order_or_sales_contract, commercial_invoice, packing_list, bill_of_lading, other.",
      `Field keys: ${requestedFields.join(", ")}`,
      "Return exactly this JSON shape:",
      JSON.stringify({
        documentType: "purchase_order_or_sales_contract",
        confidence: 0,
        fields: Object.fromEntries(requestedFields.map((fieldKey) => [fieldKey, {
          value: "",
          pageNo: null,
          evidence: "",
          confidence: 0
        }])),
        lineItems: [{
          productName: "",
          casNo: "",
          hsCode: "",
          quantity: "",
          unit: "",
          unitPrice: "",
          amount: "",
          evidence: "",
          pageNo: null
        }],
        warnings: []
      })
    ].join("\n");
  }

  async function extractFromPageImages(pageImages = [], ocrText = "", config = readConfig()) {
    if (!isConfigured(config)) {
      throw new Error("Vision AI extraction is disabled. Configure endpoint, model, API key, and explicit external-send confirmation first.");
    }

    const messages = [{
      role: "system",
      content: "You are a strict trade-document extraction engine. Return only valid JSON."
    }, {
      role: "user",
      content: buildUserContent(pageImages, ocrText, config)
    }];

    const response = await global.fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0,
        messages
      })
    });

    if (!response.ok) {
      throw new Error(`Vision AI request failed with HTTP ${response.status}.`);
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || data?.output_text || "";
    return normalizeVisionResult(parseVisionJson(text));
  }

  function buildUserContent(pageImages, ocrText, config) {
    const content = [{
      type: "text",
      text: [
        CONFIDENTIALITY_WARNING,
        buildVisionPrompt()
      ].join("\n\n")
    }];

    if (config.sendOcrText !== false && ocrText) {
      content.push({
        type: "text",
        text: `OCR text:\n${String(ocrText).slice(0, 50000)}`
      });
    }

    if (config.sendImages !== false) {
      pageImages.slice(0, 8).forEach((image, index) => {
        const dataUrl = typeof image === "string" ? image : image?.dataUrl || image?.image || "";
        if (!dataUrl) {
          return;
        }
        content.push({
          type: "image_url",
          image_url: {
            url: dataUrl,
            detail: "high"
          }
        });
      });
    }

    return content;
  }

  function parseVisionJson(text) {
    const raw = String(text || "").trim();
    const withoutFence = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
    try {
      return JSON.parse(withoutFence);
    } catch (error) {
      const start = withoutFence.indexOf("{");
      const end = withoutFence.lastIndexOf("}");
      if (start >= 0 && end > start) {
        return JSON.parse(withoutFence.slice(start, end + 1));
      }
      throw error;
    }
  }

  function normalizeVisionResult(raw) {
    const fields = Object.entries(raw?.fields || {}).reduce((normalized, [fieldKey, field]) => {
      const value = typeof field === "object" ? field.value : field;
      if (value === null || value === undefined || String(value).trim() === "") {
        return normalized;
      }
      const canonicalKey = normalizeFieldKey(fieldKey);
      normalized[canonicalKey] = {
        value: String(value).trim(),
        confidence: clampConfidence(field.confidence),
        sourceText: String(field.sourceText || field.evidence || value).trim(),
        evidence: String(field.evidence || field.sourceText || value).trim(),
        pageNo: field.pageNo || null,
        method: "vision_ai"
      };
      return normalized;
    }, {});

    return {
      documentType: raw?.documentType || global.CrmAutomationSchema?.DOCUMENT_TYPES?.other || "other",
      fields,
      lineItems: Array.isArray(raw?.lineItems) ? raw.lineItems : [],
      warnings: Array.isArray(raw?.warnings) ? raw.warnings : [],
      method: "vision_ai"
    };
  }

  function clampConfidence(value) {
    const confidence = Number(value);
    if (!Number.isFinite(confidence)) {
      return 0.45;
    }
    return Math.max(0, Math.min(1, confidence));
  }

  function normalizeFieldKey(fieldKey) {
    const aliases = {
      buyer: "customerName",
      seller: "supplierName",
      supplier: "supplierName",
      incoterm: "incoterms",
      amount: "totalAmount"
    };
    return aliases[fieldKey] || fieldKey;
  }

  global.CrmVisionExtractionProvider = Object.freeze({
    CONFIDENTIALITY_WARNING,
    readConfig,
    saveConfig,
    isConfigured,
    buildVisionPrompt,
    extractFromPageImages,
    parseVisionJson,
    normalizeVisionResult
  });
})(typeof window !== "undefined" ? window : globalThis);
