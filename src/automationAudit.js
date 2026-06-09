(function initializeCrmAutomationAudit(global) {
  "use strict";

  const DB_NAME = "TradeOpsAutomationDB";
  const DB_VERSION = 1;
  const EXTRACTION_RUNS_STORE = "extractionRuns";
  const AUTOFILL_RUNS_STORE = "autofillRuns";
  const FIELD_MAPPINGS_STORE = "fieldMappings";

  let dbPromise = null;

  function openDb() {
    if (dbPromise) {
      return dbPromise;
    }

    if (!global.indexedDB) {
      dbPromise = Promise.reject(new Error("IndexedDB is unavailable"));
      return dbPromise;
    }

    dbPromise = new Promise((resolve, reject) => {
      const request = global.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains(EXTRACTION_RUNS_STORE)) {
          const store = db.createObjectStore(EXTRACTION_RUNS_STORE, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("scNo", "scNo", { unique: false });
          store.createIndex("documentType", "documentType", { unique: false });
        }

        if (!db.objectStoreNames.contains(AUTOFILL_RUNS_STORE)) {
          const store = db.createObjectStore(AUTOFILL_RUNS_STORE, { keyPath: "id" });
          store.createIndex("timestamp", "timestamp", { unique: false });
          store.createIndex("scNo", "scNo", { unique: false });
          store.createIndex("userAction", "userAction", { unique: false });
        }

        if (!db.objectStoreNames.contains(FIELD_MAPPINGS_STORE)) {
          const store = db.createObjectStore(FIELD_MAPPINGS_STORE, { keyPath: "fieldKey" });
          store.createIndex("updatedAt", "updatedAt", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("Failed to open TradeOpsAutomationDB"));
    });

    return dbPromise;
  }

  async function recordExtractionRun(payload = {}) {
    const record = normalizeRunRecord({
      ...payload,
      userAction: payload.userAction || "extract"
    });
    const db = await openDb();
    await requestToPromise(db.transaction(EXTRACTION_RUNS_STORE, "readwrite").objectStore(EXTRACTION_RUNS_STORE).put(record));
    return record;
  }

  async function recordAutofillRun(payload = {}) {
    const record = normalizeRunRecord({
      ...payload,
      userAction: payload.userAction || "fill_selected"
    });
    const db = await openDb();
    await requestToPromise(db.transaction(AUTOFILL_RUNS_STORE, "readwrite").objectStore(AUTOFILL_RUNS_STORE).put(record));
    return record;
  }

  async function getFieldMapping(fieldKey) {
    if (!fieldKey) {
      return null;
    }

    const db = await openDb();
    return requestToPromise(db.transaction(FIELD_MAPPINGS_STORE, "readonly").objectStore(FIELD_MAPPINGS_STORE).get(fieldKey));
  }

  async function getAllFieldMappings() {
    const db = await openDb();
    const mappings = await requestToPromise(db.transaction(FIELD_MAPPINGS_STORE, "readonly").objectStore(FIELD_MAPPINGS_STORE).getAll());
    return mappings.reduce((byFieldKey, mapping) => {
      if (mapping?.fieldKey) {
        byFieldKey[mapping.fieldKey] = normalizeFieldMapping(mapping.fieldKey, mapping);
      }
      return byFieldKey;
    }, {});
  }

  async function saveFieldMapping(fieldKey, mapping) {
    if (!fieldKey) {
      throw new Error("fieldKey is required");
    }

    const record = normalizeFieldMapping(fieldKey, mapping);
    const db = await openDb();
    await requestToPromise(db.transaction(FIELD_MAPPINGS_STORE, "readwrite").objectStore(FIELD_MAPPINGS_STORE).put(record));
    return record;
  }

  async function saveFieldMappings(mappings = {}) {
    const db = await openDb();
    const transaction = db.transaction(FIELD_MAPPINGS_STORE, "readwrite");
    const store = transaction.objectStore(FIELD_MAPPINGS_STORE);
    Object.entries(mappings).forEach(([fieldKey, mapping]) => {
      if (fieldKey) {
        store.put(normalizeFieldMapping(fieldKey, mapping));
      }
    });
    await transactionToPromise(transaction);
    return getAllFieldMappings();
  }

  function normalizeRunRecord(payload) {
    const timestamp = payload.timestamp || new Date().toISOString();
    const fields = payload.fields || payload.extractedFields || {};
    const scNo = payload.scNo || getFieldValue(fields.scNo) || "";

    return {
      id: payload.id || createId("run"),
      timestamp,
      scNo,
      documentType: payload.documentType || "",
      fields,
      validationWarnings: payload.validationWarnings || payload.warnings || [],
      blockingIssues: payload.blockingIssues || [],
      crmFillResult: payload.crmFillResult || null,
      userAction: payload.userAction || "",
      metadata: payload.metadata || {}
    };
  }

  function normalizeFieldMapping(fieldKey, mapping = {}) {
    return {
      fieldKey,
      selectors: uniqueStrings(mapping.selectors),
      labelHints: uniqueStrings(mapping.labelHints),
      crmFieldName: String(mapping.crmFieldName || ""),
      lastSelectorUsed: String(mapping.lastSelectorUsed || ""),
      updatedAt: mapping.updatedAt || new Date().toISOString()
    };
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

  function uniqueStrings(values) {
    return Array.from(new Set((values || []).map((value) => String(value || "").trim()).filter(Boolean)));
  }

  function requestToPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
    });
  }

  function transactionToPromise(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error("IndexedDB transaction failed"));
      transaction.onabort = () => reject(transaction.error || new Error("IndexedDB transaction aborted"));
    });
  }

  function createId(prefix) {
    if (global.crypto?.randomUUID) {
      return `${prefix}-${global.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  global.CrmAutomationAudit = Object.freeze({
    DB_NAME,
    openDb,
    recordExtractionRun,
    recordAutofillRun,
    getFieldMapping,
    getAllFieldMappings,
    saveFieldMapping,
    saveFieldMappings
  });
})(typeof window !== "undefined" ? window : globalThis);
