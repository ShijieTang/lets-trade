(function initializeCrmDomAdapter(global) {
  "use strict";

  const DEBUG = false;
  const SIDEBAR_ID = "crm-workbench-sidebar-host";
  const Schema = global.CrmAutomationSchema || {};
  const FIELD_LABELS = Schema.FIELD_LABELS || { zh: {}, en: {} };
  const DEFAULT_MAPPING = Schema.DEFAULT_CRM_FIELD_MAPPING || {};

  const CONTROL_SELECTOR = [
    "input:not([type='hidden'])",
    "textarea",
    "select",
    "[contenteditable='true']",
    "[role='textbox']",
    "[role='combobox']",
    ".el-select",
    ".ant-select",
    ".ivu-select",
    "[class*='select']"
  ].join(",");

  function findCrmField(fieldKey, mapping = {}) {
    return findCrmFieldInDocuments(fieldKey, mapping, getSearchableDocuments());
  }

  async function fillCrmFields(fields, mapping = {}, options = {}) {
    const entries = normalizeFieldEntries(fields);
    if (options.waitForStableDom !== false) {
      await waitForStableDom(document.body, { timeout: 1500, stableMs: 120 }).catch(() => {});
    }
    const documents = options.includeFrames === false
      ? [{ doc: document, frameSelector: "", frameElement: null }]
      : getSearchableDocuments();
    const result = {
      filled: [],
      skipped: [],
      errors: []
    };

    for (const entry of entries) {
      if (!entry.value) {
        result.skipped.push({
          fieldKey: entry.fieldKey,
          value: entry.value,
          reason: "empty value"
        });
        continue;
      }

      try {
        const found = findCrmFieldInDocuments(entry.fieldKey, mapping, documents);
        if (!found?.element) {
          result.skipped.push({
            fieldKey: entry.fieldKey,
            value: entry.value,
            reason: "CRM field not found"
          });
          continue;
        }

        if (options.skipHidden !== false && !isVisible(found.element)) {
          result.skipped.push({
            fieldKey: entry.fieldKey,
            value: entry.value,
            reason: "field is hidden"
          });
          continue;
        }

        if (isDisabled(found.element) || isReadonly(found.element)) {
          result.skipped.push({
            fieldKey: entry.fieldKey,
            value: entry.value,
            reason: "field is disabled or read-only"
          });
          continue;
        }

        const ok = await setCrmFieldValue(found.element, entry.value);
        if (ok) {
          result.filled.push({
            fieldKey: entry.fieldKey,
            value: entry.value,
            selectorUsed: found.selectorUsed || getSelectorCandidate(found.element, found.documentInfo)
          });
        } else {
          result.skipped.push({
            fieldKey: entry.fieldKey,
            value: entry.value,
            reason: "field rejected value"
          });
        }
      } catch (error) {
        result.errors.push({
          fieldKey: entry.fieldKey,
          error: error.message || String(error)
        });
      }
    }

    return result;
  }

  async function setCrmFieldValue(element, value) {
    if (!element) {
      return false;
    }

    if (isCustomSelectElement(element)) {
      return setCustomSelectValue(element, value);
    }

    const target = resolveSettableElement(element);
    if (!target || isDisabled(target) || isReadonly(target) || !isVisible(target)) {
      return false;
    }

    if (target instanceof HTMLSelectElement) {
      return setNativeSelectValue(target, value);
    }

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      setNativeTextValue(target, value);
      return normalizeComparableText(target.value) === normalizeComparableText(value)
        || normalizeComparableText(target.value).includes(normalizeComparableText(value));
    }

    if (target.isContentEditable || target.getAttribute("role") === "textbox") {
      setContentEditableValue(target, value);
      return true;
    }

    return setCustomSelectValue(target, value);
  }

  function scanVisibleCrmFields() {
    return getSearchableDocuments().flatMap((documentInfo) => {
      const controls = Array.from(documentInfo.doc.querySelectorAll(CONTROL_SELECTOR))
        .filter((element) => !isExtensionElement(element) && isVisible(element) && !isDisabled(element));

      return uniqueElements(controls).map((element) => ({
        labelGuess: guessFieldLabel(element),
        name: element.getAttribute("name") || "",
        id: element.id || "",
        placeholder: element.getAttribute("placeholder") || "",
        title: element.getAttribute("title") || "",
        ariaLabel: element.getAttribute("aria-label") || "",
        selectorCandidate: getSelectorCandidate(element, documentInfo),
        tagName: element.tagName.toLowerCase(),
        type: element.getAttribute("type") || element.getAttribute("role") || "",
        frame: documentInfo.frameSelector || ""
      }));
    });
  }

  function findCrmFieldInDocuments(fieldKey, mapping, documents) {
    for (const documentInfo of documents) {
      const configured = findByConfiguredSelector(documentInfo, fieldKey, mapping);
      if (configured) {
        return configured;
      }

      const byAttributes = findByAttributes(documentInfo, fieldKey, mapping);
      if (byAttributes) {
        return byAttributes;
      }

      const byLabel = findByLabelProximity(documentInfo, fieldKey, mapping);
      if (byLabel) {
        return byLabel;
      }

      const focusedFallback = findFocusedFallback(documentInfo);
      if (focusedFallback) {
        return {
          element: focusedFallback,
          selectorUsed: "focused-visible-form-fallback",
          documentInfo
        };
      }
    }

    return null;
  }

  function findByConfiguredSelector(documentInfo, fieldKey, mapping) {
    const fieldMapping = getMergedFieldMapping(fieldKey, mapping);
    const selectors = uniqueStrings([
      fieldMapping.lastSelectorUsed,
      ...(fieldMapping.selectors || [])
    ]);

    for (const selector of selectors) {
      const element = queryMappedSelector(selector, documentInfo);
      if (element && isCandidateControl(element)) {
        return {
          element,
          selectorUsed: selector,
          documentInfo
        };
      }
    }

    return null;
  }

  function findByAttributes(documentInfo, fieldKey, mapping) {
    const hints = getFieldHints(fieldKey, mapping);
    const controls = getCandidateControls(documentInfo.doc);
    const scored = controls.map((element) => ({
      element,
      score: scoreControlAttributes(element, hints)
    })).filter((item) => item.score > 0);

    scored.sort((first, second) => second.score - first.score);
    const best = scored[0];
    if (!best) {
      return null;
    }

    return {
      element: best.element,
      selectorUsed: getSelectorCandidate(best.element, documentInfo),
      documentInfo
    };
  }

  function findByLabelProximity(documentInfo, fieldKey, mapping) {
    const hints = getFieldHints(fieldKey, mapping);
    const labelElement = findBestLabelElement(documentInfo.doc, hints);
    if (!labelElement) {
      return null;
    }

    const byFor = findControlFromLabelFor(documentInfo.doc, labelElement);
    if (byFor) {
      return {
        element: byFor,
        selectorUsed: getSelectorCandidate(byFor, documentInfo),
        documentInfo
      };
    }

    const containers = getLikelyFieldContainers(labelElement);
    for (const container of containers) {
      const controls = Array.from(container.querySelectorAll(CONTROL_SELECTOR)).filter(isCandidateControl);
      const best = sortControlsNearLabel(controls, labelElement)[0];
      if (best) {
        return {
          element: best,
          selectorUsed: getSelectorCandidate(best, documentInfo),
          documentInfo
        };
      }
    }

    return null;
  }

  function findFocusedFallback(documentInfo) {
    if (!documentInfo.doc.hasFocus?.()) {
      return null;
    }

    const active = documentInfo.doc.activeElement;
    if (isCandidateControl(active)) {
      return active;
    }

    const activeForm = active?.closest?.("form,.el-form,.ant-form,.ivu-form,[class*='form']");
    if (!activeForm) {
      return null;
    }

    return Array.from(activeForm.querySelectorAll(CONTROL_SELECTOR)).find(isCandidateControl) || null;
  }

  function queryMappedSelector(selector, documentInfo) {
    if (!selector) {
      return null;
    }

    try {
      if (selector.includes(">>")) {
        const [frameSelector, innerSelector] = selector.split(">>").map((part) => part.trim());
        const frame = document.querySelector(frameSelector);
        const frameDocument = frame?.contentDocument;
        return frameDocument?.querySelector(innerSelector) || null;
      }

      return documentInfo.doc.querySelector(selector);
    } catch (error) {
      debug("Invalid CRM selector", selector, error);
      return null;
    }
  }

  function getMergedFieldMapping(fieldKey, mapping) {
    const defaultEntry = DEFAULT_MAPPING[fieldKey] || {};
    const customEntry = mapping?.[fieldKey] || {};
    return {
      selectors: uniqueStrings([...(defaultEntry.selectors || []), ...(customEntry.selectors || [])]),
      labelHints: uniqueStrings([...(defaultEntry.labelHints || []), ...(customEntry.labelHints || [])]),
      crmFieldName: customEntry.crmFieldName || defaultEntry.crmFieldName || "",
      lastSelectorUsed: customEntry.lastSelectorUsed || defaultEntry.lastSelectorUsed || "",
      updatedAt: customEntry.updatedAt || defaultEntry.updatedAt || ""
    };
  }

  function getFieldHints(fieldKey, mapping) {
    const fieldMapping = getMergedFieldMapping(fieldKey, mapping);
    return uniqueStrings([
      fieldKey,
      fieldMapping.crmFieldName,
      ...(fieldMapping.labelHints || []),
      FIELD_LABELS.zh?.[fieldKey],
      FIELD_LABELS.en?.[fieldKey]
    ]).filter(Boolean);
  }

  function getCandidateControls(root) {
    return uniqueElements(Array.from(root.querySelectorAll(CONTROL_SELECTOR)).filter(isCandidateControl));
  }

  function isCandidateControl(element) {
    return Boolean(element)
      && element instanceof Element
      && !isExtensionElement(element)
      && isVisible(element)
      && !isDisabled(element)
      && !isReadonly(element);
  }

  function isCustomSelectElement(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element.isContentEditable) {
      return false;
    }
    const className = String(element.className || "");
    return element.getAttribute("role") === "combobox"
      || /\b(?:el-select|ant-select|ivu-select)\b/i.test(className)
      || /select/i.test(className);
  }

  function resolveSettableElement(element) {
    if (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement || element.isContentEditable) {
      return element;
    }

    return element.querySelector("input:not([type='hidden']),textarea,select,[contenteditable='true'],[role='textbox']") || element;
  }

  function scoreControlAttributes(element, hints) {
    const attributes = [
      element.getAttribute("name"),
      element.id,
      element.getAttribute("placeholder"),
      element.getAttribute("title"),
      element.getAttribute("aria-label"),
      element.getAttribute("data-field"),
      element.getAttribute("data-name")
    ].filter(Boolean);

    return hints.reduce((bestScore, hint) => {
      const normalizedHint = normalizeComparableText(hint);
      if (!normalizedHint) {
        return bestScore;
      }

      const score = attributes.reduce((attributeScore, attribute) => {
        const normalizedAttribute = normalizeComparableText(attribute);
        if (normalizedAttribute === normalizedHint) {
          return Math.max(attributeScore, 100);
        }
        if (normalizedAttribute.includes(normalizedHint) || normalizedHint.includes(normalizedAttribute)) {
          return Math.max(attributeScore, 70);
        }
        return attributeScore;
      }, 0);

      return Math.max(bestScore, score);
    }, 0);
  }

  function findBestLabelElement(root, hints) {
    const labels = Array.from(root.querySelectorAll("label,span,td,th,div"))
      .filter((element) => !isExtensionElement(element) && isVisible(element))
      .map((element) => {
        const text = normalizeLabelText(element.textContent);
        if (!text || text.length > 140) {
          return null;
        }

        const score = scoreLabelText(text, hints);
        return score > 0 ? { element, score } : null;
      })
      .filter(Boolean);

    labels.sort((first, second) => second.score - first.score || normalizeLabelText(first.element.textContent).length - normalizeLabelText(second.element.textContent).length);
    return labels[0]?.element || null;
  }

  function scoreLabelText(text, hints) {
    const normalizedText = normalizeComparableText(text);
    return hints.reduce((bestScore, hint) => {
      const normalizedHint = normalizeComparableText(hint);
      if (!normalizedHint) {
        return bestScore;
      }
      if (normalizedText === normalizedHint) {
        return Math.max(bestScore, 100);
      }
      if (normalizedText.endsWith(normalizedHint) && normalizedText.length <= normalizedHint.length + 8) {
        return Math.max(bestScore, 85);
      }
      if (normalizedText.includes(normalizedHint) && normalizedText.length <= normalizedHint.length + 24) {
        return Math.max(bestScore, 65);
      }
      return bestScore;
    }, 0);
  }

  function findControlFromLabelFor(root, labelElement) {
    const forId = labelElement.getAttribute("for");
    if (!forId) {
      return null;
    }

    const element = root.getElementById(forId);
    return isCandidateControl(element) ? element : null;
  }

  function getLikelyFieldContainers(labelElement) {
    const selectors = [
      ".el-form-item",
      ".ant-form-item",
      ".ivu-form-item",
      ".form-item",
      "[class*='formItem']",
      "[class*='form-item']",
      "tr",
      "label"
    ];
    const containers = selectors.map((selector) => labelElement.closest(selector)).filter(Boolean);
    let parent = labelElement.parentElement;
    while (parent && containers.length < 7 && parent !== labelElement.ownerDocument.body) {
      containers.push(parent);
      parent = parent.parentElement;
    }
    return uniqueElements(containers);
  }

  function sortControlsNearLabel(controls, labelElement) {
    const labelRect = labelElement.getBoundingClientRect();
    const labelCenterY = labelRect.top + (labelRect.height / 2);
    return controls
      .filter((control) => control !== labelElement && !control.contains(labelElement))
      .sort((first, second) => {
        const firstRect = first.getBoundingClientRect();
        const secondRect = second.getBoundingClientRect();
        const firstScore = Math.abs((firstRect.top + firstRect.height / 2) - labelCenterY) + Math.max(0, firstRect.left - labelRect.right);
        const secondScore = Math.abs((secondRect.top + secondRect.height / 2) - labelCenterY) + Math.max(0, secondRect.left - labelRect.right);
        return firstScore - secondScore;
      });
  }

  function setNativeTextValue(input, value) {
    input.focus();
    const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, "value")?.set;
    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }

    dispatchValueEvents(input);
  }

  function setNativeSelectValue(select, value) {
    const normalizedValue = normalizeComparableText(value);
    const option = Array.from(select.options).find((item) => {
      const normalizedOptionValue = normalizeComparableText(item.value);
      const normalizedOptionText = normalizeComparableText(item.textContent);
      return normalizedOptionValue === normalizedValue || normalizedOptionText === normalizedValue || normalizedOptionText.includes(normalizedValue);
    });

    if (!option) {
      return false;
    }

    select.focus();
    select.value = option.value;
    dispatchValueEvents(select);
    return true;
  }

  function setContentEditableValue(element, value) {
    element.focus();
    element.textContent = value;
    dispatchValueEvents(element);
  }

  async function setCustomSelectValue(element, value) {
    clickElement(element);
    await delay(120);
    const option = findSafeDropdownOption(element.ownerDocument, value);
    if (!option) {
      return false;
    }
    clickElement(option);
    dispatchValueEvents(element);
    return true;
  }

  function findSafeDropdownOption(root, value) {
    const normalizedValue = normalizeComparableText(value);
    const optionSelectors = [
      ".el-select-dropdown__item",
      ".ant-select-item-option",
      ".ivu-select-item",
      "[role='option']",
      "li"
    ].join(",");
    const roots = uniqueElements([root, document]);

    for (const searchRoot of roots) {
      const option = Array.from(searchRoot.querySelectorAll(optionSelectors)).find((element) => {
        if (isExtensionElement(element) || !isVisible(element) || isDisabled(element)) {
          return false;
        }
        return normalizeComparableText(element.textContent) === normalizedValue;
      });
      if (option) {
        return option;
      }
    }

    return null;
  }

  function dispatchValueEvents(element) {
    element.dispatchEvent(new Event("focus", { bubbles: true }));
    element.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: String(element.value || element.textContent || "") }));
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function clickElement(element) {
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: element.ownerDocument.defaultView || window }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: element.ownerDocument.defaultView || window }));
    element.click();
  }

  function getSearchableDocuments() {
    const docs = [{
      doc: document,
      frameSelector: "",
      frameElement: null
    }];

    Array.from(document.querySelectorAll("iframe")).forEach((frame) => {
      try {
        if (frame.contentDocument) {
          docs.push({
            doc: frame.contentDocument,
            frameSelector: getUniqueSelector(frame, document),
            frameElement: frame
          });
        }
      } catch (error) {
        debug("Skipping inaccessible iframe", error);
      }
    });

    return docs;
  }

  function normalizeFieldEntries(fields) {
    return Object.entries(fields || {}).map(([fieldKey, field]) => ({
      fieldKey,
      value: typeof field === "object" && field !== null && Object.prototype.hasOwnProperty.call(field, "value")
        ? String(field.value || "").trim()
        : String(field || "").trim()
    }));
  }

  function guessFieldLabel(element) {
    const directLabel = element.getAttribute("aria-label")
      || element.getAttribute("placeholder")
      || element.getAttribute("title");
    if (directLabel) {
      return normalizeLabelText(directLabel);
    }

    const labelFor = element.id
      ? element.ownerDocument.querySelector(`label[for="${escapeCssString(element.id)}"]`)
      : null;
    if (labelFor) {
      return normalizeLabelText(labelFor.textContent);
    }

    const parentLabel = element.closest("label");
    if (parentLabel) {
      return normalizeLabelText(parentLabel.textContent);
    }

    const containers = getLikelyFieldContainers(element);
    for (const container of containers) {
      const label = Array.from(container.querySelectorAll("label,span,td,th"))
        .map((candidate) => normalizeLabelText(candidate.textContent))
        .find((text) => text && text.length <= 80);
      if (label) {
        return label;
      }
    }

    return "";
  }

  function getSelectorCandidate(element, documentInfo = null) {
    const docInfo = documentInfo || { doc: element.ownerDocument, frameSelector: "" };
    const selector = getUniqueSelector(element, docInfo.doc);
    return docInfo.frameSelector ? `${docInfo.frameSelector} >> ${selector}` : selector;
  }

  function getUniqueSelector(element, rootDocument) {
    if (element.id) {
      return `#${escapeCssIdentifier(element.id)}`;
    }

    const name = element.getAttribute("name");
    if (name) {
      const selector = `${element.tagName.toLowerCase()}[name="${escapeCssString(name)}"]`;
      if (rootDocument.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    const placeholder = element.getAttribute("placeholder");
    if (placeholder) {
      const selector = `${element.tagName.toLowerCase()}[placeholder="${escapeCssString(placeholder)}"]`;
      if (rootDocument.querySelectorAll(selector).length === 1) {
        return selector;
      }
    }

    const path = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== rootDocument.body && path.length < 6) {
      const tag = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (!parent) {
        break;
      }
      const index = Array.from(parent.children).filter((child) => child.tagName === current.tagName).indexOf(current) + 1;
      path.unshift(`${tag}:nth-of-type(${index})`);
      current = parent;
    }

    return path.length ? path.join(" > ") : element.tagName.toLowerCase();
  }

  function isVisible(element) {
    if (!(element instanceof Element) || element.closest("[hidden]")) {
      return false;
    }

    const rect = element.getBoundingClientRect();
    const style = element.ownerDocument.defaultView.getComputedStyle(element);
    return rect.width > 0
      && rect.height > 0
      && style.visibility !== "hidden"
      && style.display !== "none"
      && style.opacity !== "0";
  }

  function isDisabled(element) {
    return element.disabled === true
      || element.getAttribute("disabled") !== null
      || element.getAttribute("aria-disabled") === "true"
      || element.classList.contains("is-disabled")
      || element.classList.contains("disabled");
  }

  function isReadonly(element) {
    return element.readOnly === true
      || element.getAttribute("readonly") !== null
      || element.getAttribute("aria-readonly") === "true";
  }

  function isExtensionElement(element) {
    return Boolean(element?.closest?.(`#${SIDEBAR_ID}`));
  }

  function normalizeLabelText(value) {
    return String(value || "")
      .replace(/\*/g, "")
      .replace(/\s+/g, " ")
      .replace(/[：:]+$/g, "")
      .trim();
  }

  function normalizeComparableText(value) {
    return normalizeLabelText(value).toLowerCase().replace(/\s+/g, "").replace(/[()（）._-]/g, "");
  }

  function uniqueElements(elements) {
    return Array.from(new Set((elements || []).filter(Boolean)));
  }

  function uniqueStrings(values) {
    return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
  }

  function escapeCssIdentifier(value) {
    if (global.CSS?.escape) {
      return global.CSS.escape(String(value));
    }
    return String(value).replace(/[^a-zA-Z0-9_-]/g, "\\$&");
  }

  function escapeCssString(value) {
    return String(value).replace(/["\\]/g, "\\$&");
  }

  function delay(ms) {
    return new Promise((resolve) => global.setTimeout(resolve, ms));
  }

  function waitForStableDom(root = document.body, options = {}) {
    const timeout = options.timeout || 1500;
    const stableMs = options.stableMs || 120;

    return new Promise((resolve) => {
      let stableTimer = null;
      const timeoutTimer = global.setTimeout(cleanup, timeout);
      const observer = new MutationObserver(scheduleStableResolve);

      function scheduleStableResolve() {
        if (stableTimer) {
          global.clearTimeout(stableTimer);
        }
        stableTimer = global.setTimeout(cleanup, stableMs);
      }

      function cleanup() {
        if (stableTimer) {
          global.clearTimeout(stableTimer);
        }
        global.clearTimeout(timeoutTimer);
        observer.disconnect();
        resolve();
      }

      observer.observe(root, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "disabled", "aria-disabled", "readonly"]
      });
      scheduleStableResolve();
    });
  }

  function debug(...args) {
    if (DEBUG && global.console?.debug) {
      global.console.debug("[TradeOpsAutomation]", ...args);
    }
  }

  global.CrmDomAdapter = Object.freeze({
    findCrmField,
    setCrmFieldValue,
    fillCrmFields,
    scanVisibleCrmFields,
    waitForStableDom
  });
})(typeof window !== "undefined" ? window : globalThis);
