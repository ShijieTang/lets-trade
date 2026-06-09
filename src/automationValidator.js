(function initializeCrmAutomationValidator(global) {
  "use strict";

  const Schema = global.CrmAutomationSchema || {};
  const highRiskFields = new Set(Schema.RISK_LEVELS?.high || []);

  function validateAutomationExtraction(extractionResult, options = {}) {
    const fields = extractionResult?.fields || {};
    const lineItems = Array.isArray(extractionResult?.lineItems) ? extractionResult.lineItems : [];
    const normalizedFields = normalizeFields(fields);
    const requiredKeys = Array.isArray(options.requiredKeys) ? options.requiredKeys : [];
    const blockingIssues = [];
    const warnings = [];

    warnings.push(...validateRequiredFields(normalizedFields, requiredKeys));
    const tradeConsistency = validateTradeConsistency(normalizedFields, lineItems);
    blockingIssues.push(...tradeConsistency.blockingIssues);
    warnings.push(...tradeConsistency.warnings);
    blockingIssues.push(...validateDateOrder(normalizedFields.etd?.value, normalizedFields.eta?.value));
    blockingIssues.push(...validateWeights(normalizedFields.grossWeight?.value, normalizedFields.netWeight?.value));
    blockingIssues.push(...validateContainerNo(normalizedFields.containerNo?.value));
    const fieldSanity = validateFieldSanity(normalizedFields, extractionResult);
    blockingIssues.push(...fieldSanity.blockingIssues);
    warnings.push(...fieldSanity.warnings);
    warnings.push(...validateNumericFields(normalizedFields));
    warnings.push(...validateHighRiskReview(normalizedFields));
    warnings.push(...validateLowConfidence(normalizedFields));
    warnings.push(...validateInsuranceBeforeDeparture(normalizedFields));

    return {
      blockingIssues,
      warnings,
      normalizedFields
    };
  }

  function validateRequiredFields(fields, requiredKeys) {
    return requiredKeys
      .filter((fieldKey) => !getFieldValue(fields[fieldKey]))
      .map((fieldKey) => ({
        code: "missing_required_field",
        fieldKey,
        severity: "warning",
        message: `${fieldKey} is required for the selected CRM workflow.`
      }));
  }

  function validateTradeConsistency(fields, lineItems) {
    const blockingIssues = [];
    const warnings = [];
    const totalAmount = parseNumber(getFieldValue(fields.totalAmount));
    const itemAmounts = (lineItems || [])
      .map((item) => parseNumber(item?.amount ?? item?.productAmount))
      .filter((value) => Number.isFinite(value));

    if (Number.isFinite(totalAmount) && itemAmounts.length > 0) {
      const lineTotal = itemAmounts.reduce((sum, value) => sum + value, 0);
      const tolerance = Math.max(1, Math.abs(totalAmount) * 0.01);
      if (Math.abs(totalAmount - lineTotal) > tolerance) {
        warnings.push({
          code: "total_amount_mismatch",
          fieldKey: "totalAmount",
          severity: "warning",
          message: `Total amount ${totalAmount} does not approximately match line item sum ${roundNumber(lineTotal)}.`
        });
      }
    }

    const quantity = parseNumber(getFieldValue(fields.quantity));
    if (Number.isFinite(quantity) && quantity <= 0) {
      blockingIssues.push({
        code: "quantity_not_positive",
        fieldKey: "quantity",
        severity: "blocking",
        message: "Quantity must be greater than 0."
      });
    }

    const unitPrice = parseNumber(getFieldValue(fields.unitPrice));
    if (Number.isFinite(unitPrice) && unitPrice < 0) {
      blockingIssues.push({
        code: "unit_price_negative",
        fieldKey: "unitPrice",
        severity: "blocking",
        message: "Unit price cannot be negative."
      });
    }

    return { blockingIssues, warnings };
  }

  function validateDateOrder(etd, eta) {
    const etdDate = parseDate(etd);
    const etaDate = parseDate(eta);
    if (!etdDate || !etaDate || etdDate.getTime() <= etaDate.getTime()) {
      return [];
    }

    return [{
      code: "etd_after_eta",
      fieldKey: "etd",
      severity: "blocking",
      message: "ETD cannot be later than ETA."
    }];
  }

  function validateWeights(grossWeight, netWeight) {
    const gross = parseNumber(grossWeight);
    const net = parseNumber(netWeight);
    if (!Number.isFinite(gross) || !Number.isFinite(net) || gross >= net) {
      return [];
    }

    return [{
      code: "gross_weight_less_than_net_weight",
      fieldKey: "grossWeight",
      severity: "blocking",
      message: "Gross weight cannot be less than net weight."
    }];
  }

  function validateContainerNo(containerNo) {
    const value = String(containerNo || "").trim();
    if (!value || /^[A-Z]{4}\d{7}$/i.test(value)) {
      return [];
    }

    return [{
      code: "invalid_container_no",
      fieldKey: "containerNo",
      severity: "blocking",
      message: "Container number should use the standard 4-letter plus 7-digit format."
    }];
  }

  function validateFieldSanity(fields, extractionResult = {}) {
    const blockingIssues = [];
    const warnings = [];
    const checks = [
      validateQuantity(fields.quantity),
      validateUnit(fields.unit),
      validateCurrency(fields.currency),
      validateHsCode(fields.hsCode),
      validateCasNo(fields.casNo),
      validateAmount(fields.totalAmount, extractionResult, "totalAmount"),
      validateAmount(fields.insuredAmount, extractionResult, "insuredAmount"),
      validatePaymentTerm(fields.paymentTerm),
      validatePort(fields.portOfLoading, "portOfLoading"),
      validatePort(fields.portOfDischarge, "portOfDischarge"),
      validatePort(fields.destinationPort, "destinationPort")
    ].flat();

    checks.filter(Boolean).forEach((issue) => {
      if (issue.severity === "blocking" || highRiskFields.has(issue.fieldKey)) {
        blockingIssues.push({
          ...issue,
          severity: "blocking"
        });
      } else {
        warnings.push(issue);
      }
    });

    return { blockingIssues, warnings };
  }

  function validateQuantity(field) {
    const value = getFieldValue(field);
    if (!value) {
      return [];
    }
    if (looksLikeDate(value)) {
      return [createIssue("quantity_looks_like_date", "quantity", "blocking", "Quantity looks like a date and must be reviewed.")];
    }
    const quantity = parseNumber(value);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return [createIssue("quantity_invalid", "quantity", "blocking", "Quantity must be a positive numeric value.")];
    }
    return [];
  }

  function validateUnit(field) {
    const value = getFieldValue(field);
    if (!value) {
      return [];
    }
    const normalized = value.toUpperCase().replace(/\./g, "").trim();
    if (/^(KG|KGS|MT|MTS|DRUM|DRUMS|PCS|PC|PKG|PKGS|BAG|BAGS|L|LTR|LITRE|LITER|ML|TON|TONS)$/.test(normalized)) {
      return [];
    }
    return [createIssue("unit_unrecognized", "unit", "warning", "Unit is not a common trade unit and should be reviewed.")];
  }

  function validateCurrency(field) {
    const value = getFieldValue(field);
    if (!value) {
      return [];
    }
    if (/^(USD|CNY|RMB|EUR|JPY|GBP|INR)$/i.test(value.trim())) {
      return [];
    }
    return [createIssue("currency_unrecognized", "currency", "blocking", "Currency must be a recognized ISO-style trade currency.")];
  }

  function validateHsCode(field) {
    const value = getFieldValue(field);
    if (!value) {
      return [];
    }
    const compact = value.replace(/[.\s]/g, "");
    const sourceText = getSourceText(field);
    if (!/^\d{4,10}$/.test(compact)) {
      return [createIssue("hs_code_invalid_format", "hsCode", "blocking", "HS code should be 4 to 10 digits, with dots allowed.")];
    }
    if (/^\d{10}$/.test(compact) && (/\b(?:po|sc|contract|order|approved|approval|customer)\b/i.test(sourceText) || /55\s*[- ]?\s*5237/.test(sourceText) || /^55\d*5237$/.test(compact))) {
      return [createIssue("hs_code_looks_like_order_serial", "hsCode", "blocking", "HS code looks like a PO/SC serial number and must be corrected.")];
    }
    return [];
  }

  function validateCasNo(field) {
    const value = getFieldValue(field);
    if (!value) {
      return [];
    }
    if (/^\d{2,7}-\d{2}-\d$/.test(value)) {
      return [];
    }
    return [createIssue("cas_no_invalid_format", "casNo", "warning", "CAS number should use the standard digits-digits-digit format.")];
  }

  function validateAmount(field, extractionResult = {}, fieldKey = "totalAmount") {
    const value = getFieldValue(field);
    if (!value) {
      return [];
    }
    const amount = parseNumber(value);
    if (!Number.isFinite(amount) || amount < 0) {
      return [createIssue("amount_invalid", fieldKey, "blocking", "Amount must be a non-negative numeric value.")];
    }
    const context = `${getSourceText(field)}\n${String(extractionResult.rawText || "")}`;
    const maxNearbyNumber = getMaxLargeNumber(context);
    if (fieldKey === "totalAmount" && amount > 0 && amount < 100 && maxNearbyNumber >= 1000) {
      return [createIssue("amount_looks_like_serial_fragment", fieldKey, "blocking", "Total amount looks like a serial fragment while larger amount values are present.")];
    }
    return [];
  }

  function validatePaymentTerm(field) {
    const value = getFieldValue(field);
    if (!value) {
      return [];
    }
    const lower = value.toLowerCase();
    if (value.length > 80 && /\b(?:hsn|hs\s*code|quantity|unit price|amount|cas no|3-aminopropanol|description)\b/i.test(lower)) {
      return [createIssue("payment_term_contains_table_text", "paymentTerm", "warning", "Payment term appears to include table or product text.")];
    }
    return [];
  }

  function validatePort(field, fieldKey) {
    const value = getFieldValue(field);
    if (!value) {
      return [];
    }
    if (value.length > 80 || /\b(?:payment|quantity|unit price|amount|cas no|hsn|3-aminopropanol)\b/i.test(value)) {
      return [createIssue("port_contains_unrelated_text", fieldKey, "warning", "Port value appears to contain unrelated table or payment text.")];
    }
    return [];
  }

  function validateNumericFields(fields) {
    const numericKeys = [
      "totalAmount",
      "quantity",
      "unitPrice",
      "productAmount",
      "grossWeight",
      "netWeight",
      "volume",
      "packageCount",
      "insuredAmount"
    ];

    return numericKeys.reduce((warnings, fieldKey) => {
      const value = getFieldValue(fields[fieldKey]);
      if (!value) {
        return warnings;
      }
      const numericValue = parseNumber(value);
      if (!Number.isFinite(numericValue)) {
        warnings.push({
          code: "numeric_parse_failed",
          fieldKey,
          severity: "warning",
          message: `${fieldKey} should be reviewed because it is not a clear number.`
        });
      }
      return warnings;
    }, []);
  }

  function validateHighRiskReview(fields) {
    return Object.entries(fields)
      .filter(([fieldKey, field]) => highRiskFields.has(fieldKey) && getFieldValue(field))
      .map(([fieldKey]) => ({
        code: "high_risk_review_required",
        fieldKey,
        severity: "warning",
        reviewRequired: true,
        message: `${fieldKey} is high-risk and requires human review before CRM fill.`
      }));
  }

  function validateLowConfidence(fields) {
    return Object.entries(fields)
      .filter(([fieldKey, field]) => Number(field?.confidence) < (highRiskFields.has(fieldKey) ? 0.8 : 0.65))
      .map(([fieldKey]) => ({
        code: "low_confidence_review_required",
        fieldKey,
        severity: "warning",
        reviewRequired: true,
        message: `${fieldKey} has low extraction confidence.`
      }));
  }

  function validateInsuranceBeforeDeparture(fields) {
    const etdDate = parseDate(getFieldValue(fields.etd));
    if (!etdDate) {
      return [];
    }

    const now = new Date();
    const daysUntilDeparture = (etdDate.getTime() - startOfDay(now).getTime()) / 86400000;
    const hasInsurance = Boolean(getFieldValue(fields.insurancePolicyNo) || getFieldValue(fields.insuredAmount));
    if (hasInsurance || daysUntilDeparture > 7) {
      return [];
    }

    return [{
      code: "insurance_missing_near_departure",
      fieldKey: "insurancePolicyNo",
      severity: "warning",
      message: "Insurance information should be confirmed before a near ETD."
    }];
  }

  function normalizeFields(fields) {
    return Object.entries(fields || {}).reduce((normalized, [fieldKey, field]) => {
      const value = normalizeFieldValue(fieldKey, getFieldValue(field));
      normalized[fieldKey] = {
        ...field,
        value
      };
      return normalized;
    }, {});
  }

  function normalizeFieldValue(fieldKey, value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }

    if (["totalAmount", "quantity", "unitPrice", "productAmount", "grossWeight", "netWeight", "volume", "packageCount", "insuredAmount"].includes(fieldKey)) {
      const numericValue = parseNumber(text);
      return Number.isFinite(numericValue) ? trimPlainNumber(String(numericValue)) : text;
    }

    if (["etd", "eta", "invoiceDate"].includes(fieldKey)) {
      const date = parseDate(text);
      return date ? formatDate(date) : text;
    }

    if (fieldKey === "containerNo") {
      return text.toUpperCase().replace(/\s+/g, "");
    }

    if (fieldKey === "currency") {
      return text.toUpperCase().replace("RMB", "CNY").replace("US$", "USD");
    }

    return text;
  }

  function getFieldValue(field) {
    if (!field) {
      return "";
    }
    if (typeof field === "object" && Object.prototype.hasOwnProperty.call(field, "value")) {
      return String(field.value || "").trim();
    }
    return String(field || "").trim();
  }

  function getSourceText(field) {
    if (!field || typeof field !== "object") {
      return "";
    }
    return String(field.sourceText || field.evidence || "").trim();
  }

  function createIssue(code, fieldKey, severity, message) {
    return {
      code,
      fieldKey,
      severity,
      reviewRequired: true,
      message
    };
  }

  function looksLikeDate(value) {
    const text = String(value || "").trim();
    return /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/.test(text)
      || /^\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4}$/.test(text)
      || /^\d{1,2}[/.](?:19|20|21)\d{2}$/.test(text)
      || /\b(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\b/i.test(text);
  }

  function getMaxLargeNumber(text) {
    const matches = String(text || "").match(/\b\d{1,3}(?:,\d{3})+(?:\.\d+)?\b|\b\d{4,}(?:\.\d+)?\b/g) || [];
    return matches
      .map((value) => parseNumber(value))
      .filter((value) => Number.isFinite(value))
      .reduce((max, value) => Math.max(max, value), 0);
  }

  function parseNumber(value) {
    const text = String(value || "").replace(/,/g, "");
    const match = text.match(/[-+]?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : NaN;
  }

  function parseDate(value) {
    const text = String(value || "").trim();
    const isoMatch = text.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
    if (isoMatch) {
      return buildDate(isoMatch[1], isoMatch[2], isoMatch[3]);
    }

    const dayFirstMatch = text.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (dayFirstMatch) {
      return buildDate(dayFirstMatch[3], dayFirstMatch[2], dayFirstMatch[1]);
    }

    return null;
  }

  function buildDate(year, month, day) {
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) {
      return null;
    }
    return date;
  }

  function startOfDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  function formatDate(date) {
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
  }

  function roundNumber(value) {
    return Number(value.toFixed(4));
  }

  function trimPlainNumber(value) {
    return String(value).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  global.CrmAutomationValidator = Object.freeze({
    validateAutomationExtraction,
    validateRequiredFields,
    validateTradeConsistency,
    validateDateOrder,
    validateWeights,
    validateContainerNo,
    validateFieldSanity,
    validateQuantity,
    validateHsCode,
    validateCasNo,
    validateAmount,
    validatePaymentTerm,
    validatePort
  });
})(typeof window !== "undefined" ? window : globalThis);
