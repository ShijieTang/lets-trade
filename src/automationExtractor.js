(function initializeCrmAutomationExtractor(global) {
  "use strict";

  const Schema = global.CrmAutomationSchema || {};
  const DOCUMENT_TYPES = Schema.DOCUMENT_TYPES || {
    commercial_invoice: "commercial_invoice",
    packing_list: "packing_list",
    bill_of_lading: "bill_of_lading",
    insurance_policy: "insurance_policy",
    certificate_of_origin: "certificate_of_origin",
    purchase_order: "purchase_order",
    sales_contract: "sales_contract",
    other: "other"
  };

  const FIELD_DEFINITIONS = Object.freeze({
    scNo: {
      type: "text",
      labels: ["SC NO", "SC No.", "Sales Contract No", "Sales Contract Number", "销售合同号", "合同号", "报关SC NO", "报关SC号"]
    },
    customerPoNo: {
      type: "text",
      labels: ["PO No", "PO NO.", "P.O. No", "P/O No", "Purchase Order No", "Purchase Order Number", "Customer PO No", "客户订单号", "客户PO号", "订单号"]
    },
    customerName: {
      type: "text",
      labels: ["Customer", "Customer Name", "Buyer", "Bill To", "Sold To", "Invoice To", "客户", "客户名称", "买方", "收票人"]
    },
    supplierName: {
      type: "text",
      labels: ["Supplier", "Supplier Name", "Seller", "Exporter", "Vendor", "卖方", "供应商", "供应商名称", "出口商"]
    },
    invoiceNo: {
      type: "text",
      labels: ["Invoice No", "Invoice No.", "Invoice Number", "Invoice #", "Commercial Invoice No", "发票号", "发票号码"]
    },
    invoiceDate: {
      type: "date",
      labels: ["Invoice Date", "Date", "发票日期", "开票日期", "日期"]
    },
    incoterms: {
      type: "incoterms",
      labels: ["Incoterms", "Inco Terms", "Trade Term", "Price Term", "成交方式", "贸易术语"]
    },
    paymentTerm: {
      type: "text",
      labels: ["Payment Term", "Payment Terms", "Terms of Payment", "Payment Method", "付款方式", "付款时间", "支付方式"]
    },
    currency: {
      type: "currency",
      labels: ["Currency", "Curr.", "币种", "货币"]
    },
    totalAmount: {
      type: "amount",
      labels: ["Total Amount", "Grand Total", "Total Value", "Order Value", "Contract Amount", "Amount Total", "合计金额", "总金额", "价税合计"]
    },
    productName: {
      type: "text",
      labels: ["Product", "Product Name", "Goods Description", "Description of Goods", "Commodity", "Item Description", "Material Description", "品名", "产品名称", "商品名称", "货物描述"]
    },
    officialEnglishName: {
      type: "text",
      labels: ["Official English Name", "Official English Product Name", "English Name", "英文品名", "官方英文品名"]
    },
    hsCode: {
      type: "hsCode",
      labels: ["HS Code", "H.S. Code", "HS编码", "HS CODE", "海关编码", "商品编码"]
    },
    casNo: {
      type: "casNo",
      labels: ["CAS No", "CAS NO.", "CAS Number", "CAS号", "CAS"]
    },
    quantity: {
      type: "number",
      labels: ["Quantity", "QTY", "Qty.", "Quantity Ordered", "Ordered Qty", "数量", "合同数量"]
    },
    unit: {
      type: "unit",
      labels: ["Unit", "UOM", "Unit of Measure", "单位"]
    },
    unitPrice: {
      type: "amount",
      labels: ["Unit Price", "Price/Unit", "Price Per Unit", "Unit Rate", "单价", "销售单价"]
    },
    productAmount: {
      type: "amount",
      labels: ["Product Amount", "Line Amount", "Line Total", "Amount", "商品金额", "销售金额", "金额"]
    },
    grossWeight: {
      type: "number",
      labels: ["Gross Weight", "G.W.", "GW", "G/W", "毛重"]
    },
    netWeight: {
      type: "number",
      labels: ["Net Weight", "N.W.", "NW", "N/W", "净重"]
    },
    volume: {
      type: "number",
      labels: ["Volume", "CBM", "Measurement", "体积", "尺码"]
    },
    packageCount: {
      type: "number",
      labels: ["Package Count", "Packages", "No. of Packages", "Packing", "件数", "包装件数", "箱数"]
    },
    portOfLoading: {
      type: "text",
      labels: ["POL", "Port of Loading", "Loading Port", "Port of Shipment", "起运港", "装运港"]
    },
    portOfDischarge: {
      type: "text",
      labels: ["POD", "Port of Discharge", "Discharge Port", "Port of Destination", "卸货港", "目的港"]
    },
    destinationPort: {
      type: "text",
      labels: ["Destination Port", "Final Destination", "Dest. Port", "Destination", "目的港", "目的地"]
    },
    etd: {
      type: "date",
      labels: ["ETD", "Estimated Time of Departure", "Sailing Date", "船期", "开船日期", "预计开船"]
    },
    eta: {
      type: "date",
      labels: ["ETA", "Estimated Time of Arrival", "Arrival Date", "到港时间", "预计到港"]
    },
    warehouseEntryTime: {
      type: "text",
      labels: ["Warehouse Entry Time", "Warehouse Entry", "入仓时间", "进仓时间"]
    },
    documentCutoffTime: {
      type: "text",
      labels: ["Document Cutoff", "Document Cut-off", "SI Cutoff", "SI Cut-off", "截单时间", "截关时间"]
    },
    vessel: {
      type: "text",
      labels: ["Vessel", "Vessel Name", "船名"]
    },
    voyage: {
      type: "text",
      labels: ["Voyage", "Voyage No", "航次"]
    },
    containerNo: {
      type: "containerNo",
      labels: ["Container No", "Container No.", "Container Number", "Cntr No", "箱号", "集装箱号"]
    },
    blNo: {
      type: "text",
      labels: ["B/L No", "B/L No.", "BL No", "BL NO.", "Bill of Lading No", "提单号"]
    },
    consignee: {
      type: "multilineText",
      labels: ["Consignee", "收货人"]
    },
    notifyParty: {
      type: "multilineText",
      labels: ["Notify Party", "Notify", "通知人", "通知方"]
    },
    insurancePolicyNo: {
      type: "text",
      labels: ["Insurance Policy No", "Policy No", "Policy Number", "保单号", "保险单号"]
    },
    insuredAmount: {
      type: "amount",
      labels: ["Insured Amount", "Insurance Amount", "Amount Insured", "保险金额", "投保金额"]
    },
    dhlNo: {
      type: "text",
      labels: ["DHL No", "DHL NO.", "DHL Number", "Courier No", "Tracking No", "DHL单号", "快递单号"]
    }
  });

  const EXACT_LABEL_CONFIDENCE = 0.9;
  const INFERRED_CONFIDENCE = 0.7;
  const WEAK_GUESS_CONFIDENCE = 0.45;
  const EXTRACTION_MODES = Object.freeze({
    local_rule_only: "local_rule_only",
    ocr_text_plus_rule: "ocr_text_plus_rule",
    vision_ai: "vision_ai",
    hybrid: "hybrid"
  });
  const LAYOUT_DEPENDENT_FIELDS = new Set([
    "quantity",
    "unit",
    "unitPrice",
    "productAmount",
    "totalAmount",
    "hsCode",
    "casNo",
    "incoterms",
    "paymentTerm",
    "portOfLoading",
    "portOfDischarge",
    "destinationPort"
  ]);

  function classifyDocumentType(text) {
    const normalized = normalizeDocumentText(text).toLowerCase();
    const compact = normalized.replace(/\s+/g, " ");

    if (/commercial\s+invoice|商业发票/.test(compact)) {
      return DOCUMENT_TYPES.commercial_invoice;
    }
    if (/packing\s+list|装箱单|箱单/.test(compact)) {
      return DOCUMENT_TYPES.packing_list;
    }
    if (/insurance\s+policy|保单|保险单/.test(compact)) {
      return DOCUMENT_TYPES.insurance_policy;
    }
    if (/certificate\s+of\s+origin|\bcoo\b|产地证|原产地证/.test(compact)) {
      return DOCUMENT_TYPES.certificate_of_origin;
    }
    if (/purchase\s+order|采购订单/.test(compact)) {
      return DOCUMENT_TYPES.purchase_order;
    }
    if (/sales\s+contract|销售合同/.test(compact)) {
      return DOCUMENT_TYPES.sales_contract;
    }
    if (/bill\s+of\s+lading|\bb\/l\b|\bbl\s+no\b|提单/.test(compact)) {
      return DOCUMENT_TYPES.bill_of_lading;
    }
    if (/purchase\s+order|\bpo\s+no\b|\bp\.?\s*o\.?\s+no\b|采购订单|客户订单/.test(compact)) {
      return DOCUMENT_TYPES.purchase_order;
    }
    if (/commercial\s+invoice|invoice\s+no|invoice\s+number|发票号|商业发票/.test(compact)) {
      return DOCUMENT_TYPES.commercial_invoice;
    }

    return DOCUMENT_TYPES.other;
  }

  function extractAutomationFields(text, options = {}) {
    return extractRuleAutomationFields(text, options);
  }

  function extractRuleAutomationFields(text, options = {}) {
    const normalizedText = normalizeDocumentText(text);
    const result = {
      documentType: classifyDocumentType(normalizedText),
      fields: {},
      lineItems: [],
      warnings: [],
      rawText: normalizedText,
      mode: options.mode || EXTRACTION_MODES.local_rule_only
    };

    if (!normalizedText) {
      result.warnings.push({
        code: "empty_text",
        message: "No document text is available for extraction."
      });
      return result;
    }

    Object.entries(FIELD_DEFINITIONS).forEach(([fieldKey, definition]) => {
      const match = extractByLabels(normalizedText, fieldKey, definition);
      if (match) {
        result.fields[fieldKey] = match;
      }
    });

    result.lineItems = extractLineItems(normalizedText);
    applyInferredFields(result, normalizedText);
    applyLineItemFallbacks(result);

    if (Object.keys(result.fields).length === 0) {
      result.warnings.push({
        code: "no_fields_detected",
        message: "No canonical trade fields were detected."
      });
    }

    return result;
  }

  function extractByLabels(text, fieldKey, definition) {
    const labels = definition.labels.slice().sort((first, second) => second.length - first.length);

    for (const label of labels) {
      const labelPattern = labelToPattern(label);
      const linePatterns = [
        new RegExp(`(?:^|[\\n|;,，；])\\s*${labelPattern}\\s*(?:[:：#]|\\||-|–|—)\\s*([^\\n|;,，；]{1,220})`, "i"),
        new RegExp(`(?:^|[\\n|;,，；])\\s*${labelPattern}\\s{2,}([^\\n|;,，；]{1,220})`, "i"),
        new RegExp(`(?:^|[\\n|;,，；])\\s*${labelPattern}\\s*(?:[:：#]|\\||-|–|—)?\\s*\\n\\s*([^\\n]{1,220})`, "i"),
        new RegExp(`${labelPattern}\\s*(?:[:：#]|\\||-|–|—)\\s*([^\\n|;,，；]{1,220})`, "i")
      ];

      for (const pattern of linePatterns) {
        const match = text.match(pattern);
        if (!match?.[1]) {
          continue;
        }

        const sourceText = normalizeText(match[0]);
        const value = normalizeFieldValue(cleanExtractedValue(match[1], fieldKey), definition);
        if (value && !looksLikeKnownLabel(value, fieldKey)) {
          return {
            value,
            confidence: EXACT_LABEL_CONFIDENCE,
            sourceText,
            evidence: sourceText,
            pageNo: null,
            method: "rule",
            sourceRule: `label:${label}`
          };
        }
      }
    }

    return null;
  }

  function applyInferredFields(result, text) {
    inferCurrency(result, text);
    inferIncoterms(result, text);
    inferScNo(result, text);
    inferCasNo(result, text);
    inferHsCode(result, text);
    inferContainerNo(result, text);
    inferQuantityAndUnit(result, text);
    inferTotalAmount(result, text);
    inferDates(result, text);
    inferCompanyNames(result, text);
  }

  function inferCurrency(result, text) {
    if (result.fields.currency) {
      return;
    }

    const match = text.match(/\b(USD|US\$|EUR|CNY|RMB|JPY|GBP|INR)\b|\$/i);
    if (match) {
      addInferredField(result, "currency", normalizeCurrency(match[1] || match[0]), match[0], "currency-token", INFERRED_CONFIDENCE);
    }
  }

  function inferIncoterms(result, text) {
    if (result.fields.incoterms) {
      return;
    }

    const match = text.match(/\b(EXW|FOB|CFR|CNF|CIF|DAP|DDP|FCA|CPT|CIP)\b/i);
    if (match) {
      addInferredField(result, "incoterms", match[1].toUpperCase(), match[0], "incoterms-token", INFERRED_CONFIDENCE);
    }
  }

  function inferScNo(result, text) {
    if (result.fields.scNo) {
      return;
    }

    const match = text.match(/\b(?:YS|DC|YSDC)-[A-Z0-9]{2,10}\d{6,8}\b/i);
    if (match) {
      addInferredField(result, "scNo", match[0].toUpperCase(), match[0], "sc-pattern", INFERRED_CONFIDENCE);
    }
  }

  function inferCasNo(result, text) {
    if (result.fields.casNo) {
      return;
    }

    const match = text.match(/\b\d{2,7}-\d{2}-\d\b/);
    if (match) {
      addInferredField(result, "casNo", match[0], match[0], "cas-pattern", INFERRED_CONFIDENCE);
    }
  }

  function inferHsCode(result, text) {
    if (result.fields.hsCode) {
      return;
    }

    const match = text.match(/\b\d{4}\.\d{2}(?:\.\d{2})?(?:\.\d{2})?\b|\b\d{8,10}\b/);
    if (match) {
      addInferredField(result, "hsCode", match[0], match[0], "hs-pattern", WEAK_GUESS_CONFIDENCE);
    }
  }

  function inferContainerNo(result, text) {
    if (result.fields.containerNo) {
      return;
    }

    const match = text.match(/\b[A-Z]{4}\d{7}\b/i);
    if (match) {
      addInferredField(result, "containerNo", match[0].toUpperCase(), match[0], "container-pattern", INFERRED_CONFIDENCE);
    }
  }

  function inferQuantityAndUnit(result, text) {
    if (result.fields.quantity && result.fields.unit) {
      return;
    }

    const match = text.match(/\b([\d,]+(?:\.\d+)?)\s*(KGS?|KG|KILOGRAMS?|MT|MTS|TONS?|PCS?|PIECES?|千克|吨|件)\b/i);
    if (!match) {
      return;
    }

    if (!result.fields.quantity) {
      addInferredField(result, "quantity", normalizeNumber(match[1]), match[0], "quantity-unit-pattern", INFERRED_CONFIDENCE);
    }
    if (!result.fields.unit) {
      addInferredField(result, "unit", normalizeUnit(match[2]), match[0], "quantity-unit-pattern", INFERRED_CONFIDENCE);
    }
  }

  function inferTotalAmount(result, text) {
    if (result.fields.totalAmount) {
      return;
    }

    const match = text.match(/(?:USD|US\$|\$|CNY|RMB|EUR)\s*([\d,]+(?:\.\d{1,4})?)\s*(?:TOTAL|GRAND\s+TOTAL|AMOUNT)?/i)
      || text.match(/(?:TOTAL|GRAND\s+TOTAL|合计|总金额)[^0-9]{0,40}([\d,]+(?:\.\d{1,4})?)/i);
    if (match?.[1]) {
      addInferredField(result, "totalAmount", normalizeAmount(match[1]), match[0], "amount-pattern", INFERRED_CONFIDENCE);
    }
  }

  function inferDates(result, text) {
    if (!result.fields.invoiceDate && result.documentType === DOCUMENT_TYPES.commercial_invoice) {
      const invoiceDate = extractNearbyDate(text, /(?:invoice\s+date|date|发票日期|日期)/i);
      if (invoiceDate) {
        addInferredField(result, "invoiceDate", invoiceDate.value, invoiceDate.sourceText, "nearby-date", INFERRED_CONFIDENCE);
      }
    }

    if (!result.fields.etd) {
      const etd = extractNearbyDate(text, /(?:etd|sailing\s+date|船期|开船日期)/i);
      if (etd) {
        addInferredField(result, "etd", etd.value, etd.sourceText, "nearby-date", INFERRED_CONFIDENCE);
      }
    }

    if (!result.fields.eta) {
      const eta = extractNearbyDate(text, /(?:eta|arrival\s+date|到港时间|预计到港)/i);
      if (eta) {
        addInferredField(result, "eta", eta.value, eta.sourceText, "nearby-date", INFERRED_CONFIDENCE);
      }
    }
  }

  function inferCompanyNames(result, text) {
    if (!result.fields.supplierName) {
      const seller = extractCompanyNearLabel(text, /^(?:seller|supplier|exporter|卖方|供应商|出口商)\b/i);
      if (seller) {
        addInferredField(result, "supplierName", seller.value, seller.sourceText, "nearby-company", INFERRED_CONFIDENCE);
      }
    }

    if (!result.fields.customerName) {
      const buyer = extractCompanyNearLabel(text, /^(?:buyer|customer|consignee|importer|买方|客户|收货人)\b/i);
      if (buyer) {
        addInferredField(result, "customerName", buyer.value, buyer.sourceText, "nearby-company", INFERRED_CONFIDENCE);
      }
    }
  }

  function applyLineItemFallbacks(result) {
    const firstItem = result.lineItems[0];
    if (!firstItem) {
      return;
    }

    if (!result.fields.productName && firstItem.productName) {
      addInferredField(result, "productName", firstItem.productName, firstItem.sourceText, "line-item", WEAK_GUESS_CONFIDENCE);
    }
    if (!result.fields.quantity && firstItem.quantity) {
      addInferredField(result, "quantity", firstItem.quantity, firstItem.sourceText, "line-item", WEAK_GUESS_CONFIDENCE);
    }
    if (!result.fields.unit && firstItem.unit) {
      addInferredField(result, "unit", firstItem.unit, firstItem.sourceText, "line-item", WEAK_GUESS_CONFIDENCE);
    }
    if (!result.fields.unitPrice && firstItem.unitPrice) {
      addInferredField(result, "unitPrice", firstItem.unitPrice, firstItem.sourceText, "line-item", WEAK_GUESS_CONFIDENCE);
    }
    if (!result.fields.productAmount && firstItem.amount) {
      addInferredField(result, "productAmount", firstItem.amount, firstItem.sourceText, "line-item", WEAK_GUESS_CONFIDENCE);
    }
  }

  function addInferredField(result, fieldKey, value, sourceText, method, confidence) {
    if (!value || result.fields[fieldKey]) {
      return;
    }

    result.fields[fieldKey] = {
      value,
      confidence,
      sourceText: normalizeText(sourceText),
      evidence: normalizeText(sourceText),
      pageNo: null,
      method: "rule",
      sourceRule: method
    };
  }

  function extractLineItems(text) {
    return text
      .split("\n")
      .map((line) => normalizeText(line))
      .filter(Boolean)
      .reduce((items, line) => {
        const match = line.match(/^(.{2,90}?)\s+([\d,]+(?:\.\d+)?)\s*(KGS?|KG|KILOGRAMS?|MT|MTS|TONS?|PCS?|PIECES?)\s+(?:USD|US\$|\$|CNY|RMB|EUR)?\s*([\d,]+(?:\.\d{1,6})?)\s+(?:USD|US\$|\$|CNY|RMB|EUR)?\s*([\d,]+(?:\.\d{1,4})?)$/i);
        if (!match) {
          return items;
        }

        const productName = cleanLineItemProductName(match[1]);
        if (!productName) {
          return items;
        }

        items.push({
          productName,
          quantity: normalizeNumber(match[2]),
          unit: normalizeUnit(match[3]),
          unitPrice: normalizeAmount(match[4]),
          amount: normalizeAmount(match[5]),
          sourceText: line
        });
        return items;
      }, []);
  }

  function cleanLineItemProductName(value) {
    const cleaned = normalizeText(value).replace(/^\d+\s*[.)-]?\s*/, "");
    if (/^(description|product|item|品名|产品)$/i.test(cleaned)) {
      return "";
    }
    return cleaned;
  }

  function extractNearbyDate(text, labelPattern) {
    const lines = text.split("\n").map((line) => normalizeText(line));
    for (let index = 0; index < lines.length; index += 1) {
      if (!labelPattern.test(lines[index])) {
        continue;
      }

      const candidates = [lines[index], lines[index + 1] || ""];
      for (const candidate of candidates) {
        const value = normalizeDate(candidate);
        if (value) {
          return {
            value,
            sourceText: candidate
          };
        }
      }
    }
    return null;
  }

  function extractCompanyNearLabel(text, labelPattern) {
    const lines = text.split("\n").map((line) => normalizeText(line)).filter(Boolean);
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (!labelPattern.test(line)) {
        continue;
      }

      const sameLine = cleanExtractedValue(line.replace(labelPattern, ""), "customerName");
      if (isLikelyCompanyName(sameLine)) {
        return {
          value: sameLine,
          sourceText: line
        };
      }

      const nearby = lines.slice(index + 1, index + 4).find(isLikelyCompanyName);
      if (nearby) {
        return {
          value: nearby,
          sourceText: nearby
        };
      }
    }
    return null;
  }

  function isLikelyCompanyName(value) {
    const text = normalizeText(value);
    return text.length >= 4
      && text.length <= 140
      && !looksLikeKnownLabel(text)
      && /\b(?:ltd|limited|llc|inc|corp|corporation|company|co\.?|gmbh|s\.a\.|pvt|pharma|chemical|chemicals|trading|industry|industries)\b/i.test(text);
  }

  function normalizeFieldValue(value, definition) {
    if (definition.type === "amount") {
      return normalizeAmount(value);
    }
    if (definition.type === "number") {
      return normalizeNumber(value);
    }
    if (definition.type === "date") {
      return normalizeDate(value);
    }
    if (definition.type === "currency") {
      return normalizeCurrency(value);
    }
    if (definition.type === "unit") {
      return normalizeUnit(value);
    }
    if (definition.type === "incoterms") {
      const match = String(value || "").match(/\b(EXW|FOB|CFR|CNF|CIF|DAP|DDP|FCA|CPT|CIP)\b/i);
      return match ? match[1].toUpperCase() : cleanExtractedValue(value);
    }
    if (definition.type === "hsCode") {
      const match = String(value || "").match(/\b\d{4}\.\d{2}(?:\.\d{2})?(?:\.\d{2})?\b|\b\d{6,10}\b/);
      return match ? match[0] : cleanExtractedValue(value);
    }
    if (definition.type === "casNo") {
      const match = String(value || "").match(/\b\d{2,7}-\d{2}-\d\b/);
      return match ? match[0] : cleanExtractedValue(value);
    }
    if (definition.type === "containerNo") {
      const match = String(value || "").match(/\b[A-Z]{4}\d{7}\b/i);
      return match ? match[0].toUpperCase() : cleanExtractedValue(value).toUpperCase();
    }

    return cleanExtractedValue(value);
  }

  function normalizeAmount(value) {
    const text = String(value || "").replace(/,/g, "");
    const match = text.match(/[-+]?\d+(?:\.\d+)?/);
    if (!match) {
      return "";
    }
    return trimPlainNumber(match[0]);
  }

  function normalizeNumber(value) {
    const text = String(value || "").replace(/,/g, "");
    const match = text.match(/[-+]?\d+(?:\.\d+)?/);
    if (!match) {
      return "";
    }
    return trimPlainNumber(match[0]);
  }

  function normalizeDate(value) {
    const text = String(value || "").trim();
    const isoMatch = text.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日)?/);
    if (isoMatch) {
      return formatDateParts(isoMatch[1], isoMatch[2], isoMatch[3]);
    }

    const dayFirstMatch = text.match(/\b(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})\b/);
    if (dayFirstMatch) {
      return formatDateParts(dayFirstMatch[3], dayFirstMatch[2], dayFirstMatch[1]);
    }

    const monthNameMatch = text.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i);
    if (monthNameMatch) {
      const monthMap = {
        jan: 1,
        feb: 2,
        mar: 3,
        apr: 4,
        may: 5,
        jun: 6,
        jul: 7,
        aug: 8,
        sep: 9,
        sept: 9,
        oct: 10,
        nov: 11,
        dec: 12
      };
      const month = monthMap[monthNameMatch[1].toLowerCase()];
      return formatDateParts(monthNameMatch[3], month, monthNameMatch[2]);
    }

    return "";
  }

  function normalizeCurrency(value) {
    const match = String(value || "").match(/\b(USD|US\$|EUR|CNY|RMB|JPY|GBP|INR)\b|\$/i);
    if (!match) {
      return "";
    }

    const currency = (match[1] || match[0]).toUpperCase();
    if (currency === "US$" || currency === "$") {
      return "USD";
    }
    if (currency === "RMB") {
      return "CNY";
    }
    return currency;
  }

  function normalizeUnit(value) {
    const unit = String(value || "").trim().toUpperCase();
    if (/^(KG|KGS|KILOGRAM|KILOGRAMS|千克)$/.test(unit)) {
      return "KGS";
    }
    if (/^(MT|MTS|TON|TONS|吨)$/.test(unit)) {
      return "MTS";
    }
    if (/^(PC|PCS|PIECE|PIECES|件)$/.test(unit)) {
      return "PCS";
    }
    return unit;
  }

  function formatDateParts(year, month, day) {
    const numericYear = Number(year);
    const numericMonth = Number(month);
    const numericDay = Number(day);
    if (!Number.isInteger(numericYear) || !Number.isInteger(numericMonth) || !Number.isInteger(numericDay)) {
      return "";
    }
    if (numericYear < 1900 || numericYear > 2200 || numericMonth < 1 || numericMonth > 12 || numericDay < 1 || numericDay > 31) {
      return "";
    }
    return `${String(numericYear).padStart(4, "0")}-${String(numericMonth).padStart(2, "0")}-${String(numericDay).padStart(2, "0")}`;
  }

  function trimPlainNumber(value) {
    if (!String(value).includes(".")) {
      return String(value);
    }
    return String(value).replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
  }

  function normalizeDocumentText(text) {
    return String(text || "")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\s*\|\s*/g, " | ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function cleanExtractedValue(value, currentFieldKey = "") {
    const currentLabels = currentFieldKey && FIELD_DEFINITIONS[currentFieldKey]
      ? FIELD_DEFINITIONS[currentFieldKey].labels
      : [];
    const cleaned = normalizeText(String(value || "")
      .replace(/^[：:#|\-–—\s]+/, "")
      .replace(/\s*(?:\||;|；|,|，)\s*$/, ""));
    return trimAtNextKnownLabel(cleaned, currentLabels);
  }

  function trimAtNextKnownLabel(value, currentLabels) {
    const aliases = getAllAliases()
      .filter((alias) => !currentLabels.includes(alias))
      .sort((first, second) => second.length - first.length);

    for (const alias of aliases) {
      const pattern = new RegExp(`\\s+(?:${labelToPattern(alias)})\\s*(?:[:：#]|\\||-|–|—)`, "i");
      const match = value.match(pattern);
      if (match && match.index > 0) {
        return value.slice(0, match.index).trim();
      }
    }

    return value;
  }

  function looksLikeKnownLabel(value, currentFieldKey = "") {
    const text = normalizeText(value).replace(/[：:]+$/, "");
    if (!text || text.length > 80) {
      return false;
    }

    return getAllAliases().some((alias) => {
      if (currentFieldKey && FIELD_DEFINITIONS[currentFieldKey]?.labels.includes(alias)) {
        return false;
      }
      return normalizeText(alias).toLowerCase() === text.toLowerCase();
    });
  }

  function getAllAliases() {
    if (!getAllAliases.cache) {
      getAllAliases.cache = Object.values(FIELD_DEFINITIONS).flatMap((definition) => definition.labels);
    }
    return getAllAliases.cache;
  }

  function labelToPattern(label) {
    return escapeRegExp(label).replace(/\s+/g, "\\s*");
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function getDefaultExtractionMode(options = {}) {
    if (options.mode) {
      return options.mode;
    }
    if (global.CrmVisionExtractionProvider?.isConfigured?.()) {
      return EXTRACTION_MODES.hybrid;
    }
    return EXTRACTION_MODES.local_rule_only;
  }

  async function extractAutomationFieldsAsync(input, options = {}) {
    const text = typeof input === "string" ? input : input?.text || "";
    const pageImages = Array.isArray(input?.pageImages) ? input.pageImages : [];
    const mode = getDefaultExtractionMode(options);
    const ruleResult = extractRuleAutomationFields(text, {
      ...options,
      mode: mode === EXTRACTION_MODES.ocr_text_plus_rule ? EXTRACTION_MODES.ocr_text_plus_rule : EXTRACTION_MODES.local_rule_only
    });

    if (mode === EXTRACTION_MODES.local_rule_only || mode === EXTRACTION_MODES.ocr_text_plus_rule) {
      return {
        ...ruleResult,
        mode,
        ruleResult: cloneExtractionResultForDebug(ruleResult)
      };
    }

    if (!global.CrmVisionExtractionProvider?.isConfigured?.()) {
      return {
        ...ruleResult,
        mode: EXTRACTION_MODES.local_rule_only,
        ruleResult: cloneExtractionResultForDebug(ruleResult),
        warnings: [
          ...(ruleResult.warnings || []),
          {
            code: "vision_ai_not_configured",
            message: "Vision AI extraction is disabled or not configured; local rule extraction was used."
          }
        ]
      };
    }

    let visionResult = null;
    try {
      visionResult = await global.CrmVisionExtractionProvider.extractFromPageImages(pageImages, text, options.visionConfig);
    } catch (error) {
      return {
        ...ruleResult,
        mode: EXTRACTION_MODES.local_rule_only,
        ruleResult: cloneExtractionResultForDebug(ruleResult),
        aiResult: {
          error: error.message || String(error)
        },
        warnings: [
          ...(ruleResult.warnings || []),
          {
            code: "vision_ai_failed",
            message: error.message || "Vision AI extraction failed; local rule extraction was used."
          }
        ]
      };
    }

    if (mode === EXTRACTION_MODES.vision_ai) {
      return {
        ...visionResult,
        rawText: normalizeDocumentText(text),
        lineItems: visionResult.lineItems || [],
        mode,
        ruleResult: cloneExtractionResultForDebug(ruleResult),
        aiResult: cloneExtractionResultForDebug(visionResult)
      };
    }

    return mergeExtractionResults(ruleResult, visionResult, {
      mode,
      rawText: normalizeDocumentText(text)
    });
  }

  function mergeExtractionResults(ruleResult, visionResult, options = {}) {
    const merged = {
      documentType: visionResult?.documentType || ruleResult?.documentType || DOCUMENT_TYPES.other,
      fields: {},
      lineItems: Array.isArray(visionResult?.lineItems) && visionResult.lineItems.length
        ? visionResult.lineItems
        : ruleResult?.lineItems || [],
      warnings: [
        ...(ruleResult?.warnings || []),
        ...(visionResult?.warnings || [])
      ],
      rawText: options.rawText || ruleResult?.rawText || "",
      mode: options.mode || EXTRACTION_MODES.hybrid,
      ruleResult: cloneExtractionResultForDebug(ruleResult),
      aiResult: cloneExtractionResultForDebug(visionResult)
    };

    const fieldKeys = new Set([
      ...Object.keys(ruleResult?.fields || {}),
      ...Object.keys(visionResult?.fields || {})
    ]);

    fieldKeys.forEach((fieldKey) => {
      const ruleField = ruleResult?.fields?.[fieldKey];
      const visionField = visionResult?.fields?.[fieldKey];
      const chosen = chooseMergedField(fieldKey, ruleField, visionField);
      if (!chosen) {
        return;
      }

      const field = { ...chosen };
      if (ruleField && visionField && valuesConflict(fieldKey, ruleField.value, visionField.value)) {
        field.conflict = true;
        field.ruleValue = ruleField.value;
        field.visionValue = visionField.value;
        field.confidence = Math.min(Number(field.confidence) || 0, 0.75);
        merged.warnings.push({
          code: "ai_rule_conflict",
          fieldKey,
          severity: "warning",
          reviewRequired: true,
          message: `${fieldKey} differs between local rules and vision AI.`
        });
      }
      merged.fields[fieldKey] = field;
    });

    return merged;
  }

  function chooseMergedField(fieldKey, ruleField, visionField) {
    if (!ruleField) {
      return visionField ? { ...visionField, method: visionField.method || "vision_ai" } : null;
    }
    if (!visionField) {
      return { ...ruleField, method: ruleField.method || "rule" };
    }

    const ruleConfidence = Number(ruleField.confidence) || 0;
    const visionConfidence = Number(visionField.confidence) || 0;
    if (LAYOUT_DEPENDENT_FIELDS.has(fieldKey) && visionConfidence >= 0.55) {
      return { ...visionField, method: visionField.method || "vision_ai" };
    }
    return visionConfidence > ruleConfidence
      ? { ...visionField, method: visionField.method || "vision_ai" }
      : { ...ruleField, method: ruleField.method || "rule" };
  }

  function valuesConflict(fieldKey, firstValue, secondValue) {
    const first = normalizeComparableValue(fieldKey, firstValue);
    const second = normalizeComparableValue(fieldKey, secondValue);
    return Boolean(first && second && first !== second);
  }

  function normalizeComparableValue(fieldKey, value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    if (["totalAmount", "quantity", "unitPrice", "productAmount", "grossWeight", "netWeight", "volume", "insuredAmount"].includes(fieldKey)) {
      return normalizeNumber(text);
    }
    if (["etd", "eta", "invoiceDate"].includes(fieldKey)) {
      return normalizeDate(text) || text.toLowerCase();
    }
    if (fieldKey === "currency") {
      return normalizeCurrency(text);
    }
    return normalizeText(text).toLowerCase();
  }

  function cloneExtractionResultForDebug(result) {
    if (!result) {
      return null;
    }
    return JSON.parse(JSON.stringify(result));
  }

  global.CrmAutomationExtractor = Object.freeze({
    EXTRACTION_MODES,
    classifyDocumentType,
    extractAutomationFields,
    extractAutomationFieldsAsync,
    extractRuleAutomationFields,
    getDefaultExtractionMode,
    mergeExtractionResults,
    normalizeAmount,
    normalizeDate,
    normalizeNumber
  });
})(typeof window !== "undefined" ? window : globalThis);
