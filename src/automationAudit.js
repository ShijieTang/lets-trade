/**
 * IndexedDB audit trail for extraction and CRM auto-fill operations.
 */
(function initializeCrmAutomationAudit() {
  const DB_NAME = "TradeOpsAutomationDB";
  const DB_VERSION = 1;
  const LOG_STORE = "fillLogs";
  const MAPPING_STORE = "fieldMappings";
  let dbPromise = null;

  async function saveLog(log = {}) {
    const db = await openDb();
    const record = {
      id: log.id || createId(),
      timestamp: log.timestamp || new Date().toISOString(),
      documentType: log.documentType || "",
      extractedFields: log.extractedFields || {},
      validationResults: log.validationResults || {},
      fillStatus: log.fillStatus || [],
      warnings: Array.isArray(log.warnings) ? log.warnings : []
    };
    await putRecord(db, LOG_STORE, record);
    return record;
  }

  async function getLogs(limit = 50) {
    const db = await openDb();
    return getAllRecords(db, LOG_STORE).then((records) => {
      return records
        .sort((first, second) => String(second.timestamp).localeCompare(String(first.timestamp)))
        .slice(0, limit);
    });
  }

  async function saveMappings(mappings = {}) {
    const db = await openDb();
    const record = {
      id: "default",
      timestamp: new Date().toISOString(),
      mappings: { ...mappings }
    };
    await putRecord(db, MAPPING_STORE, record);
    return record.mappings;
  }

  async function getMappings() {
    const db = await openDb();
    const record = await getRecord(db, MAPPING_STORE, "default");
    return record?.mappings || {};
  }

  function openDb() {
    if (!window.indexedDB) {
      return Promise.reject(new Error("IndexedDB is unavailable."));
    }
    if (!dbPromise) {
      dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(LOG_STORE)) {
            const store = db.createObjectStore(LOG_STORE, { keyPath: "id" });
            store.createIndex("timestamp", "timestamp", { unique: false });
            store.createIndex("documentType", "documentType", { unique: false });
          }
          if (!db.objectStoreNames.contains(MAPPING_STORE)) {
            db.createObjectStore(MAPPING_STORE, { keyPath: "id" });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Failed to open automation audit database."));
      });
    }
    return dbPromise;
  }

  function putRecord(db, storeName, record) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      store.put(record);
      transaction.oncomplete = () => resolve(record);
      transaction.onerror = () => reject(transaction.error || new Error(`Failed to write ${storeName}.`));
      transaction.onabort = () => reject(transaction.error || new Error(`${storeName} transaction aborted.`));
    });
  }

  function getRecord(db, storeName, key) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error || new Error(`Failed to read ${storeName}.`));
    });
  }

  function getAllRecords(db, storeName) {
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const request = transaction.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
      request.onerror = () => reject(request.error || new Error(`Failed to read ${storeName}.`));
    });
  }

  function createId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  window.CrmAutomationAudit = {
    saveLog,
    getLogs,
    saveMappings,
    getMappings
  };
})();
