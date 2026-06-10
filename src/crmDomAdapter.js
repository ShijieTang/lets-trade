/**
 * CRM DOM scanner and form-filling adapter.
 */
(function initializeCrmDomAdapter() {
  const FIELD_ALIASES = {
    signingDate: ["签订日期", "合同日期", "date", "signing date"],
    customerOrderNo: ["客户订单号", "客户单号", "po no", "purchase order", "order no"],
    customer: ["客户", "买方", "buyer", "customer", "importer"],
    supplier: ["供应商", "卖方", "seller", "supplier", "exporter"],
    productName: ["商品", "品名", "产品名称", "description", "product", "goods"],
    hsCode: ["hs code", "hsn code", "海关编码", "税则号"],
    casNo: ["cas", "cas no", "cas号"],
    quantity: ["数量", "quantity", "qty"],
    unit: ["单位", "unit", "uom"],
    unitPrice: ["单价", "unit price", "price"],
    currency: ["币种", "currency"],
    totalAmount: ["总金额", "合同总金额", "amount", "total"],
    contractTotalAmount: ["合同总金额", "合同金额", "total amount", "contract amount"],
    paymentTerm: ["付款", "付款方式", "付款方法", "payment", "payment term"],
    paymentMethod: ["付款", "付款方式", "付款方法", "payment", "payment method"],
    incoterm: ["成交方式", "贸易术语", "incoterm", "trade term"],
    destinationPort: ["目的港", "卸货港", "destination port", "port of discharge", "pod"],
    portOfLoading: ["装运港", "起运港", "loading port", "port of loading", "pol"],
    transportMode: ["运输方式", "transport", "shipment"],
    remarks: ["备注", "remarks", "notes"]
  };

  function scanVisibleFields(root = document) {
    return Array.from(root.querySelectorAll("input, select, textarea"))
      .filter(isFillable)
      .map((element) => ({
        labelText: getFieldLabelText(element),
        name: element.getAttribute("name") || "",
        id: element.id || "",
        placeholder: element.getAttribute("placeholder") || "",
        element
      }))
      .filter((field) => field.labelText || field.name || field.id || field.placeholder);
  }

  function matchFields(extractedData = {}, mappings = {}) {
    const visibleFields = scanVisibleFields();
    const canonicalFields = flattenExtractedFields(extractedData);
    const matches = [];
    const usedElements = new Set();

    Object.entries(canonicalFields).forEach(([key, field]) => {
      if (!field?.value) {
        return;
      }

      const mappedSelector = mappings[key] || mappings[field.crmKey] || "";
      const mappedElement = mappedSelector ? findMappedElement(mappedSelector) : null;
      const target = mappedElement && isFillable(mappedElement)
        ? { field: buildVisibleField(mappedElement), score: 1, source: "saved_mapping" }
        : findBestFieldMatch(key, field, visibleFields, usedElements);

      if (!target?.field?.element) {
        matches.push({
          key,
          value: field.value,
          field,
          element: null,
          status: "unmatched",
          score: 0,
          source: "none"
        });
        return;
      }

      usedElements.add(target.field.element);
      matches.push({
        key,
        value: field.value,
        field,
        element: target.field.element,
        labelText: target.field.labelText,
        name: target.field.name,
        id: target.field.id,
        placeholder: target.field.placeholder,
        selector: getStableSelector(target.field.element),
        status: "matched",
        score: target.score,
        source: target.source
      });
    });

    return matches;
  }

  function fillFields(matches = []) {
    const results = [];
    matches.forEach((match) => {
      if (!match?.element || match.status === "skipped") {
        results.push({ ...summarizeMatch(match), status: "skipped" });
        return;
      }

      try {
        setElementValue(match.element, match.value);
        results.push({ ...summarizeMatch(match), status: "filled" });
      } catch (error) {
        results.push({ ...summarizeMatch(match), status: "error", error: error.message || String(error) });
      }
    });
    return results;
  }

  function findBestFieldMatch(key, field, visibleFields, usedElements) {
    const aliases = new Set([key, field.crmKey, ...(FIELD_ALIASES[key] || []), ...(FIELD_ALIASES[field.crmKey] || [])].filter(Boolean).map(normalizeToken));
    let best = null;

    visibleFields.forEach((visibleField) => {
      if (usedElements.has(visibleField.element)) {
        return;
      }

      const haystack = normalizeToken([
        visibleField.labelText,
        visibleField.name,
        visibleField.id,
        visibleField.placeholder
      ].join(" "));
      if (!haystack) {
        return;
      }

      let score = 0;
      aliases.forEach((alias) => {
        if (!alias) {
          return;
        }
        if (haystack === alias) {
          score = Math.max(score, 0.98);
        } else if (haystack.includes(alias) || alias.includes(haystack)) {
          score = Math.max(score, Math.min(0.9, alias.length / Math.max(haystack.length, 1) + 0.35));
        }
      });

      const proximityScore = getLabelProximityScore(key, visibleField.element);
      score = Math.max(score, proximityScore);

      if (score > 0.42 && (!best || score > best.score)) {
        best = { field: visibleField, score, source: proximityScore === score ? "label_proximity" : "label_text" };
      }
    });

    return best;
  }

  function flattenExtractedFields(extractedData) {
    const flattened = {};
    const addField = (key, field, crmKey = key) => {
      const value = field?.value ?? field;
      if (value == null || String(value).trim() === "") {
        return;
      }
      flattened[crmKey] = {
        ...(typeof field === "object" && field ? field : {}),
        value: String(value).trim(),
        crmKey,
        sourceKey: key
      };
    };

    Object.entries(extractedData.crmFields || {}).forEach(([key, field]) => addField(key, field, key));
    Object.entries(extractedData.tradeFields || {}).forEach(([key, field]) => addField(key, field, key));
    Object.entries(extractedData.fields || {}).forEach(([key, field]) => addField(key, field, key));
    return flattened;
  }

  function setElementValue(element, value) {
    element.focus();
    element.dispatchEvent(new FocusEvent("focus", { bubbles: true }));

    if (element instanceof HTMLSelectElement) {
      setSelectValue(element, value);
    } else {
      const prototype = element instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");
      if (descriptor?.set) {
        descriptor.set.call(element, String(value));
      } else {
        element.value = String(value);
      }
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new FocusEvent("blur", { bubbles: true }));
    element.blur();
  }

  function setSelectValue(select, value) {
    const wanted = normalizeToken(value);
    const option = Array.from(select.options).find((candidate) => {
      return normalizeToken(candidate.value) === wanted || normalizeToken(candidate.textContent) === wanted || normalizeToken(candidate.textContent).includes(wanted);
    });
    select.value = option ? option.value : String(value);
  }

  function getFieldLabelText(element) {
    const labels = [];
    if (element.id) {
      labels.push(...Array.from(document.querySelectorAll(`label[for="${cssEscape(element.id)}"]`)).map((label) => label.textContent));
    }
    if (element.labels) {
      labels.push(...Array.from(element.labels).map((label) => label.textContent));
    }

    const labelContainers = [
      element.closest(".el-form-item"),
      element.closest(".ant-form-item"),
      element.closest(".ivu-form-item"),
      element.closest("[class*='form-item']"),
      element.closest("tr"),
      element.parentElement
    ].filter(Boolean);

    labelContainers.forEach((container) => {
      const label = container.querySelector("label, .el-form-item__label, .ant-form-item-label, .ivu-form-item-label, th");
      if (label) {
        labels.push(label.textContent);
      }
    });

    return normalizeText(labels.filter(Boolean).join(" "));
  }

  function getLabelProximityScore(key, element) {
    const aliases = FIELD_ALIASES[key] || [];
    let sibling = element.previousElementSibling;
    for (let distance = 0; sibling && distance < 3; distance += 1) {
      const text = normalizeToken(sibling.textContent);
      if (aliases.some((alias) => text.includes(normalizeToken(alias)))) {
        return 0.72 - distance * 0.1;
      }
      sibling = sibling.previousElementSibling;
    }
    return 0;
  }

  function findMappedElement(selector) {
    try {
      return document.querySelector(selector);
    } catch (error) {
      return null;
    }
  }

  function buildVisibleField(element) {
    return {
      labelText: getFieldLabelText(element),
      name: element.getAttribute("name") || "",
      id: element.id || "",
      placeholder: element.getAttribute("placeholder") || "",
      element
    };
  }

  function getStableSelector(element) {
    if (element.id) {
      return `#${cssEscape(element.id)}`;
    }
    const name = element.getAttribute("name");
    if (name) {
      return `${element.tagName.toLowerCase()}[name="${cssEscape(name)}"]`;
    }
    const placeholder = element.getAttribute("placeholder");
    if (placeholder) {
      return `${element.tagName.toLowerCase()}[placeholder="${cssEscape(placeholder)}"]`;
    }
    return element.tagName.toLowerCase();
  }

  function summarizeMatch(match) {
    return {
      key: match?.key || "",
      value: match?.value || "",
      labelText: match?.labelText || "",
      name: match?.name || "",
      id: match?.id || "",
      selector: match?.selector || ""
    };
  }

  function isFillable(element) {
    if (!(element instanceof HTMLInputElement || element instanceof HTMLSelectElement || element instanceof HTMLTextAreaElement)) {
      return false;
    }
    if (element instanceof HTMLInputElement && ["hidden", "file", "button", "submit", "reset", "checkbox", "radio"].includes(element.type)) {
      return false;
    }
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden" && !element.disabled && !element.readOnly;
  }

  function cssEscape(value) {
    if (window.CSS?.escape) {
      return window.CSS.escape(String(value));
    }
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function normalizeToken(value) {
    return normalizeText(value).toLowerCase().replace(/[：:()[\]{}_\-./\\]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  window.CrmDomAdapter = {
    FIELD_ALIASES,
    scanVisibleFields,
    matchFields,
    fillFields,
    getStableSelector
  };
})();
