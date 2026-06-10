/**
 * Gemini PDF extraction provider for CRM auto-fill.
 *
 * The provider sends the original PDF to Gemini as inline_data so scanned
 * documents can be read visually instead of through the legacy regex/OCR path.
 */
(function initializeCrmGeminiExtractionProvider() {
  const CONFIG_STORAGE_KEY = "crmWorkbenchGeminiExtractionConfig";
  const DEFAULT_CONFIG = {
    apiKey: "",
    model: "gemini-2.5-flash",
    mode: "gemini_pdf_direct",
    temperature: 0,
    maxOutputTokens: 16384
  };

  const CRM_FIELD_KEYS = [
    "signingDate",
    "customerOrderNo",
    "quotationNo",
    "purchaseSaleMode",
    "customer",
    "countryRegion",
    "contactPerson",
    "receivingAccount",
    "relatedBusinessOpportunity",
    "remarks",
    "productName",
    "hsCode",
    "casNo",
    "quantity",
    "unit",
    "unitPrice",
    "currency",
    "totalAmount",
    "contractTotalAmount",
    "usdTotalAmount",
    "paymentTerm",
    "paymentMethod",
    "exchangeRate",
    "deliveryPeriod",
    "transportMode",
    "incoterm",
    "destinationPort",
    "portOfLoading",
    "portOfLoadingCountry",
    "destinationPortCountry",
    "destinationPlace",
    "overfillRate",
    "shortfallRate",
    "shippingMark",
    "commissionDescription",
    "customsScNo"
  ];

  const TRADE_FIELD_KEYS = [
    "buyer",
    "seller",
    "supplier",
    "manufacturer",
    "productName",
    "officialEnglishName",
    "hsCode",
    "casNo",
    "quantity",
    "unit",
    "unitPrice",
    "currency",
    "totalAmount",
    "paymentTerm",
    "incoterm",
    "destinationPort",
    "portOfLoading",
    "deliveryDate",
    "etd",
    "eta",
    "packingTerms",
    "insuranceTerms",
    "bankName",
    "swift",
    "beneficiaryName",
    "accountNo"
  ];

  let configCache = { ...DEFAULT_CONFIG };
  const ready = loadConfig();

  async function isConfigured() {
    const config = await getConfig();
    return Boolean(config.apiKey && config.model && config.mode === "gemini_pdf_direct");
  }

  async function getConfig() {
    await ready;
    return { ...configCache };
  }

  async function saveConfig(nextConfig = {}) {
    await ready;
    configCache = sanitizeConfig({
      ...configCache,
      ...nextConfig
    });
    await setStorageValue(CONFIG_STORAGE_KEY, configCache);
    return { ...configCache };
  }

  function buildPrompt() {
    return `You are a precise trade document extraction engine for a Chinese export/import CRM.

You will receive the original PDF as application/pdf inline data. Read it visually and semantically, including scanned pages. Do not rely on OCR text from the browser extension.

Return strict JSON only. Do not use markdown fences. Do not invent values. If a field is missing or uncertain, return an empty string with low confidence and add a warning.

For every field, return:
- value: exact extracted value, normalized only for obvious spacing/currency cleanup
- pageNo: source page number, or null
- evidence: short source phrase supporting the value
- confidence: number from 0 to 1

CRM fields to extract:
${CRM_FIELD_KEYS.map((key) => `- ${key}`).join("\n")}

Trade document fields to extract:
${TRADE_FIELD_KEYS.map((key) => `- ${key}`).join("\n")}

Return exactly this JSON shape:
{
  "documentType": "",
  "crmFields": ${JSON.stringify(buildEmptyFieldMap(CRM_FIELD_KEYS), null, 2)},
  "tradeFields": ${JSON.stringify(buildEmptyFieldMap(TRADE_FIELD_KEYS), null, 2)},
  "lineItems": [
    {
      "productName": "",
      "casNo": "",
      "hsCode": "",
      "quantity": "",
      "unit": "",
      "unitPrice": "",
      "currency": "",
      "amount": "",
      "pageNo": null,
      "evidence": "",
      "confidence": 0
    }
  ],
  "warnings": []
}

Extraction rules:
- Customer means buyer/importer/purchaser/customer. Never return a sentence fragment such as "THE".
- Supplier means seller/exporter/supplier/manufacturer only when labelled or strongly implied.
- Quantity must include the actual commercial quantity and unit when visible, such as "6480 KG"; never return a date like "5.2026".
- Total amount must be a currency amount, not a row number such as "10".
- HS code must be near HS CODE, HSN CODE, customs code, tariff code, or equivalent Chinese wording.
- CAS number must match CAS format such as 156-87-6.
- Incoterm should preserve location if visible, for example "CIF NHAVA SHEVA".
- Payment term should preserve full wording, for example "DA 90 days from the date of AWB / BOL".
- Destination port and port of loading should be concise port/place names.
- Do not auto-fill defaults. If overfillRate, shortfallRate, purchaseSaleMode, or transportMode is not visible, leave it empty.`;
  }

  async function extractFromPdfFile(file) {
    if (!file) {
      throw new Error("No PDF file was provided.");
    }
    if (!isPdf(file)) {
      throw new Error("Gemini direct extraction requires a PDF file.");
    }

    const config = await getConfig();
    if (!config.apiKey) {
      throw new Error("Gemini API key is not configured.");
    }

    const base64Pdf = await fileToBase64(file);
    const body = {
      contents: [
        {
          role: "user",
          parts: [
            { text: buildPrompt() },
            {
              inline_data: {
                mime_type: "application/pdf",
                data: stripBase64Prefix(base64Pdf)
              }
            }
          ]
        }
      ],
      generationConfig: {
        temperature: config.temperature,
        responseMimeType: "application/json",
        maxOutputTokens: config.maxOutputTokens
      }
    };

    let responseBody;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });
      const responseText = await response.text();
      responseBody = safeJsonParse(responseText) || { text: responseText };

      if (!response.ok) {
        throw new Error(responseBody?.error?.message || `Gemini request failed with HTTP ${response.status}.`);
      }
    } catch (error) {
      throw new Error(`Gemini extraction failed: ${error.message || String(error)}`);
    }

    let parsed;
    try {
      parsed = parseGeminiResponse(responseBody);
    } catch (error) {
      error.rawResponse = responseBody;
      error.responseText = getGeminiText(responseBody);
      throw error;
    }
    return {
      ...parsed,
      rawResponse: responseBody,
      requestSummary: {
        model: config.model,
        mode: config.mode,
        fileName: file.name || "",
        fileSize: file.size || 0
      }
    };
  }

  function parseGeminiResponse(responseInput) {
    if (isPlainObject(responseInput) && (responseInput.crmFields || responseInput.tradeFields || responseInput.documentType)) {
      return normalizeExtraction(responseInput);
    }

    const responseText = isPlainObject(responseInput) ? getGeminiText(responseInput) : String(responseInput || "");
    const candidates = buildJsonParseCandidates(responseText);
    let parsed = null;
    for (const candidate of candidates) {
      parsed = parseJsonCandidate(candidate);
      if (parsed) {
        break;
      }
    }

    if (!parsed) {
      throw new Error(`Gemini response was not valid JSON. Preview: ${previewText(responseText || JSON.stringify(responseInput || {}))}`);
    }

    if (typeof parsed === "string") {
      return parseGeminiResponse(parsed);
    }
    if (Array.isArray(parsed)) {
      parsed = parsed.find(isPlainObject) || {};
    }
    if (isPlainObject(parsed) && parsed.candidates) {
      return parseGeminiResponse(parsed);
    }
    return normalizeExtraction(parsed);
  }

  function normalizeExtraction(result) {
    return {
      documentType: String(result?.documentType || ""),
      crmFields: normalizeFieldMap(result?.crmFields, CRM_FIELD_KEYS),
      tradeFields: normalizeFieldMap(result?.tradeFields, TRADE_FIELD_KEYS),
      lineItems: normalizeLineItems(result?.lineItems),
      warnings: Array.isArray(result?.warnings) ? result.warnings.map(String).filter(Boolean) : []
    };
  }

  async function loadConfig() {
    const stored = await getStorageValue(CONFIG_STORAGE_KEY);
    configCache = sanitizeConfig({
      ...DEFAULT_CONFIG,
      ...(isPlainObject(stored) ? stored : {})
    });
  }

  function sanitizeConfig(config) {
    return {
      apiKey: String(config.apiKey || "").trim(),
      model: String(config.model || DEFAULT_CONFIG.model).trim() || DEFAULT_CONFIG.model,
      mode: config.mode === "gemini_pdf_direct" ? config.mode : DEFAULT_CONFIG.mode,
      temperature: clampNumber(config.temperature, 0, 2, DEFAULT_CONFIG.temperature),
      maxOutputTokens: Math.round(clampNumber(config.maxOutputTokens, DEFAULT_CONFIG.maxOutputTokens, 65536, DEFAULT_CONFIG.maxOutputTokens))
    };
  }

  function normalizeFieldMap(fieldMap, keys) {
    const normalized = {};
    keys.forEach((key) => {
      normalized[key] = normalizeField(fieldMap?.[key]);
    });
    return normalized;
  }

  function normalizeField(field) {
    const source = isPlainObject(field) ? field : { value: field };
    return {
      value: source.value == null ? "" : String(source.value).trim(),
      pageNo: Number.isFinite(Number(source.pageNo)) ? Number(source.pageNo) : null,
      evidence: source.evidence == null ? "" : String(source.evidence).trim(),
      confidence: normalizeConfidence(source.confidence)
    };
  }

  function normalizeLineItems(lineItems) {
    if (!Array.isArray(lineItems)) {
      return [];
    }
    return lineItems.map((item) => {
      const source = isPlainObject(item) ? item : {};
      return {
        productName: String(source.productName || "").trim(),
        casNo: String(source.casNo || "").trim(),
        hsCode: String(source.hsCode || "").trim(),
        quantity: String(source.quantity || "").trim(),
        unit: String(source.unit || "").trim(),
        unitPrice: String(source.unitPrice || "").trim(),
        currency: String(source.currency || "").trim(),
        amount: String(source.amount || "").trim(),
        pageNo: Number.isFinite(Number(source.pageNo)) ? Number(source.pageNo) : null,
        evidence: String(source.evidence || "").trim(),
        confidence: normalizeConfidence(source.confidence)
      };
    });
  }

  function buildEmptyFieldMap(keys) {
    return Object.fromEntries(keys.map((key) => [key, {
      value: "",
      pageNo: null,
      evidence: "",
      confidence: 0
    }]));
  }

  function getGeminiText(responseBody) {
    const candidateTexts = Array.isArray(responseBody?.candidates)
      ? responseBody.candidates.flatMap((candidate) => {
        return Array.isArray(candidate?.content?.parts)
          ? candidate.content.parts.map((part) => typeof part?.text === "string" ? part.text : "")
          : [];
      })
      : [];

    return candidateTexts.filter(Boolean).join("\n").trim()
      || responseBody?.text
      || responseBody?.output_text
      || "";
  }

  function stripMarkdownFence(text) {
    return String(text || "")
      .trim()
      .replace(/^```(?:json|javascript|js)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
  }

  function buildJsonParseCandidates(text) {
    const normalized = normalizeJsonishText(text);
    const fencedMatch = normalized.match(/```(?:json|javascript|js)?\s*([\s\S]*?)\s*```/i);
    const balancedJson = extractBalancedJson(normalized);
    return [
      normalized,
      stripMarkdownFence(normalized),
      fencedMatch?.[1] || "",
      balancedJson
    ].filter((candidate, index, candidates) => candidate && candidates.indexOf(candidate) === index);
  }

  function parseJsonCandidate(candidate) {
    const parsed = safeJsonParse(candidate);
    if (parsed != null) {
      return parsed;
    }

    const unquoted = safeJsonParse(`"${String(candidate).replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n")}"`);
    return typeof unquoted === "string" ? safeJsonParse(unquoted) : null;
  }

  function normalizeJsonishText(text) {
    return String(text || "")
      .replace(/^\s*(?:json|javascript|js)\s*\n/i, "")
      .replace(/[“”]/g, '"')
      .replace(/[‘’]/g, "'")
      .trim();
  }

  function extractBalancedJson(text) {
    const source = String(text || "");
    const start = source.indexOf("{");
    if (start < 0) {
      return "";
    }

    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < source.length; index += 1) {
      const char = source[index];
      if (inString) {
        if (escaped) {
          escaped = false;
        } else if (char === "\\") {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }
        continue;
      }

      if (char === '"') {
        inString = true;
      } else if (char === "{") {
        depth += 1;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          return source.slice(start, index + 1);
        }
      }
    }
    return source.slice(start);
  }

  function safeJsonParse(text) {
    try {
      return text ? JSON.parse(text) : null;
    } catch (error) {
      return null;
    }
  }

  function previewText(text) {
    return String(text || "").replace(/\s+/g, " ").trim().slice(0, 320);
  }

  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error || new Error("Failed to read PDF file."));
      reader.readAsDataURL(file);
    });
  }

  function stripBase64Prefix(value) {
    return String(value || "").replace(/^data:[^;]+;base64,/i, "").replace(/\s/g, "");
  }

  function isPdf(file) {
    return file?.type === "application/pdf" || /\.pdf$/i.test(file?.name || "");
  }

  function normalizeConfidence(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
  }

  function clampNumber(value, min, max, fallback) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
      return fallback;
    }
    return Math.max(min, Math.min(max, number));
  }

  function isPlainObject(value) {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }

  function getStorageValue(key) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage?.local) {
        resolve(null);
        return;
      }
      chrome.storage.local.get(key, (items) => resolve(items?.[key] || null));
    });
  }

  function setStorageValue(key, value) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === "undefined" || !chrome.storage?.local) {
        resolve();
        return;
      }
      chrome.storage.local.set({ [key]: value }, () => {
        const error = chrome.runtime?.lastError;
        if (error) {
          reject(new Error(error.message));
          return;
        }
        resolve();
      });
    });
  }

  window.CrmGeminiExtractionProvider = {
    isConfigured,
    getConfig,
    saveConfig,
    buildPrompt,
    extractFromPdfFile,
    parseGeminiResponse,
    ready
  };
})();
