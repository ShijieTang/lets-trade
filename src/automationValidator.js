/**
 * Validation rules for AI-extracted CRM automation fields.
 */
(function initializeCrmAutomationValidator() {
  const HIGH_RISK_FIELDS = new Set([
    "customer",
    "supplier",
    "currency",
    "totalAmount",
    "contractTotalAmount",
    "quantity",
    "hsCode",
    "casNo",
    "incoterm",
    "destinationPort",
    "paymentTerm",
    "paymentMethod"
  ]);

  function validateFields(fields = {}) {
    const results = {};
    Object.entries(fields).forEach(([key, field]) => {
      results[key] = validateField(key, field);
    });
    return results;
  }

  function validateField(key, field = {}) {
    const value = normalizeValue(field.value ?? field);
    const confidence = normalizeConfidence(field.confidence);
    const issues = [];

    if (!value) {
      issues.push("missing_value");
    }

    if (key === "quantity" && !validateQuantity(value).valid) {
      issues.push("invalid_quantity");
    }
    if (["totalAmount", "contractTotalAmount", "usdTotalAmount", "unitPrice"].includes(key) && !validateAmount(value).valid) {
      issues.push("invalid_amount");
    }
    if (key === "hsCode" && value && !validateHsCode(value).valid) {
      issues.push("invalid_hs_code");
    }
    if (key === "casNo" && value && !validateCasNo(value).valid) {
      issues.push("invalid_cas_no");
    }
    if (key === "currency" && value && !validateCurrency(value).valid) {
      issues.push("invalid_currency");
    }
    if (key === "incoterm" && value && !validateIncoterm(value).valid) {
      issues.push("invalid_incoterm");
    }
    if (["destinationPort", "portOfLoading"].includes(key) && value && !validatePort(value).valid) {
      issues.push("invalid_port");
    }
    if (["customer", "supplier", "buyer", "seller"].includes(key) && value && !validatePartyName(value).valid) {
      issues.push("invalid_party_name");
    }
    if (looksCorruptedOcr(value)) {
      issues.push("corrupted_ocr");
    }

    const highRisk = HIGH_RISK_FIELDS.has(key);
    const reviewRequired = highRisk && (confidence < 0.8 || issues.length > 0);
    return {
      key,
      value,
      confidence,
      valid: issues.length === 0,
      riskLevel: reviewRequired ? "high" : highRisk ? "medium" : "low",
      reviewRequired,
      issues
    };
  }

  function validateQuantity(value) {
    const text = normalizeValue(value);
    const number = parseFirstNumber(text);
    const hasUnit = /\b(?:KG|KGS|MT|TONS?|LB|LBS|PCS|PIECES|BAGS?|DRUMS?|CARTONS?|CTNS?|SETS?)\b/i.test(text);
    const valid = Boolean(text) && Number.isFinite(number) && number > 0 && hasUnit && !looksLikeDate(text) && !looksLikeRowNumber(text);
    return buildResult(valid, valid ? [] : ["Quantity must be a positive amount with a unit and must not look like a date or row number."]);
  }

  function validateAmount(value) {
    const text = normalizeValue(value);
    const number = parseFirstNumber(text);
    const hasAmountShape = /(?:USD|EUR|CNY|RMB|GBP|JPY|INR|\$|€|¥)?\s*\d[\d,]*(?:\.\d{1,4})?/i.test(text);
    const valid = Boolean(text) && Number.isFinite(number) && number > 20 && hasAmountShape && !looksLikeDate(text) && !looksLikeRowNumber(text);
    return buildResult(valid, valid ? [] : ["Amount must be a commercial currency/amount value, not a date or small row number."]);
  }

  function validateHsCode(value) {
    const digits = normalizeValue(value).replace(/\D/g, "");
    const valid = digits.length >= 6 && digits.length <= 10;
    return buildResult(valid, valid ? [] : ["HS code should contain 6 to 10 digits."]);
  }

  function validateCasNo(value) {
    const text = normalizeValue(value);
    const match = text.match(/\b(\d{2,7})-(\d{2})-(\d)\b/);
    if (!match) {
      return buildResult(false, ["CAS number must use the standard hyphenated format."]);
    }

    const digits = `${match[1]}${match[2]}`.split("").reverse().map(Number);
    const checkDigit = digits.reduce((sum, digit, index) => sum + digit * (index + 1), 0) % 10;
    return buildResult(checkDigit === Number(match[3]), checkDigit === Number(match[3]) ? [] : ["CAS check digit failed."]);
  }

  function validateCurrency(value) {
    const valid = /^(?:USD|EUR|CNY|RMB|GBP|JPY|INR|AUD|CAD|HKD)$/i.test(normalizeValue(value));
    return buildResult(valid, valid ? [] : ["Currency should be a known ISO-style code."]);
  }

  function validateIncoterm(value) {
    const valid = /\b(?:EXW|FCA|FAS|FOB|CFR|CIF|CPT|CIP|DAP|DPU|DDP)\b/i.test(normalizeValue(value));
    return buildResult(valid, valid ? [] : ["Incoterm should contain a recognized trade term."]);
  }

  function validatePort(value) {
    const text = normalizeValue(value);
    const valid = text.length >= 2 && text.length <= 80 && !/[.!?。！？]/.test(text) && !/\b(?:description|quantity|amount|invoice)\b/i.test(text);
    return buildResult(valid, valid ? [] : ["Port should be a concise place/port name."]);
  }

  function validatePartyName(value) {
    const text = normalizeValue(value);
    const invalidWord = /^(?:THE|AND|OR|OF|TO|FROM|LIMITED|CO\.?)$/i.test(text);
    const valid = text.length >= 4 && !invalidWord && !/\b(?:description|quantity|unit price|amount)\b/i.test(text);
    return buildResult(valid, valid ? [] : ["Party name looks like a fragment or table header."]);
  }

  function looksLikeDate(value) {
    const text = normalizeValue(value);
    return /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b|\b\d{4}[./-]\d{1,2}[./-]\d{1,2}\b|\b\d{1,2}\.\d{4}\b/.test(text);
  }

  function looksLikeRowNumber(value) {
    const text = normalizeValue(value);
    const number = Number(text.replace(/,/g, ""));
    return /^\d{1,2}$/.test(text) || (Number.isFinite(number) && number > 0 && number <= 20);
  }

  function looksCorruptedOcr(value) {
    const text = normalizeValue(value);
    if (!text) {
      return false;
    }
    return /[|_]{2,}/.test(text) || /\d+[A-Z]+\d+[A-Z]+/i.test(text) || (text.length > 4 && countReplacementChars(text) > 0);
  }

  function countReplacementChars(text) {
    return (text.match(/\uFFFD/g) || []).length;
  }

  function parseFirstNumber(value) {
    const match = normalizeValue(value).match(/[-+]?\d[\d,]*(?:\.\d+)?/);
    return match ? Number(match[0].replace(/,/g, "")) : NaN;
  }

  function normalizeValue(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function normalizeConfidence(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
  }

  function buildResult(valid, issues) {
    return { valid, issues };
  }

  window.CrmAutomationValidator = {
    HIGH_RISK_FIELDS,
    validateFields,
    validateField,
    validateQuantity,
    validateAmount,
    validateHsCode,
    validateCasNo,
    validateCurrency,
    validateIncoterm,
    validatePort,
    validatePartyName,
    looksLikeDate,
    looksLikeRowNumber,
    looksCorruptedOcr
  };
})();
