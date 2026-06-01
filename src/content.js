/**
 * CRM Embedded Workbench - Step 2
 *
 * This content script runs only on the configured CRM URL.
 * It reserves part of the viewport for an extension-owned sidebar and keeps
 * all sidebar UI inside a Shadow DOM so CRM styles cannot leak in.
 */
(function initializeCrmWorkbench() {
  const LEFT_VIEWPORT_ID = "crm-workbench-left-viewport";
  const CRM_SURFACE_ID = "crm-workbench-crm-surface";
  const SIDEBAR_ID = "crm-workbench-sidebar-host";
  const STYLE_ID = "crm-workbench-page-split-style";
  const WIDTH_STORAGE_KEY = "crmWorkbenchSidebarWidthPx";
  const COLLAPSED_STORAGE_KEY = "crmWorkbenchSidebarCollapsed";
  const PREVIEW_HEIGHT_STORAGE_KEY = "crmWorkbenchPreviewHeightPx";
  const PREVIEW_ZOOM_STORAGE_KEY = "crmWorkbenchPreviewZoom";
  const LANGUAGE_STORAGE_KEY = "crmWorkbenchLanguage";
  const DEFAULT_LANGUAGE = "zh";
  const DEFAULT_SIDEBAR_RATIO = 0.5;
  const MIN_SIDEBAR_WIDTH = 360;
  const MIN_CRM_WIDTH = 460;
  const COLLAPSED_SIDEBAR_WIDTH = 48;
  const DEFAULT_PREVIEW_HEIGHT = 360;
  const MIN_PREVIEW_HEIGHT = 180;
  const CRM_MODAL_TIMEOUT = 10000;
  const CRM_UPLOAD_CONFIRM_TIMEOUT = 15000;
  const FRAME_UPLOAD_TIMEOUT = 20000;
  const FRAME_UPLOAD_REQUEST = "CRM_WORKBENCH_UPLOAD_REQUEST";
  const FRAME_UPLOAD_RESPONSE = "CRM_WORKBENCH_UPLOAD_RESPONSE";
  const FRAME_AUTOFILL_REQUEST = "CRM_WORKBENCH_AUTOFILL_REQUEST";
  const FRAME_AUTOFILL_RESPONSE = "CRM_WORKBENCH_AUTOFILL_RESPONSE";
  const DEFAULT_PREVIEW_ZOOM = "100";
  const PREVIEW_ZOOM_LEVELS = [50, 75, 100, 125, 150, 200];
  const FINANCIAL_SOURCE_COLUMN_COUNT = 51;
  const FINANCIAL_CALCULATED_HEADERS = ["净利润", "退税额", "合计利润", "税汇比"];
  const PURCHASE_CALCULATED_HEADERS = ["合同采购金额", "不含税金额", "采购单价(元/kg)"];
  const DEFAULT_REQUIRED_CRM_VALUES = {
    purchaseSaleMode: "以销定购",
    overfillRate: "5%",
    shortfallRate: "5%"
  };
  const TRANSLATIONS = {
    zh: {
      sidebarLabel: "CRM 嵌入式工作台侧边栏",
      languageToggleLabel: "Switch to English",
      languageToggleTitle: "Switch to English",
      languageToggleText: "EN",
      foldWorkbench: "收起工作台",
      expandWorkbench: "展开工作台",
      resizeWorkbench: "调整工作台宽度",
      sectionNavLabel: "工作台分区导航",
      navUpload: "上传",
      navCalculator: "计算",
      navFinancial: "退税",
      navDocument: "文档",
      navActions: "操作",
      uploadTitle: "上传文档或图片文件",
      uploadHint: "点击或拖入文档、PDF、图片或表格文件。",
      uploadAria: "文档上传拖放区域",
      loadedFiles: "已加载文件",
      resizePreview: "调整预览高度",
      resizeTablePreview: "调整表格预览高度",
      savedFromWorkbenchAt: "保存自 CRM 嵌入式工作台，时间：{savedAt}",
      purchaseCalculatorTitle: "人民币采购合同价格计算器",
      usdPrice: "美金底价（美元/kg）",
      weightKg: "总重量（kg）",
      exchangeRate: "汇率",
      commissionRate: "固定佣金（%）",
      miscFee: "杂费（元）",
      taxRate: "税率（%）",
      contractPurchaseAmount: "合同采购金额",
      taxExcludedAmount: "不含税金额",
      contractUnitPrice: "合同采购单价",
      purchaseDrop: "拖入采购价格表格，或点击选择 .xlsx/.xls/.csv",
      purchaseDropAria: "上传采购计算表格文件",
      calculatePurchaseTable: "计算采购表格",
      financialCalculatorTitle: "出口退税利润计算器",
      financialDrop: "拖入出口退税成本运费登记表，或点击选择 .xlsx/.xls/.csv",
      financialDropAria: "上传退税计算表格文件",
      calculateFinancialTable: "计算退税利润",
      documentAreaAria: "可编辑文档预览",
      documentLabelEmpty: "可编辑文档工作台",
      noFileLoaded: "未加载文件",
      editorPlaceholder: "将文档或图片文件拖到这里。这个可编辑区域会显示提取出的文档文本或备注。",
      pdfPreviewTitle: "PDF 预览",
      previewZoomControls: "文件查看大小控制",
      previewZoomOut: "缩小文件预览",
      previewZoomIn: "放大文件预览",
      previewZoomLabel: "查看大小",
      saveEditedCopy: "保存编辑副本",
      extractFillCrm: "识别并填入 CRM",
      syncUpload: "同步并上传到 CRM",
      removeFile: "移除 {filename}",
      loadingFile: "正在加载 {filename}...",
      unsupportedFile: "不支持的文件类型。请选择 .doc、.docx、.pdf、.jpg、.jpeg、.png、.xls、.xlsx 或 .csv 文件。",
      calculatorNeedSpreadsheet: "请先上传或选择一个 .xlsx、.xls 或 .csv 表格文件，再点击计算当前表格。",
      calculatorOnlySpreadsheet: "计算器只支持 .xlsx、.xls 或 .csv 表格文件。",
      pdfLoaded: "PDF 预览已加载。完整可编辑文本提取将在下一步接入 pdfjs-dist。",
      typeNotes: "你可以在这里输入提取备注或可同步到 CRM 的文本。",
      imageLoaded: "图片预览已加载。图片文件仅支持预览，如需 CRM 备注可在下方输入。",
      docxLibraryMissing: "DOCX 预览库缺失。请在 chrome://extensions 重新加载扩展，并刷新 CRM 页面。",
      convertingFile: "正在转换 {filename}...",
      docxNoText: "这个 DOCX 文件中没有找到可编辑文本。",
      docxRenderError: "无法渲染这个 DOCX 文件：{message}。原始文件仍可上传到 CRM。",
      legacyDocLoaded: "{filename} 已加载。这是旧版 Microsoft Word .doc 文件。Chrome 扩展无法在浏览器中可靠预览或编辑这种旧二进制格式。",
      legacyDocInstruction: "该文件仍可上传到 CRM。如需在侧边栏中查看或编辑，请用 Word/WPS 打开并另存为 .docx 后再加载。",
      downloadOriginalDoc: "下载原始 .doc",
      tableLibraryMissing: "表格预览库缺失。请重新加载扩展并刷新 CRM 页面。",
      openingTable: "正在打开表格文件 {filename}...",
      noWorksheets: "这个表格文件中没有找到工作表。",
      showingCalculatedSheet: "正在显示已计算表：{sheetName}。{label}结果列已追加到下方表格。",
      showingSheet: "正在显示工作表：{sheetName}。点击计算器中的“计算当前表格”来追加计算结果。",
      tableOpenError: "无法打开这个表格文件：{message}。",
      noLoadedContentToSave: "没有已加载文件或编辑内容可保存。",
      savedFile: "已保存 {filename}。",
      exportLibraryMissing: "表格导出库缺失。请重新加载扩展后再试。",
      noCalculatedTable: "没有可保存的计算表格。",
      savedWorkbook: "已保存 {filename}。浏览器安全限制不允许直接覆盖本地原文件。",
      chooseFileBeforeSync: "请先选择支持的文件再同步到 CRM。",
      noExtractableContent: "没有可识别的文本。请先上传 DOCX/表格，或在文档工作台中输入从 PDF 提取的内容。",
      noFieldsDetected: "没有识别到可填入 CRM 的字段。请补充包含客户、币种、金额、港口等字段的文本。",
      fillingCrm: "正在识别文档内容并填入 CRM 表单...",
      fieldsDetected: "识别字段：{fields}",
      requiredFieldsDetected: "识别并补齐必填字段：{fields}",
      crmAutofillComplete: "CRM 自动填入完成：已填 {filled} 项，跳过 {skipped} 项。",
      crmAutofillFailed: "CRM 自动填入失败。",
      uploadingFile: "正在上传 {filename} 到 CRM 附件弹窗...",
      uploadSent: "{filename} 已发送到 CRM 上传弹窗。",
      crmUploadFailed: "CRM 上传失败。请重试。",
      frameUploadFailed: "CRM iframe 上传失败。",
      frameNotFound: "找不到包含附件表单的 CRM iframe。",
      frameReachFailed: "无法连接 CRM iframe 上传处理器。请重新加载扩展和 CRM 页面后再试。",
      waitAttachmentForm: "找不到 {description}。请确认 CRM 页面停留在截图中的附件表单。",
      attachmentTabDescription: "CRM 附件标签",
      uploadAttachmentButtonDescription: "CRM 上传附件按钮",
      uploadModalDescription: "CRM 文件上传弹窗",
      modalFileInputDescription: "弹窗文件输入框",
      modalUploadButtonDescription: "弹窗上传文件按钮",
      purchaseCalculationLabel: "采购合同价格",
      financialCalculationLabel: "出口退税利润",
      invalidField: "请输入有效的{field}。",
      weightPositive: "总重量必须大于 0，才能计算合同单价。",
      nonNegativeInputs: "底价、汇率、佣金、杂费和退税率不能为负数，且汇率必须大于 0。",
      breakdownBase: "人民币底价：{base} 元 = {usd} 美元/kg × {weight} kg × {rate}",
      breakdownCommission: "佣金：{commission} 元 = 人民币底价 × {rate}%",
      breakdownContract: "合同采购金额：({base} - {commission} - {misc}) ÷ {denominator} = {contract} 元",
      breakdownTaxExcluded: "不含税金额：{contract} ÷ (1 + {taxRate}%) = {amount} 元",
      financialBatchTitle: "出口退税利润计算",
      purchaseBatchTitle: "批量采购价格计算",
      noFinancialRows: "没有识别到可批量计算的行。请确认表格包含 A 到 AY 的源数据列。",
      noPurchaseRows: "没有识别到可批量计算的行。请确认表格包含数量、单价、汇率、税率等列。",
      moreRowsSkipped: "更多行已跳过",
      calculatedRows: "已计算行数",
      netProfitTotal: "净利润合计",
      taxRebateTotal: "退税额合计",
      totalProfit: "合计利润",
      row: "行",
      netProfit: "净利润",
      taxRebateAmount: "退税额",
      exchangeTaxRatio: "税汇比",
      financialHeaderMissing: "没有找到出口退税成本运费登记表的表头行。",
      financialSourceMissing: "第 {row} 行跳过：源数据列不足。",
      contractPurchaseAmountTotal: "合同采购金额合计",
      taxExcludedAmountTotal: "不含税金额合计",
      totalWeight: "总重量合计",
      averageUnitPrice: "平均采购单价",
      commissionDefault: "佣金默认值",
      commissionDefaultValue: "未标注按 10%",
      quantityKg: "数量 kg",
      unitPriceUsdKg: "单价 USD/kg",
      commission: "佣金",
      miscFeeShort: "杂费",
      purchaseUnitPrice: "采购单价",
      purchaseHeaderMissing: "没有找到数量、单价、汇率、税率这些必要列。",
      skippedRowWithReason: "第 {row} 行跳过：{reason}"
    },
    en: {
      sidebarLabel: "CRM Embedded Workbench Sidebar",
      languageToggleLabel: "切换到中文",
      languageToggleTitle: "切换到中文",
      languageToggleText: "中",
      foldWorkbench: "Fold workbench",
      expandWorkbench: "Expand workbench",
      resizeWorkbench: "Resize workbench",
      sectionNavLabel: "Workbench section navigation",
      navUpload: "Upload",
      navCalculator: "Calc",
      navFinancial: "Tax",
      navDocument: "Docs",
      navActions: "Actions",
      uploadTitle: "Upload document or image file",
      uploadHint: "Click or drag document, PDF, image, or table files here.",
      uploadAria: "Document upload drop zone",
      loadedFiles: "Loaded files",
      resizePreview: "Resize preview",
      resizeTablePreview: "Resize table preview",
      savedFromWorkbenchAt: "Saved from CRM Embedded Workbench at {savedAt}",
      purchaseCalculatorTitle: "RMB purchase contract price calculator",
      usdPrice: "USD base price (USD/kg)",
      weightKg: "Total weight (kg)",
      exchangeRate: "Exchange rate",
      commissionRate: "Fixed commission (%)",
      miscFee: "Misc. fee (RMB)",
      taxRate: "Tax rate (%)",
      contractPurchaseAmount: "Contract purchase amount",
      taxExcludedAmount: "Tax-excluded amount",
      contractUnitPrice: "Contract unit price",
      purchaseDrop: "Drop a purchase pricing table, or click to select .xlsx/.xls/.csv",
      purchaseDropAria: "Upload table file for purchase calculation",
      calculatePurchaseTable: "Calculate purchase table",
      financialCalculatorTitle: "Export tax rebate profit calculator",
      financialDrop: "Drop an export rebate cost/freight table, or click to select .xlsx/.xls/.csv",
      financialDropAria: "Upload table file for rebate calculation",
      calculateFinancialTable: "Calculate rebate profit",
      documentAreaAria: "Editable document preview",
      documentLabelEmpty: "Editable Document Workbench",
      noFileLoaded: "No file loaded",
      editorPlaceholder: "Drop a document or image file here. This editable area will hold extracted document text or notes.",
      pdfPreviewTitle: "PDF preview",
      previewZoomControls: "File viewing size controls",
      previewZoomOut: "Zoom file preview out",
      previewZoomIn: "Zoom file preview in",
      previewZoomLabel: "View size",
      saveEditedCopy: "Save Edited Copy",
      extractFillCrm: "Extract & Fill CRM",
      syncUpload: "Sync & Upload to CRM",
      removeFile: "Remove {filename}",
      loadingFile: "Loading {filename}...",
      unsupportedFile: "Unsupported file type. Please choose a .doc, .docx, .pdf, .jpg, .jpeg, .png, .xls, .xlsx, or .csv file.",
      calculatorNeedSpreadsheet: "Upload or choose a .xlsx, .xls, or .csv table file before calculating the current table.",
      calculatorOnlySpreadsheet: "The calculator only supports .xlsx, .xls, or .csv table files.",
      pdfLoaded: "PDF preview is loaded. Full editable text extraction will be wired with pdfjs-dist in the next library step.",
      typeNotes: "You can type extracted notes or CRM-ready text here.",
      imageLoaded: "Image preview is loaded. Image files are preview-only, so type any CRM-ready notes below if needed.",
      docxLibraryMissing: "DOCX preview library is missing. Reload the extension in chrome://extensions and refresh the CRM page.",
      convertingFile: "Converting {filename}...",
      docxNoText: "No editable text was found in this DOCX file.",
      docxRenderError: "Could not render this DOCX file: {message}. The original file is still available for CRM upload.",
      legacyDocLoaded: "{filename} is loaded. This is a legacy Microsoft Word .doc file. Chrome extensions cannot reliably preview or edit this old binary format directly in the browser.",
      legacyDocInstruction: "The file is still loaded and can be uploaded to CRM. To view/edit it in the sidebar, open it in Word/WPS and save it as .docx, then load the .docx file here.",
      downloadOriginalDoc: "Download Original .doc",
      tableLibraryMissing: "Table preview library is missing. Reload the extension and refresh the CRM page.",
      openingTable: "Opening table file {filename}...",
      noWorksheets: "No worksheets were found in this table file.",
      showingCalculatedSheet: "Showing calculated sheet: {sheetName}. The {label} result columns are appended to the table below.",
      showingSheet: "Showing sheet: {sheetName}. Click “Calculate current table” in the calculator to append calculation results.",
      tableOpenError: "Could not open this table file: {message}.",
      noLoadedContentToSave: "There is no loaded file or edited content to save.",
      savedFile: "Saved {filename}.",
      exportLibraryMissing: "Table export library is missing. Reload the extension and try again.",
      noCalculatedTable: "There is no calculated table to save.",
      savedWorkbook: "Saved {filename}. Browser security does not allow overwriting the original local file directly.",
      chooseFileBeforeSync: "Choose a supported file before syncing to CRM.",
      noExtractableContent: "No recognizable text is available. Upload a DOCX/table first, or type extracted PDF text in the document workbench.",
      noFieldsDetected: "No CRM-ready fields were detected. Add text containing customer, currency, amount, ports, and similar fields.",
      fillingCrm: "Recognizing document content and filling the CRM form...",
      fieldsDetected: "Detected fields: {fields}",
      requiredFieldsDetected: "Detected and completed required fields: {fields}",
      crmAutofillComplete: "CRM autofill complete: filled {filled}, skipped {skipped}.",
      crmAutofillFailed: "CRM autofill failed.",
      uploadingFile: "Uploading {filename} to the CRM attachment modal...",
      uploadSent: "{filename} was sent to the CRM upload modal.",
      crmUploadFailed: "CRM upload failed. Please try again.",
      frameUploadFailed: "CRM frame upload failed.",
      frameNotFound: "Could not find the CRM iframe that contains the attachment form.",
      frameReachFailed: "Could not reach the CRM iframe upload handler. Reload the extension and CRM page, then try again.",
      waitAttachmentForm: "Could not find {description}. Make sure the CRM page is on the attachment form shown in the screenshot.",
      attachmentTabDescription: "the CRM Attachment tab",
      uploadAttachmentButtonDescription: "the CRM Upload Attachment button",
      uploadModalDescription: "the CRM file upload modal",
      modalFileInputDescription: "the modal file input",
      modalUploadButtonDescription: "the modal Upload File button",
      purchaseCalculationLabel: "purchase contract price",
      financialCalculationLabel: "export tax rebate profit",
      invalidField: "Enter a valid {field}.",
      weightPositive: "Total weight must be greater than 0 to calculate the contract unit price.",
      nonNegativeInputs: "Base price, exchange rate, commission, misc. fee, and tax rebate rate cannot be negative, and exchange rate must be greater than 0.",
      breakdownBase: "RMB base price: {base} RMB = {usd} USD/kg × {weight} kg × {rate}",
      breakdownCommission: "Commission: {commission} RMB = RMB base price × {rate}%",
      breakdownContract: "Contract purchase amount: ({base} - {commission} - {misc}) ÷ {denominator} = {contract} RMB",
      breakdownTaxExcluded: "Tax-excluded amount: {contract} ÷ (1 + {taxRate}%) = {amount} RMB",
      financialBatchTitle: "Export tax rebate profit calculation",
      purchaseBatchTitle: "Batch purchase price calculation",
      noFinancialRows: "No rows were recognized for batch calculation. Confirm the table includes source columns A through AY.",
      noPurchaseRows: "No rows were recognized for batch calculation. Confirm the table includes quantity, unit price, exchange rate, and tax rate columns.",
      moreRowsSkipped: "more rows skipped",
      calculatedRows: "Calculated rows",
      netProfitTotal: "Net profit total",
      taxRebateTotal: "Tax rebate total",
      totalProfit: "Total profit",
      row: "Row",
      netProfit: "Net profit",
      taxRebateAmount: "Tax rebate amount",
      exchangeTaxRatio: "Tax/exchange ratio",
      financialHeaderMissing: "Could not find the header row for the export rebate cost/freight table.",
      financialSourceMissing: "Row {row} skipped: source data columns are incomplete.",
      contractPurchaseAmountTotal: "Contract purchase amount total",
      taxExcludedAmountTotal: "Tax-excluded amount total",
      totalWeight: "Total weight",
      averageUnitPrice: "Average purchase unit price",
      commissionDefault: "Commission default",
      commissionDefaultValue: "Uses 10% when missing",
      quantityKg: "Quantity kg",
      unitPriceUsdKg: "Unit price USD/kg",
      commission: "Commission",
      miscFeeShort: "Misc. fee",
      purchaseUnitPrice: "Purchase unit price",
      purchaseHeaderMissing: "Could not find the required quantity, unit price, exchange rate, and tax rate columns.",
      skippedRowWithReason: "Row {row} skipped: {reason}"
    }
  };

  let sidebarHost = null;
  let shadowRoot = null;
  let selectedFile = null;
  let selectedFileId = null;
  let loadedFiles = [];
  let currentPreviewUrl = null;
  let lastExpandedSidebarWidth = null;
  let isSidebarCollapsed = false;
  let calculatedSheetUpdateTimer = null;
  let currentLanguage = readStoredLanguage();

  if (document.getElementById(SIDEBAR_ID)) {
    return;
  }

  if (window.top !== window.self) {
    setupFrameUploadBridge();
    return;
  }

  if (!isTopCrmIndexPage()) {
    return;
  }

  injectPageSplitStyles();
  createCrmLeftViewport();
  createWorkbenchSidebar();
  applyStoredSidebarWidth();
  applyStoredSidebarCollapsed();
  window.addEventListener("resize", applyStoredSidebarWidth);

  function isTopCrmIndexPage() {
    return window.location.origin === "https://crm.chinaexp365.com" && window.location.pathname === "/cloud/front/crm/index.html";
  }

  /**
   * Creates a real two-pane browser viewport without visually scaling the CRM.
   * The CRM surface uses the remaining width, so if the workbench is 30% wide
   * the CRM receives the other 70% instead of being covered by the sidebar.
   */
  function injectPageSplitStyles() {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      html.crm-workbench-active,
      html.crm-workbench-active body {
        width: 100vw !important;
        min-width: 100vw !important;
        height: 100vh !important;
        overflow: hidden !important;
      }

      html.crm-workbench-active #${LEFT_VIEWPORT_ID} {
        position: fixed !important;
        inset: 0 auto 0 0 !important;
        width: calc(100vw - var(--crm-workbench-sidebar-width, 50vw)) !important;
        height: 100vh !important;
        overflow: auto !important;
        background: #fff !important;
        transform: translateZ(0) !important;
        z-index: 2147483645 !important;
      }

      html.crm-workbench-active #${CRM_SURFACE_ID} {
        width: 100% !important;
        max-width: 100% !important;
        min-height: 100vh !important;
      }
    `;

    document.documentElement.classList.add("crm-workbench-active");
    document.documentElement.appendChild(style);
  }

  function createCrmLeftViewport() {
    const leftViewport = document.createElement("div");
    leftViewport.id = LEFT_VIEWPORT_ID;

    const crmSurface = document.createElement("div");
    crmSurface.id = CRM_SURFACE_ID;

    const existingBodyChildren = Array.from(document.body.childNodes);
    for (const child of existingBodyChildren) {
      crmSurface.appendChild(child);
    }

    leftViewport.appendChild(crmSurface);
    document.body.appendChild(leftViewport);
  }

  function createWorkbenchSidebar() {
    const host = document.createElement("div");
    host.id = SIDEBAR_ID;
    host.setAttribute("aria-label", t("sidebarLabel"));

    Object.assign(host.style, {
      position: "fixed",
      top: "0",
      right: "0",
      width: "var(--crm-workbench-sidebar-width, 50vw)",
      height: "100vh",
      zIndex: "2147483647",
      background: "transparent"
    });

    sidebarHost = host;
    shadowRoot = host.attachShadow({ mode: "open" });
    shadowRoot.appendChild(buildSidebarStyles());
    shadowRoot.appendChild(buildSidebarMarkup());
    bindWorkbenchEvents();

    document.documentElement.appendChild(host);
  }

  function buildSidebarStyles() {
    const style = document.createElement("style");
    style.textContent = `
      :host {
        all: initial;
        color-scheme: light;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      }

      *,
      *::before,
      *::after {
        box-sizing: border-box;
      }

      .workbench {
        position: relative;
        width: 100%;
        height: 100vh;
        display: flex;
        flex-direction: column;
        background: #f8fafc;
        border-left: 1px solid #cbd5e1;
        box-shadow: -8px 0 24px rgba(15, 23, 42, 0.12);
      }

      .workbench-scroll {
        flex: 1 1 auto;
        min-height: 0;
        padding-right: 54px;
        overflow-y: auto;
        overflow-x: hidden;
        scroll-behavior: smooth;
      }

      .section-nav {
        position: absolute;
        top: 56px;
        right: 8px;
        z-index: 3;
        display: grid;
        gap: 8px;
        padding: 6px;
        border: 1px solid #dbe3ef;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.96);
        box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
      }

      .section-nav__button {
        width: 34px;
        min-height: 34px;
        display: grid;
        place-items: center;
        padding: 4px;
        border: 1px solid transparent;
        border-radius: 6px;
        background: #f8fafc;
        color: #334155;
        cursor: pointer;
        font: inherit;
        font-size: 11px;
        font-weight: 800;
        line-height: 1.05;
        text-align: center;
      }

      .section-nav__button:hover,
      .section-nav__button:focus {
        border-color: #0f766e;
        background: #ecfdf5;
        color: #0f3f3a;
        outline: none;
      }

      .workbench.is-collapsed {
        align-items: center;
        background: #ffffff;
      }

      .workbench-topbar {
        flex: 0 0 auto;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 8px;
        min-height: 44px;
        padding: 8px 12px;
        background: #ffffff;
        border-bottom: 1px solid #dbe3ef;
      }

      .language-button {
        min-width: 36px;
        height: 28px;
        display: inline-grid;
        place-items: center;
        padding: 0 8px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #f8fafc;
        color: #334155;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 850;
        line-height: 1;
      }

      .language-button:hover {
        border-color: #0f766e;
        background: #ecfdf5;
        color: #0f3f3a;
      }

      .collapse-button {
        width: 32px;
        height: 32px;
        display: inline-grid;
        place-items: center;
        padding: 0;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
        font: inherit;
        font-size: 18px;
        font-weight: 800;
        line-height: 1;
      }

      .collapse-button:hover {
        background: #f1f5f9;
      }

      .workbench.is-collapsed .workbench-topbar {
        width: 100%;
        justify-content: center;
        gap: 6px;
        padding: 8px;
        border-bottom: 0;
      }

      .workbench.is-collapsed .collapse-button {
        transform: rotate(180deg);
      }

      .workbench.is-collapsed .drop-zone,
      .workbench.is-collapsed .file-history,
      .workbench.is-collapsed .price-calculator,
      .workbench.is-collapsed .document-area,
      .workbench.is-collapsed .action-bar,
      .workbench.is-collapsed .section-nav,
      .workbench.is-collapsed .workbench-scroll,
      .workbench.is-collapsed .resize-handle {
        display: none;
      }

      .resize-handle {
        position: absolute;
        top: 0;
        left: -5px;
        width: 10px;
        height: 100%;
        cursor: col-resize;
        z-index: 2;
      }

      .resize-handle::before {
        content: "";
        position: absolute;
        top: 0;
        left: 4px;
        width: 2px;
        height: 100%;
        background: transparent;
      }

      .resize-handle:hover::before,
      .resize-handle.is-dragging::before {
        background: #0f766e;
      }

      .drop-zone {
        flex: 0 0 auto;
        margin: 16px 16px 12px;
        min-height: 132px;
        display: grid;
        place-items: center;
        gap: 10px;
        padding: 18px;
        text-align: center;
        background: #ffffff;
        border: 2px dashed #64748b;
        border-radius: 8px;
        cursor: pointer;
        transition: border-color 120ms ease, background 120ms ease;
      }

      .drop-zone.is-dragover {
        background: #ecfdf5;
        border-color: #0f766e;
      }

      .drop-zone__title {
        margin: 0;
        color: #0f172a;
        font-size: 18px;
        font-weight: 700;
        line-height: 1.3;
      }

      .drop-zone__hint {
        margin: 0;
        color: #475569;
        font-size: 14px;
        line-height: 1.5;
      }

      .file-history {
        display: none;
        flex: 0 0 auto;
        margin: 0 16px 12px;
        padding: 10px;
        background: #ffffff;
        border: 1px solid #dbe3ef;
        border-radius: 8px;
      }

      .file-history.has-files {
        display: block;
      }

      .price-calculator {
        flex: 0 0 auto;
        margin: 0 16px 12px;
        background: #ffffff;
        border: 1px solid #dbe3ef;
        border-radius: 8px;
        overflow: hidden;
      }

      .price-calculator__summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        color: #0f172a;
        cursor: pointer;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.3;
        list-style: none;
      }

      .price-calculator__summary::-webkit-details-marker {
        display: none;
      }

      .price-calculator__summary::after {
        content: "⌄";
        flex: 0 0 auto;
        color: #64748b;
        font-size: 18px;
        line-height: 1;
        transform: rotate(-90deg);
        transition: transform 120ms ease;
      }

      .price-calculator[open] .price-calculator__summary::after {
        transform: rotate(0deg);
      }

      .price-calculator__body {
        padding: 0 14px 14px;
        border-top: 1px solid #e2e8f0;
      }

      .calculator-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        padding-top: 12px;
      }

      .calculator-field {
        display: grid;
        gap: 5px;
      }

      .calculator-field label {
        color: #475569;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.3;
      }

      .calculator-field input {
        width: 100%;
        min-width: 0;
        height: 36px;
        padding: 0 9px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        font: inherit;
        font-size: 13px;
        line-height: 1.2;
      }

      .calculator-field input:focus {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
        outline: none;
      }

      .calculator-results {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }

      .calculator-result {
        min-width: 0;
        padding: 10px;
        border: 1px solid #dbe3ef;
        border-radius: 6px;
        background: #f8fafc;
      }

      .calculator-result__label {
        display: block;
        color: #64748b;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.3;
      }

      .calculator-result__value {
        display: block;
        margin-top: 4px;
        color: #0f172a;
        font-size: 17px;
        font-weight: 850;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }

      .calculator-breakdown {
        margin: 12px 0 0;
        padding: 10px 12px;
        border-radius: 6px;
        background: #f1f5f9;
        color: #334155;
        font-size: 12px;
        line-height: 1.55;
      }

      .calculator-breakdown p {
        margin: 0;
      }

      .calculator-breakdown p + p {
        margin-top: 4px;
      }

      .calculator-error {
        display: none;
        margin: 10px 0 0;
        padding: 8px 10px;
        border-radius: 6px;
        background: #fee2e2;
        color: #991b1b;
        font-size: 12px;
        line-height: 1.4;
      }

      .calculator-error.is-visible {
        display: block;
      }

      .calculator-file-tools {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 10px;
        align-items: stretch;
        margin-top: 12px;
      }

      .calculator-file-drop {
        min-width: 0;
        display: grid;
        place-items: center;
        min-height: 42px;
        padding: 8px 10px;
        border: 1px dashed #94a3b8;
        border-radius: 6px;
        background: #f8fafc;
        color: #475569;
        cursor: pointer;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.35;
        text-align: center;
      }

      .calculator-file-drop.is-dragover {
        background: #ecfdf5;
        border-color: #0f766e;
        color: #0f3f3a;
      }

      .calculator-file-button {
        min-height: 42px;
        padding: 0 12px;
        border: 0;
        border-radius: 6px;
        background: #0f766e;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 800;
        line-height: 1.2;
        white-space: nowrap;
      }

      .calculator-file-button:hover {
        background: #115e59;
      }

      .calculator-file-button:disabled {
        cursor: not-allowed;
        opacity: 0.62;
      }

      .batch-calculator {
        margin: 0 0 14px;
        padding: 12px;
        border: 1px solid #dbe3ef;
        border-radius: 8px;
        background: #ffffff;
      }

      .batch-calculator__title {
        margin: 0 0 10px;
        color: #0f172a;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.3;
      }

      .batch-summary {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-bottom: 10px;
      }

      .batch-summary__item {
        min-width: 0;
        padding: 9px;
        border-radius: 6px;
        background: #f8fafc;
        border: 1px solid #e2e8f0;
      }

      .batch-summary__label {
        display: block;
        color: #64748b;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.3;
      }

      .batch-summary__value {
        display: block;
        margin-top: 4px;
        color: #0f172a;
        font-size: 14px;
        font-weight: 850;
        line-height: 1.25;
        overflow-wrap: anywhere;
      }

      .batch-table-wrap {
        overflow: auto;
        border: 1px solid #dbe3ef;
        border-radius: 6px;
      }

      .batch-table {
        width: max-content;
        min-width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }

      .batch-table th,
      .batch-table td {
        padding: 7px 8px;
        border-bottom: 1px solid #e2e8f0;
        color: #0f172a;
        text-align: right;
        white-space: nowrap;
      }

      .batch-table th:first-child,
      .batch-table td:first-child,
      .batch-table th:last-child,
      .batch-table td:last-child {
        text-align: left;
      }

      .batch-table th {
        background: #f8fafc;
        color: #475569;
        font-weight: 800;
      }

      .batch-table tr:last-child td {
        border-bottom: 0;
      }

      .batch-warning {
        margin: 10px 0 0;
        color: #92400e;
        font-size: 12px;
        line-height: 1.45;
      }

      .file-history__header {
        margin: 0 0 8px;
        color: #475569;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.3;
      }

      .file-history__list {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 2px;
      }

      .file-chip {
        max-width: 220px;
        flex: 0 0 auto;
        display: inline-flex;
        align-items: center;
        overflow: hidden;
        border: 1px solid #cbd5e1;
        border-radius: 999px;
        background: #f8fafc;
        color: #334155;
        font: inherit;
        font-size: 12px;
        line-height: 1.2;
      }

      .file-chip:hover {
        border-color: #94a3b8;
        background: #eef2f7;
      }

      .file-chip.is-active {
        border-color: #0f766e;
        background: #ccfbf1;
        color: #0f3f3a;
      }

      .file-chip__select {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 7px 8px 7px 10px;
        border: 0;
        background: transparent;
        color: inherit;
        cursor: pointer;
        font: inherit;
      }

      .file-chip__name {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-chip__remove {
        width: 24px;
        height: 100%;
        flex: 0 0 auto;
        display: inline-grid;
        place-items: center;
        padding: 0;
        border: 0;
        background: transparent;
        color: #64748b;
        cursor: pointer;
        font: inherit;
        font-size: 16px;
        line-height: 1;
      }

      .file-chip__remove:hover {
        background: #fee2e2;
        color: #b91c1c;
      }

      .document-area {
        flex: 0 0 auto;
        margin: 0 16px 16px;
        min-height: 360px;
        display: flex;
        flex-direction: column;
        background: #ffffff;
        border: 1px solid #dbe3ef;
        border-radius: 8px;
        overflow: hidden;
      }

      .document-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 12px;
        background: #eef2f7;
        border-bottom: 1px solid #dbe3ef;
      }

      .document-toolbar__meta {
        color: #64748b;
        font-size: 12px;
        line-height: 1.4;
        white-space: nowrap;
      }

      .document-toolbar__label {
        overflow: hidden;
        color: #1e293b;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.4;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .editor {
        flex: 1;
        min-height: 0;
        padding: 18px;
        overflow: auto;
        color: #0f172a;
        font-size: 15px;
        line-height: 1.65;
        outline: none;
      }

      .editor:empty::before {
        content: attr(data-placeholder);
        color: #64748b;
      }

      .preview-scale-content {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        transform-origin: top left;
      }

      .preview-scale-frame {
        position: relative;
        flex: 1 1 auto;
        min-height: 0;
        overflow: scroll;
        background: #f8fafc;
        overscroll-behavior: contain;
        scrollbar-gutter: stable both-edges;
        scrollbar-color: #94a3b8 #f8fafc;
        scrollbar-width: auto;
      }

      .preview-scale-frame::-webkit-scrollbar {
        width: 16px;
        height: 16px;
      }

      .preview-scale-frame::-webkit-scrollbar-track {
        background: #f8fafc;
        border-top: 1px solid #dbe3ef;
        border-left: 1px solid #dbe3ef;
      }

      .preview-scale-frame::-webkit-scrollbar-thumb {
        min-height: 38px;
        min-width: 56px;
        border: 4px solid #f8fafc;
        border-radius: 999px;
        background: #94a3b8;
      }

      .preview-scale-frame::-webkit-scrollbar-thumb:hover {
        background: #64748b;
      }

      .preview-horizontal-scrollbar {
        flex: 0 0 22px;
        display: flex;
        align-items: center;
        padding: 5px 12px;
        border-top: 1px solid #dbe3ef;
        background: #ffffff;
        cursor: pointer;
      }

      .preview-horizontal-scrollbar__track {
        position: relative;
        width: 100%;
        height: 8px;
        border-radius: 999px;
        background: #e2e8f0;
      }

      .preview-horizontal-scrollbar__thumb {
        position: absolute;
        top: 0;
        left: 0;
        min-width: 56px;
        height: 8px;
        border-radius: 999px;
        background: #64748b;
        cursor: grab;
      }

      .preview-horizontal-scrollbar__thumb:active {
        cursor: grabbing;
        background: #475569;
      }

      .preview-scale-surface {
        width: 100%;
        height: 100%;
        min-width: 100%;
        min-height: 100%;
      }

      .preview-zoom-tools {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        border-bottom: 1px solid #dbe3ef;
        background: #ffffff;
      }

      .preview-zoom-tools__spacer {
        flex: 1 1 auto;
      }

      .preview-zoom-button {
        min-width: 34px;
        height: 32px;
        display: inline-grid;
        place-items: center;
        padding: 0 10px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        line-height: 1;
      }

      .preview-zoom-button:hover {
        border-color: #0f766e;
        background: #ecfdf5;
        color: #0f3f3a;
      }

      .preview-zoom-select {
        min-width: 116px;
        height: 32px;
        padding: 0 28px 0 10px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
      }

      .preview-zoom-select:focus,
      .preview-zoom-button:focus {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
        outline: none;
      }

      .preview-window {
        width: 100%;
        height: var(--crm-workbench-preview-height, 360px);
        min-height: 180px;
        margin-bottom: 6px;
        border: 1px solid #dbe3ef;
        border-radius: 6px;
        background: #f8fafc;
        overflow: auto;
      }

      .preview-window.has-preview-zoom {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .image-preview {
        display: block;
        max-width: 100%;
        max-height: 100%;
        margin: 0 auto;
        object-fit: contain;
      }

      .docx-viewer {
        max-width: 780px;
        min-height: 100%;
        margin: 0 auto;
        padding: 28px 34px;
        background: #ffffff;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
      }

      .docx-viewer table {
        width: 100%;
        border-collapse: collapse;
      }

      .docx-viewer td,
      .docx-viewer th {
        border: 1px solid #cbd5e1;
        padding: 6px 8px;
        vertical-align: top;
      }

      .docx-viewer img {
        max-width: 100%;
        height: auto;
      }

      .sheet-viewer {
        width: max-content;
        min-width: 100%;
        height: auto;
        min-height: 100%;
        overflow: visible;
      }

      .sheet-table {
        width: max-content;
        min-width: 100%;
        border-collapse: collapse;
        background: #ffffff;
        font-size: 13px;
      }

      .sheet-table td,
      .sheet-table th {
        min-width: 90px;
        max-width: 260px;
        padding: 7px 9px;
        border: 1px solid #dbe3ef;
        color: #0f172a;
        vertical-align: top;
        word-break: break-word;
      }

      .sheet-table th {
        background: #f8fafc;
        font-weight: 700;
      }

      .sheet-table__calculated {
        background: #ecfdf5;
      }

      .sheet-table th.sheet-table__calculated {
        background: #ccfbf1;
        color: #0f3f3a;
      }

      .open-original-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 36px;
        padding: 0 14px;
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        font-weight: 700;
      }

      .open-original-button:hover {
        background: #f1f5f9;
      }

      .preview-resize-handle {
        height: 14px;
        margin: 0 0 16px;
        cursor: row-resize;
        position: relative;
      }

      .preview-resize-handle::before {
        content: "";
        position: absolute;
        top: 6px;
        left: 35%;
        width: 30%;
        height: 2px;
        border-radius: 999px;
        background: #94a3b8;
      }

      .preview-resize-handle:hover::before,
      .preview-resize-handle.is-dragging::before {
        background: #0f766e;
      }

      .status {
        margin: 0 0 12px;
        padding: 10px 12px;
        border-radius: 6px;
        background: #f1f5f9;
        color: #334155;
        font-size: 13px;
        line-height: 1.45;
      }

      .status--success {
        background: #dcfce7;
        color: #166534;
      }

      .status--error {
        background: #fee2e2;
        color: #991b1b;
      }

      .action-bar {
        flex: 0 0 auto;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 10px;
        margin: 0 16px 16px;
        padding: 16px;
        background: #ffffff;
        border: 1px solid #dbe3ef;
        border-radius: 8px;
      }

      .save-button,
      .fill-button,
      .sync-button {
        width: 100%;
        height: 46px;
        border-radius: 8px;
        cursor: pointer;
        font: inherit;
        font-size: 14px;
        font-weight: 800;
        line-height: 1.2;
        white-space: normal;
      }

      .save-button {
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
      }

      .save-button:hover {
        background: #f1f5f9;
      }

      .fill-button {
        border: 1px solid #0f766e;
        background: #ecfdf5;
        color: #0f3f3a;
      }

      .fill-button:hover {
        background: #ccfbf1;
      }

      .sync-button {
        border: 0;
        background: #0f766e;
        color: #ffffff;
      }

      .sync-button:hover {
        background: #115e59;
      }

      .save-button:active,
      .fill-button:active,
      .sync-button:active {
        transform: translateY(1px);
      }

      .save-button:disabled,
      .fill-button:disabled,
      .sync-button:disabled {
        cursor: wait;
        opacity: 0.68;
      }

      @media (max-width: 520px) {
        .workbench-scroll {
          padding-right: 0;
        }

        .section-nav {
          position: static;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          margin: 10px 16px 0;
          box-shadow: none;
        }

        .section-nav__button {
          width: 100%;
        }

        .calculator-grid,
        .calculator-results,
        .calculator-file-tools,
        .batch-summary {
          grid-template-columns: 1fr;
        }

        .preview-zoom-tools {
          flex-wrap: wrap;
        }

        .preview-zoom-tools__spacer {
          display: none;
        }

        .preview-zoom-select {
          flex: 1 1 140px;
        }

        .action-bar {
          grid-template-columns: 1fr;
        }
      }
    `;
    return style;
  }

  function buildSidebarMarkup() {
    const wrapper = document.createElement("aside");
    wrapper.className = "workbench";
    wrapper.innerHTML = `
      <div class="workbench-topbar">
        <button class="language-button" type="button" data-i18n="languageToggleText" data-i18n-aria-label="languageToggleLabel" data-i18n-title="languageToggleTitle" aria-label="${t("languageToggleLabel")}" title="${t("languageToggleTitle")}">${t("languageToggleText")}</button>
        <button class="collapse-button" type="button" data-i18n-aria-label="foldWorkbench" data-i18n-title="foldWorkbench" aria-label="${t("foldWorkbench")}" title="${t("foldWorkbench")}">‹</button>
      </div>
      <div class="resize-handle" role="separator" data-i18n-aria-label="resizeWorkbench" aria-label="${t("resizeWorkbench")}" aria-orientation="vertical" tabindex="0"></div>
      <nav class="section-nav" data-i18n-aria-label="sectionNavLabel" aria-label="${t("sectionNavLabel")}">
        <button class="section-nav__button" type="button" data-section-target="upload" data-i18n="navUpload" data-i18n-title="navUpload" title="${t("navUpload")}">${t("navUpload")}</button>
        <button class="section-nav__button" type="button" data-section-target="calculator" data-i18n="navCalculator" data-i18n-title="navCalculator" title="${t("navCalculator")}">${t("navCalculator")}</button>
        <button class="section-nav__button" type="button" data-section-target="financial" data-i18n="navFinancial" data-i18n-title="navFinancial" title="${t("navFinancial")}">${t("navFinancial")}</button>
        <button class="section-nav__button" type="button" data-section-target="document" data-i18n="navDocument" data-i18n-title="navDocument" title="${t("navDocument")}">${t("navDocument")}</button>
        <button class="section-nav__button" type="button" data-section-target="actions" data-i18n="navActions" data-i18n-title="navActions" title="${t("navActions")}">${t("navActions")}</button>
      </nav>

      <div class="workbench-scroll">
        <section class="drop-zone" data-section="upload" data-i18n-aria-label="uploadAria" aria-label="${t("uploadAria")}" tabindex="0">
          <div>
            <p class="drop-zone__title" data-i18n="uploadTitle">${t("uploadTitle")}</p>
            <p class="drop-zone__hint" data-i18n="uploadHint">${t("uploadHint")}</p>
          </div>
          <input class="file-input" type="file" accept=".doc,.docx,.pdf,.jpg,.jpeg,.png,.xls,.xlsx,.csv,application/msword,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/jpeg,image/png,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden>
        </section>

        <section class="file-history" data-i18n-aria-label="loadedFiles" aria-label="${t("loadedFiles")}">
          <p class="file-history__header" data-i18n="loadedFiles">${t("loadedFiles")}</p>
          <div class="file-history__list"></div>
        </section>

        <details class="price-calculator" data-section="calculator">
          <summary class="price-calculator__summary" data-i18n="purchaseCalculatorTitle">${t("purchaseCalculatorTitle")}</summary>
          <div class="price-calculator__body">
            <div class="calculator-grid">
              <div class="calculator-field">
                <label for="calculator-usd-price" data-i18n="usdPrice">${t("usdPrice")}</label>
                <input id="calculator-usd-price" data-calculator-input="usdPrice" type="number" min="0" step="0.01" value="2000" inputmode="decimal">
              </div>
              <div class="calculator-field">
                <label for="calculator-weight" data-i18n="weightKg">${t("weightKg")}</label>
                <input id="calculator-weight" data-calculator-input="weightKg" type="number" min="0" step="0.01" value="50" inputmode="decimal">
              </div>
              <div class="calculator-field">
                <label for="calculator-exchange-rate" data-i18n="exchangeRate">${t("exchangeRate")}</label>
                <input id="calculator-exchange-rate" data-calculator-input="exchangeRate" type="number" min="0" step="0.0001" value="6.77" inputmode="decimal">
              </div>
              <div class="calculator-field">
                <label for="calculator-commission-rate" data-i18n="commissionRate">${t("commissionRate")}</label>
                <input id="calculator-commission-rate" data-calculator-input="commissionRate" type="number" min="0" step="0.01" value="5" inputmode="decimal">
              </div>
              <div class="calculator-field">
                <label for="calculator-misc-fee" data-i18n="miscFee">${t("miscFee")}</label>
                <input id="calculator-misc-fee" data-calculator-input="miscFee" type="number" min="0" step="0.01" value="100" inputmode="decimal">
              </div>
              <div class="calculator-field">
                <label for="calculator-tax-rate" data-i18n="taxRate">${t("taxRate")}</label>
                <input id="calculator-tax-rate" data-calculator-input="taxRefundRate" type="number" min="0" step="0.01" value="13" inputmode="decimal">
              </div>
            </div>
            <div class="calculator-results" aria-live="polite">
              <div class="calculator-result">
                <span class="calculator-result__label" data-i18n="contractPurchaseAmount">${t("contractPurchaseAmount")}</span>
                <span class="calculator-result__value" data-calculator-output="contractPurchaseAmount">--</span>
              </div>
              <div class="calculator-result">
                <span class="calculator-result__label" data-i18n="taxExcludedAmount">${t("taxExcludedAmount")}</span>
                <span class="calculator-result__value" data-calculator-output="taxExcludedAmount">--</span>
              </div>
              <div class="calculator-result">
                <span class="calculator-result__label" data-i18n="contractUnitPrice">${t("contractUnitPrice")}</span>
                <span class="calculator-result__value" data-calculator-output="unitPrice">--</span>
              </div>
            </div>
            <div class="calculator-breakdown" data-calculator-output="breakdown"></div>
            <p class="calculator-error" data-calculator-output="error"></p>
            <div class="calculator-file-tools" data-calculation-type="purchase">
              <div class="calculator-file-drop" role="button" tabindex="0" data-i18n="purchaseDrop" data-i18n-aria-label="purchaseDropAria" aria-label="${t("purchaseDropAria")}">
                ${t("purchaseDrop")}
                <input class="calculator-file-input" type="file" accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden>
              </div>
              <button class="calculator-file-button" type="button" data-i18n="calculatePurchaseTable">${t("calculatePurchaseTable")}</button>
            </div>
          </div>
        </details>

        <details class="price-calculator" data-section="financial" open>
          <summary class="price-calculator__summary" data-i18n="financialCalculatorTitle">${t("financialCalculatorTitle")}</summary>
          <div class="price-calculator__body">
            <div class="calculator-file-tools" data-calculation-type="financial">
              <div class="calculator-file-drop" role="button" tabindex="0" data-i18n="financialDrop" data-i18n-aria-label="financialDropAria" aria-label="${t("financialDropAria")}">
                ${t("financialDrop")}
                <input class="calculator-file-input" type="file" accept=".xls,.xlsx,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv" hidden>
              </div>
              <button class="calculator-file-button" type="button" data-i18n="calculateFinancialTable">${t("calculateFinancialTable")}</button>
            </div>
          </div>
        </details>

        <section class="document-area" data-section="document" data-i18n-aria-label="documentAreaAria" aria-label="${t("documentAreaAria")}">
          <div class="document-toolbar">
            <span class="document-toolbar__label" data-empty-document-label="true">${t("documentLabelEmpty")}</span>
            <span class="document-toolbar__meta" data-empty-document-meta="true">${t("noFileLoaded")}</span>
          </div>
          <div class="editor" contenteditable="true" role="textbox" aria-multiline="true" data-i18n-data-placeholder="editorPlaceholder" data-placeholder="${t("editorPlaceholder")}"></div>
        </section>

        <footer class="action-bar" data-section="actions">
          <button class="save-button" type="button" data-i18n="saveEditedCopy">${t("saveEditedCopy")}</button>
          <button class="fill-button" type="button" data-i18n="extractFillCrm">${t("extractFillCrm")}</button>
          <button class="sync-button" type="button" data-i18n="syncUpload">${t("syncUpload")}</button>
        </footer>
      </div>
    `;
    return wrapper;
  }

  function bindWorkbenchEvents() {
    const resizeHandle = shadowRoot.querySelector(".resize-handle");
    const dropZone = shadowRoot.querySelector(".drop-zone");
    const fileInput = shadowRoot.querySelector(".file-input");
    const fileHistory = shadowRoot.querySelector(".file-history__list");
    const editor = shadowRoot.querySelector(".editor");
    const saveButton = shadowRoot.querySelector(".save-button");
    const fillButton = shadowRoot.querySelector(".fill-button");
    const syncButton = shadowRoot.querySelector(".sync-button");
    const calculator = shadowRoot.querySelector(".price-calculator");
    const collapseButton = shadowRoot.querySelector(".collapse-button");
    const calculatorFileDrops = shadowRoot.querySelectorAll(".calculator-file-drop");
    const calculatorFileInputs = shadowRoot.querySelectorAll(".calculator-file-input");
    const calculatorFileButtons = shadowRoot.querySelectorAll(".calculator-file-button");
    const sectionNav = shadowRoot.querySelector(".section-nav");
    const languageButton = shadowRoot.querySelector(".language-button");

    resizeHandle.addEventListener("pointerdown", startSidebarResize);
    resizeHandle.addEventListener("keydown", handleResizeKeydown);
    collapseButton.addEventListener("click", toggleSidebarCollapsed);
    languageButton.addEventListener("click", toggleLanguage);

    dropZone.addEventListener("click", () => fileInput.click());
    dropZone.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        fileInput.click();
      }
    });
    dropZone.addEventListener("dragenter", handleDragEnter);
    dropZone.addEventListener("dragover", handleDragOver);
    dropZone.addEventListener("dragleave", handleDragLeave);
    dropZone.addEventListener("drop", handleFileDrop);
    fileInput.addEventListener("change", () => {
      const [file] = fileInput.files;
      if (file) {
        loadDocumentFile(file);
      }
      fileInput.value = "";
    });
    fileHistory.addEventListener("click", handleFileHistoryClick);
    editor.addEventListener("input", handleCalculatedSheetInput);
    saveButton.addEventListener("click", handleSaveEditedCopy);
    fillButton.addEventListener("click", handleExtractFillClick);
    syncButton.addEventListener("click", handleSyncClick);
    calculator.addEventListener("input", handleCalculatorInput);
    sectionNav.addEventListener("click", handleSectionNavClick);
    calculatorFileButtons.forEach((button) => {
      button.addEventListener("click", handleCalculateCurrentTableClick);
    });
    calculatorFileDrops.forEach((drop) => {
      const fileInput = drop.querySelector(".calculator-file-input");
      drop.addEventListener("click", () => fileInput.click());
      drop.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          fileInput.click();
        }
      });
      drop.addEventListener("dragenter", handleCalculatorFileDragEnter);
      drop.addEventListener("dragover", handleCalculatorFileDragOver);
      drop.addEventListener("dragleave", handleCalculatorFileDragLeave);
      drop.addEventListener("drop", handleCalculatorFileDrop);
    });
    calculatorFileInputs.forEach((input) => {
      input.addEventListener("change", () => {
        const [file] = input.files;
        if (file) {
          loadDocumentFile(file, {
            calculateSpreadsheet: true,
            calculationType: getCalculationTypeFromElement(input)
          });
        }
        input.value = "";
      });
    });
    updatePriceCalculator();
  }

  function readStoredLanguage() {
    try {
      const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
      return storedLanguage === "en" || storedLanguage === "zh" ? storedLanguage : DEFAULT_LANGUAGE;
    } catch (error) {
      return DEFAULT_LANGUAGE;
    }
  }

  function t(key, replacements = {}) {
    const dictionary = TRANSLATIONS[currentLanguage] || TRANSLATIONS[DEFAULT_LANGUAGE];
    const fallbackDictionary = TRANSLATIONS[DEFAULT_LANGUAGE];
    const template = dictionary[key] || fallbackDictionary[key] || key;

    return Object.entries(replacements).reduce((text, [name, value]) => {
      return text.replaceAll(`{${name}}`, String(value));
    }, template);
  }

  function toggleLanguage() {
    setLanguage(currentLanguage === "zh" ? "en" : "zh");
  }

  function setLanguage(language) {
    currentLanguage = language === "en" ? "en" : "zh";

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    } catch (error) {
      // The language toggle remains usable for the current page even if storage is unavailable.
    }

    applyTranslations();
    updatePriceCalculator();
  }

  function applyTranslations() {
    if (!shadowRoot) {
      return;
    }

    if (sidebarHost) {
      sidebarHost.setAttribute("aria-label", t("sidebarLabel"));
    }

    shadowRoot.querySelectorAll("[data-i18n]").forEach((element) => {
      setTranslatedElementText(element, t(element.dataset.i18n));
    });

    shadowRoot.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
      element.setAttribute("aria-label", t(element.dataset.i18nAriaLabel));
    });

    shadowRoot.querySelectorAll("[data-i18n-title]").forEach((element) => {
      element.setAttribute("title", t(element.dataset.i18nTitle));
    });

    shadowRoot.querySelectorAll("[data-i18n-data-placeholder]").forEach((element) => {
      element.dataset.placeholder = t(element.dataset.i18nDataPlaceholder);
    });

    if (!selectedFile) {
      updateDocumentMetaForEmptyState();
    }

    const collapseButton = shadowRoot.querySelector(".collapse-button");
    if (collapseButton) {
      const key = isSidebarCollapsed ? "expandWorkbench" : "foldWorkbench";
      collapseButton.setAttribute("aria-label", t(key));
      collapseButton.setAttribute("title", t(key));
    }

    updatePreviewZoomSelectLabels();
    renderLoadedFiles();
  }

  function setTranslatedElementText(element, text) {
    if (!element.querySelector("input[hidden]")) {
      element.textContent = text;
      return;
    }

    const textNode = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
    if (textNode) {
      textNode.nodeValue = `\n                ${text}\n                `;
    }
  }

  function handleCalculatorInput(event) {
    if (event.target instanceof HTMLInputElement && event.target.matches("[data-calculator-input]")) {
      updatePriceCalculator();
    }
  }

  function handleCalculatedSheetInput(event) {
    const table = event.target instanceof Element ? event.target.closest(".calculated-sheet-table") : null;
    if (!table) {
      return;
    }

    if (calculatedSheetUpdateTimer) {
      window.clearTimeout(calculatedSheetUpdateTimer);
    }

    calculatedSheetUpdateTimer = window.setTimeout(() => {
      updateCalculatedSheetFromTable(table);
    }, 120);
  }

  function updateCalculatedSheetFromTable(table) {
    const sourceRows = readSourceRowsFromCalculatedTable(table);
    const calculationType = getCalculationTypeFromElement(table);
    const batchResult = calculateSpreadsheetBatch(sourceRows, calculationType);
    const batchSummary = shadowRoot.querySelector(".batch-calculator");

    if (batchSummary) {
      batchSummary.outerHTML = buildBatchCalculationHtml(batchResult, calculationType);
    }

    updateCalculatedSheetResultCells(table, batchResult, calculationType);
  }

  function readSourceRowsFromCalculatedTable(table) {
    const originalColumnCount = Number(table.dataset.originalColumnCount);
    const sourceColumnCount = Number.isFinite(originalColumnCount) && originalColumnCount > 0
      ? originalColumnCount
      : Math.max(0, table.rows[0]?.cells.length - getCalculatedHeaders(getCalculationTypeFromElement(table)).length || 0);

    return Array.from(table.rows).map((row) => {
      return Array.from(row.cells)
        .slice(0, sourceColumnCount)
        .map((cell) => normalizeText(cell.textContent));
    });
  }

  function updateCalculatedSheetResultCells(table, batchResult, calculationType) {
    const resultByRowIndex = new Map();
    if (batchResult) {
      batchResult.items.forEach((item) => {
        resultByRowIndex.set(item.sourceRowIndex, item);
      });
    }

    const calculatedHeaders = getCalculatedHeaders(calculationType);
    const headerRowIndex = batchResult?.headerRowIndex ?? Number(table.dataset.headerRowIndex || 0);
    const headerCells = Array.from(table.rows[headerRowIndex]?.cells || []).map((cell) => normalizeText(cell.textContent));
    const targetColumns = calculationType === "financial"
      ? findFinancialTargetColumns(headerCells)
      : null;
    Array.from(table.rows).forEach((row, rowIndex) => {
      const calculatedCells = getCalculatedSheetCells(rowIndex, headerRowIndex, resultByRowIndex, calculatedHeaders, calculationType);
      if (targetColumns) {
        targetColumns.forEach((columnIndex, cellIndex) => {
          const cell = row.cells[columnIndex];
          if (cell) {
            cell.textContent = calculatedCells[cellIndex] || "";
            cell.classList.add("sheet-table__calculated");
          }
        });
      } else {
        const resultCells = Array.from(row.cells).slice(-calculatedHeaders.length);
        resultCells.forEach((cell, cellIndex) => {
          cell.textContent = calculatedCells[cellIndex] || "";
        });
      }
    });

    if (batchResult && Number.isInteger(batchResult.headerRowIndex)) {
      table.dataset.headerRowIndex = String(batchResult.headerRowIndex);
    }
  }

  function getCalculationTypeFromElement(element) {
    const typedElement = element instanceof Element ? element.closest("[data-calculation-type]") : null;
    return typedElement?.dataset.calculationType === "purchase" ? "purchase" : "financial";
  }

  function handleSectionNavClick(event) {
    const navButton = event.target instanceof Element ? event.target.closest("[data-section-target]") : null;
    if (!navButton) {
      return;
    }

    const sectionName = navButton.dataset.sectionTarget;
    const targetSection = shadowRoot.querySelector(`[data-section="${sectionName}"]`);
    if (!targetSection) {
      return;
    }

    if (targetSection instanceof HTMLDetailsElement) {
      targetSection.open = true;
    }

    targetSection.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  }

  function handleCalculateCurrentTableClick(event) {
    if (!selectedFile || !isSpreadsheet(selectedFile)) {
      showSidebarStatus(t("calculatorNeedSpreadsheet"), "error");
      return;
    }

    renderSpreadsheetFile(selectedFile, {
      calculate: true,
      calculationType: getCalculationTypeFromElement(event.currentTarget)
    });
  }

  function handleCalculatorFileDragEnter(event) {
    event.preventDefault();
    event.currentTarget.classList.add("is-dragover");
  }

  function handleCalculatorFileDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleCalculatorFileDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove("is-dragover");
    }
  }

  function handleCalculatorFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("is-dragover");

    const [file] = event.dataTransfer.files;
    if (!file) {
      return;
    }

    if (!isSpreadsheet(file)) {
      showSidebarStatus(t("calculatorOnlySpreadsheet"), "error");
      return;
    }

    loadDocumentFile(file, {
      calculateSpreadsheet: true,
      calculationType: getCalculationTypeFromElement(event.currentTarget)
    });
  }

  function updatePriceCalculator() {
    const values = readCalculatorValues();
    const contractPurchaseAmountOutput = shadowRoot.querySelector('[data-calculator-output="contractPurchaseAmount"]');
    const taxExcludedAmountOutput = shadowRoot.querySelector('[data-calculator-output="taxExcludedAmount"]');
    const unitOutput = shadowRoot.querySelector('[data-calculator-output="unitPrice"]');
    const breakdownOutput = shadowRoot.querySelector('[data-calculator-output="breakdown"]');
    const errorOutput = shadowRoot.querySelector('[data-calculator-output="error"]');

    const validationError = getCalculatorValidationError(values);
    if (validationError) {
      contractPurchaseAmountOutput.textContent = "--";
      taxExcludedAmountOutput.textContent = "--";
      unitOutput.textContent = "--";
      breakdownOutput.innerHTML = "";
      errorOutput.textContent = validationError;
      errorOutput.classList.add("is-visible");
      return;
    }

    const result = calculateContractPrice(values);

    contractPurchaseAmountOutput.textContent = formatCurrency(result.contractPurchaseAmount);
    taxExcludedAmountOutput.textContent = formatCurrency(result.taxExcludedAmount);
    unitOutput.textContent = `${formatCurrency(result.unitPrice)}/kg`;
    breakdownOutput.innerHTML = `
      <p>${escapeHtml(t("breakdownBase", {
        base: formatMoney(result.basePriceRmb),
        usd: formatCompactNumber(values.usdPrice),
        weight: formatCompactNumber(values.weightKg),
        rate: formatCompactNumber(values.exchangeRate)
      }))}</p>
      <p>${escapeHtml(t("breakdownCommission", {
        commission: formatMoney(result.commission),
        rate: formatCompactNumber(values.commissionRate)
      }))}</p>
      <p>${escapeHtml(t("breakdownContract", {
        base: formatMoney(result.basePriceRmb),
        commission: formatMoney(result.commission),
        misc: formatMoney(values.miscFee),
        denominator: formatCompactNumber(result.denominator, 8),
        contract: formatMoney(result.contractPurchaseAmount)
      }))}</p>
      <p>${escapeHtml(t("breakdownTaxExcluded", {
        contract: formatMoney(result.contractPurchaseAmount),
        taxRate: formatCompactNumber(values.taxRefundRate),
        amount: formatMoney(result.taxExcludedAmount)
      }))}</p>
    `;
    errorOutput.textContent = "";
    errorOutput.classList.remove("is-visible");
  }

  function calculateContractPrice(values) {
    const basePriceRmb = values.usdPrice * values.weightKg * values.exchangeRate;
    const commission = basePriceRmb * (values.commissionRate / 100);
    const taxRate = values.taxRefundRate / 100;
    const denominator = roundToPrecision(1 - (taxRate / (1 + taxRate)), 8);
    const netContractBase = basePriceRmb - commission - values.miscFee;
    const contractPurchaseAmount = netContractBase / denominator;
    const taxExcludedAmount = contractPurchaseAmount / (1 + taxRate);
    const unitPrice = contractPurchaseAmount / values.weightKg;

    return {
      basePriceRmb,
      commission,
      denominator,
      contractPurchaseAmount,
      taxExcludedAmount,
      unitPrice
    };
  }

  function readCalculatorValues() {
    const values = {};
    shadowRoot.querySelectorAll("[data-calculator-input]").forEach((input) => {
      values[input.dataset.calculatorInput] = parseDecimalInput(input.value);
    });
    return values;
  }

  function getCalculatorValidationError(values) {
    const requiredFields = [
      ["usdPrice", t("usdPrice")],
      ["weightKg", t("weightKg")],
      ["exchangeRate", t("exchangeRate")],
      ["commissionRate", t("commissionRate")],
      ["miscFee", t("miscFee")],
      ["taxRefundRate", t("taxRate")]
    ];

    const missingField = requiredFields.find(([key]) => !Number.isFinite(values[key]));
    if (missingField) {
      return t("invalidField", { field: missingField[1] });
    }

    if (values.weightKg <= 0) {
      return t("weightPositive");
    }

    if (values.usdPrice < 0 || values.exchangeRate <= 0 || values.commissionRate < 0 || values.miscFee < 0 || values.taxRefundRate < 0) {
      return t("nonNegativeInputs");
    }

    return "";
  }

  function parseDecimalInput(value) {
    if (typeof value === "number") {
      return value;
    }

    const normalizedValue = String(value || "").trim().replace(/,/g, "");
    if (!normalizedValue) {
      return Number.NaN;
    }
    const numericMatch = normalizedValue.match(/[-+]?\d+(?:\.\d+)?/);
    return numericMatch ? Number(numericMatch[0]) : Number.NaN;
  }

  function formatMoney(value) {
    return value.toLocaleString(currentLanguage === "en" ? "en-US" : "zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatCompactNumber(value, maximumFractionDigits = 4) {
    return value.toLocaleString(currentLanguage === "en" ? "en-US" : "zh-CN", {
      minimumFractionDigits: 0,
      maximumFractionDigits
    });
  }

  function formatCurrency(value) {
    return currentLanguage === "en" ? `${formatMoney(value)} RMB` : `${formatMoney(value)} 元`;
  }

  function roundToPrecision(value, precision) {
    const multiplier = 10 ** precision;
    return Math.round(value * multiplier) / multiplier;
  }

  function startSidebarResize(event) {
    if (isSidebarCollapsed) {
      return;
    }

    event.preventDefault();
    const resizeHandle = event.currentTarget;
    resizeHandle.classList.add("is-dragging");
    resizeHandle.setPointerCapture(event.pointerId);

    const onPointerMove = (moveEvent) => {
      setSidebarWidth(window.innerWidth - moveEvent.clientX);
    };

    const stopResize = () => {
      resizeHandle.classList.remove("is-dragging");
      resizeHandle.removeEventListener("pointermove", onPointerMove);
      resizeHandle.removeEventListener("pointerup", stopResize);
      resizeHandle.removeEventListener("pointercancel", stopResize);
    };

    resizeHandle.addEventListener("pointermove", onPointerMove);
    resizeHandle.addEventListener("pointerup", stopResize);
    resizeHandle.addEventListener("pointercancel", stopResize);
  }

  function handleResizeKeydown(event) {
    if (isSidebarCollapsed) {
      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
      return;
    }

    event.preventDefault();
    const currentWidth = getCurrentSidebarWidth();
    const direction = event.key === "ArrowLeft" ? 1 : -1;
    setSidebarWidth(currentWidth + direction * 24);
  }

  function applyStoredSidebarWidth() {
    if (isSidebarCollapsed) {
      setCollapsedSidebarWidth({ persist: false });
      return;
    }

    const storedWidth = readStoredWidth();
    const fallbackWidth = Math.round(window.innerWidth * DEFAULT_SIDEBAR_RATIO);
    setSidebarWidth(storedWidth || fallbackWidth, { persist: false, notifyCrm: false });
  }

  function setSidebarWidth(widthPx, options = {}) {
    if (isSidebarCollapsed) {
      return;
    }

    const shouldPersist = options.persist !== false;
    const shouldNotifyCrm = options.notifyCrm !== false;
    const clampedWidth = clampSidebarWidth(widthPx);
    document.documentElement.style.setProperty("--crm-workbench-sidebar-width", `${clampedWidth}px`);

    if (sidebarHost) {
      sidebarHost.style.width = `${clampedWidth}px`;
    }

    if (shouldPersist) {
      try {
        window.localStorage.setItem(WIDTH_STORAGE_KEY, String(clampedWidth));
      } catch (error) {
        // Some managed browsers can disable localStorage. Resizing still works.
      }
    }

    if (shouldNotifyCrm) {
      window.dispatchEvent(new Event("resize"));
    }
  }

  function getCurrentSidebarWidth() {
    if (isSidebarCollapsed && lastExpandedSidebarWidth) {
      return lastExpandedSidebarWidth;
    }

    if (!sidebarHost) {
      return Math.round(window.innerWidth * DEFAULT_SIDEBAR_RATIO);
    }
    return sidebarHost.getBoundingClientRect().width;
  }

  function clampSidebarWidth(widthPx) {
    const maxWidth = Math.max(MIN_SIDEBAR_WIDTH, window.innerWidth - MIN_CRM_WIDTH);
    return Math.min(Math.max(Math.round(widthPx), MIN_SIDEBAR_WIDTH), maxWidth);
  }

  function readStoredWidth() {
    try {
      const storedValue = Number(window.localStorage.getItem(WIDTH_STORAGE_KEY));
      return Number.isFinite(storedValue) && storedValue > 0 ? storedValue : null;
    } catch (error) {
      return null;
    }
  }

  function toggleSidebarCollapsed() {
    setSidebarCollapsed(!isSidebarCollapsed);
  }

  function applyStoredSidebarCollapsed() {
    let shouldCollapse = false;
    try {
      shouldCollapse = window.localStorage.getItem(COLLAPSED_STORAGE_KEY) === "true";
    } catch (error) {
      shouldCollapse = false;
    }

    if (shouldCollapse) {
      setSidebarCollapsed(true, { persist: false });
    }
  }

  function setSidebarCollapsed(shouldCollapse, options = {}) {
    const shouldPersist = options.persist !== false;
    const workbench = shadowRoot.querySelector(".workbench");
    const collapseButton = shadowRoot.querySelector(".collapse-button");

    if (shouldCollapse === isSidebarCollapsed) {
      return;
    }

    if (shouldCollapse) {
      lastExpandedSidebarWidth = getCurrentSidebarWidth();
      isSidebarCollapsed = true;
      workbench.classList.add("is-collapsed");
      collapseButton.setAttribute("aria-label", t("expandWorkbench"));
      collapseButton.setAttribute("title", t("expandWorkbench"));
      setCollapsedSidebarWidth();
    } else {
      isSidebarCollapsed = false;
      workbench.classList.remove("is-collapsed");
      collapseButton.setAttribute("aria-label", t("foldWorkbench"));
      collapseButton.setAttribute("title", t("foldWorkbench"));
      setSidebarWidth(lastExpandedSidebarWidth || readStoredWidth() || Math.round(window.innerWidth * DEFAULT_SIDEBAR_RATIO), { persist: false });
    }

    if (shouldPersist) {
      try {
        window.localStorage.setItem(COLLAPSED_STORAGE_KEY, String(shouldCollapse));
      } catch (error) {
        // The fold control remains usable even if storage is unavailable.
      }
    }

    window.dispatchEvent(new Event("resize"));
  }

  function setCollapsedSidebarWidth() {
    document.documentElement.style.setProperty("--crm-workbench-sidebar-width", `${COLLAPSED_SIDEBAR_WIDTH}px`);
    if (sidebarHost) {
      sidebarHost.style.width = `${COLLAPSED_SIDEBAR_WIDTH}px`;
    }
  }

  function handleDragEnter(event) {
    event.preventDefault();
    event.currentTarget.classList.add("is-dragover");
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  function handleDragLeave(event) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      event.currentTarget.classList.remove("is-dragover");
    }
  }

  function handleFileDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.remove("is-dragover");

    const [file] = event.dataTransfer.files;
    if (file) {
      loadDocumentFile(file);
    }
  }

  async function loadDocumentFile(file, options = {}) {
    const fileEntry = addLoadedFile(file);
    renderLoadedFiles();
    selectLoadedFile(fileEntry.id, options);
  }

  function addLoadedFile(file) {
    const existingFile = loadedFiles.find((entry) => {
      return entry.file.name === file.name && entry.file.size === file.size && entry.file.lastModified === file.lastModified;
    });

    if (existingFile) {
      return existingFile;
    }

    const fileEntry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file
    };
    loadedFiles = [fileEntry, ...loadedFiles].slice(0, 12);
    return fileEntry;
  }

  function selectLoadedFile(fileId, options = {}) {
    const fileEntry = loadedFiles.find((entry) => entry.id === fileId);
    if (!fileEntry) {
      return;
    }

    selectedFileId = fileEntry.id;
    selectedFile = fileEntry.file;
    updateDocumentMeta(selectedFile);
    renderLoadedFiles();
    renderSelectedFile(selectedFile, options);
  }

  function renderSelectedFile(file, options = {}) {
    const editor = shadowRoot.querySelector(".editor");
    editor.innerHTML = `<p class="status">${escapeHtml(t("loadingFile", { filename: file.name }))}</p>`;

    if (isPdf(file)) {
      renderPdfPreview(file);
      return;
    }

    if (isPreviewableImage(file)) {
      renderImagePreview(file);
      return;
    }

    if (isDocx(file)) {
      renderDocxFile(file);
      return;
    }

    if (isDoc(file)) {
      renderLegacyDocPreview(file);
      return;
    }

    if (isSpreadsheet(file)) {
      renderSpreadsheetFile(file, {
        calculate: options.calculateSpreadsheet === true,
        calculationType: options.calculationType
      });
      return;
    }

    editor.innerHTML = `<p class="status">${escapeHtml(t("unsupportedFile"))}</p>`;
  }

  function renderPdfPreview(file) {
    const editor = shadowRoot.querySelector(".editor");
    const fileUrl = createPreviewUrl(file);
    editor.innerHTML = `
      ${buildScalablePreviewWindow(`
        <iframe class="preview-scale-content pdf-preview" src="${fileUrl}" title="${escapeHtml(t("pdfPreviewTitle"))}" data-pdf-preview-url="${fileUrl}"></iframe>
      `)}
      <div class="preview-resize-handle" contenteditable="false" role="separator" aria-label="${escapeHtml(t("resizePreview"))}" aria-orientation="horizontal" tabindex="0"></div>
      <p class="status">${escapeHtml(t("pdfLoaded"))}</p>
      <p>${escapeHtml(t("typeNotes"))}</p>
    `;
    applyStoredPreviewHeight();
    bindPreviewResize();
    bindPreviewZoomControls();
  }

  function buildScalablePreviewWindow(contentHtml, options = {}) {
    const extraClass = options.extraClass ? ` ${options.extraClass}` : "";
    return `<div class="preview-window has-preview-zoom${extraClass}" contenteditable="false">
      ${buildPreviewZoomToolbarHtml(readStoredPreviewZoom())}
      <div class="preview-scale-frame">
        <div class="preview-scale-surface">
          ${contentHtml}
        </div>
      </div>
      <div class="preview-horizontal-scrollbar" aria-hidden="true">
        <div class="preview-horizontal-scrollbar__track">
          <div class="preview-horizontal-scrollbar__thumb"></div>
        </div>
      </div>
    </div>`;
  }

  function buildPreviewZoomToolbarHtml(selectedZoom) {
    return `<div class="preview-zoom-tools" role="group" data-i18n-aria-label="previewZoomControls" aria-label="${escapeHtml(t("previewZoomControls"))}">
      <button class="preview-zoom-button" type="button" data-preview-zoom-action="out" data-i18n-aria-label="previewZoomOut" data-i18n-title="previewZoomOut" aria-label="${escapeHtml(t("previewZoomOut"))}" title="${escapeHtml(t("previewZoomOut"))}">−</button>
      <select class="preview-zoom-select" data-preview-zoom-select data-i18n-aria-label="previewZoomLabel" aria-label="${escapeHtml(t("previewZoomLabel"))}">
        ${buildPreviewZoomOptionsHtml(selectedZoom)}
      </select>
      <button class="preview-zoom-button" type="button" data-preview-zoom-action="in" data-i18n-aria-label="previewZoomIn" data-i18n-title="previewZoomIn" aria-label="${escapeHtml(t("previewZoomIn"))}" title="${escapeHtml(t("previewZoomIn"))}">+</button>
    </div>`;
  }

  function buildPreviewZoomOptionsHtml(selectedZoom) {
    const numericOptions = PREVIEW_ZOOM_LEVELS.map((zoomLevel) => [String(zoomLevel), `${zoomLevel}%`]);

    return numericOptions.map(([value, label]) => {
      const selectedAttribute = value === selectedZoom ? " selected" : "";
      return `<option value="${escapeHtml(value)}"${selectedAttribute}>${escapeHtml(label)}</option>`;
    }).join("");
  }

  function bindPreviewZoomControls() {
    const previewWindow = shadowRoot.querySelector(".preview-window");
    const zoomSelect = shadowRoot.querySelector("[data-preview-zoom-select]");

    if (!previewWindow || !zoomSelect) {
      return;
    }

    zoomSelect.addEventListener("change", () => {
      setPreviewZoom(zoomSelect.value);
    });

    previewWindow.querySelectorAll("[data-preview-zoom-action]").forEach((button) => {
      button.addEventListener("click", () => {
        handlePreviewZoomAction(button.dataset.previewZoomAction);
      });
    });

    setPreviewZoom(readSelectedPreviewZoom(), { persist: false });
    bindPreviewHorizontalScrollbar();
  }

  function handlePreviewZoomAction(action) {
    const currentZoom = readSelectedPreviewZoom();
    const currentLevel = getNearestPreviewZoomLevel(currentZoom);
    const currentIndex = PREVIEW_ZOOM_LEVELS.indexOf(currentLevel);
    const nextIndex = action === "out"
      ? Math.max(0, currentIndex - 1)
      : Math.min(PREVIEW_ZOOM_LEVELS.length - 1, currentIndex + 1);

    setPreviewZoom(String(PREVIEW_ZOOM_LEVELS[nextIndex]));
  }

  function setPreviewZoom(zoomValue, options = {}) {
    const sanitizedZoom = sanitizePreviewZoom(zoomValue);
    const zoomSelect = shadowRoot.querySelector("[data-preview-zoom-select]");

    if (zoomSelect) {
      zoomSelect.value = sanitizedZoom;
    }

    applyPreviewScale(sanitizedZoom);
    updatePreviewHorizontalScrollbar();

    if (options.persist !== false) {
      try {
        window.localStorage.setItem(PREVIEW_ZOOM_STORAGE_KEY, sanitizedZoom);
      } catch (error) {
        // The file size control still works for the current preview if storage is unavailable.
      }
    }
  }

  function readSelectedPreviewZoom() {
    const zoomSelect = shadowRoot.querySelector("[data-preview-zoom-select]");
    return sanitizePreviewZoom(zoomSelect?.value || readStoredPreviewZoom());
  }

  function readStoredPreviewZoom() {
    try {
      return sanitizePreviewZoom(
        window.localStorage.getItem(PREVIEW_ZOOM_STORAGE_KEY)
        || window.localStorage.getItem("crmWorkbenchPdfZoom")
      );
    } catch (error) {
      return DEFAULT_PREVIEW_ZOOM;
    }
  }

  function sanitizePreviewZoom(zoomValue) {
    const normalizedZoom = String(zoomValue || "").trim();

    const numericZoom = Number(normalizedZoom);
    if (PREVIEW_ZOOM_LEVELS.includes(numericZoom)) {
      return String(numericZoom);
    }

    return DEFAULT_PREVIEW_ZOOM;
  }

  function applyPreviewScale(zoomValue) {
    const scaleContent = shadowRoot.querySelector(".preview-scale-content");
    const scaleSurface = shadowRoot.querySelector(".preview-scale-surface");
    if (!scaleContent || !scaleSurface) {
      return;
    }

    const scale = Number(sanitizePreviewZoom(zoomValue)) / 100;
    scaleSurface.style.width = `${Math.max(100, scale * 100)}%`;
    scaleSurface.style.height = `${Math.max(100, scale * 100)}%`;
    scaleContent.style.width = "100%";
    scaleContent.style.height = "100%";
    scaleContent.style.transform = "";
    scaleContent.style.zoom = String(scale);
  }

  function getNearestPreviewZoomLevel(zoomValue) {
    const numericZoom = Number(zoomValue);
    if (Number.isFinite(numericZoom)) {
      return PREVIEW_ZOOM_LEVELS.reduce((nearestLevel, level) => {
        return Math.abs(level - numericZoom) < Math.abs(nearestLevel - numericZoom) ? level : nearestLevel;
      }, PREVIEW_ZOOM_LEVELS[0]);
    }

    return 100;
  }

  function updatePreviewZoomSelectLabels() {
    const zoomSelect = shadowRoot?.querySelector("[data-preview-zoom-select]");
    if (!zoomSelect) {
      return;
    }

    const selectedZoom = sanitizePreviewZoom(zoomSelect.value);
    zoomSelect.innerHTML = buildPreviewZoomOptionsHtml(selectedZoom);
    zoomSelect.value = selectedZoom;
  }

  function bindPreviewHorizontalScrollbar() {
    const frame = shadowRoot.querySelector(".preview-scale-frame");
    const scrollbar = shadowRoot.querySelector(".preview-horizontal-scrollbar");
    const track = shadowRoot.querySelector(".preview-horizontal-scrollbar__track");
    const thumb = shadowRoot.querySelector(".preview-horizontal-scrollbar__thumb");

    if (!frame || !scrollbar || !track || !thumb || scrollbar.dataset.bound === "true") {
      updatePreviewHorizontalScrollbar();
      return;
    }

    scrollbar.dataset.bound = "true";
    frame.addEventListener("scroll", updatePreviewHorizontalScrollbar);
    window.addEventListener("resize", updatePreviewHorizontalScrollbar);

    scrollbar.addEventListener("click", (event) => {
      if (event.target === thumb) {
        return;
      }

      const trackRect = track.getBoundingClientRect();
      const thumbWidth = thumb.getBoundingClientRect().width;
      const usableWidth = Math.max(1, trackRect.width - thumbWidth);
      const targetLeft = Math.min(Math.max(0, event.clientX - trackRect.left - (thumbWidth / 2)), usableWidth);
      frame.scrollLeft = (targetLeft / usableWidth) * getPreviewHorizontalScrollMax(frame);
    });

    thumb.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      const startX = event.clientX;
      const startScrollLeft = frame.scrollLeft;
      const trackWidth = track.getBoundingClientRect().width;
      const thumbWidth = thumb.getBoundingClientRect().width;
      const usableWidth = Math.max(1, trackWidth - thumbWidth);
      const maxScrollLeft = getPreviewHorizontalScrollMax(frame);
      thumb.setPointerCapture(event.pointerId);

      const handlePointerMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        frame.scrollLeft = startScrollLeft + ((deltaX / usableWidth) * maxScrollLeft);
      };

      const stopDragging = () => {
        thumb.removeEventListener("pointermove", handlePointerMove);
        thumb.removeEventListener("pointerup", stopDragging);
        thumb.removeEventListener("pointercancel", stopDragging);
      };

      thumb.addEventListener("pointermove", handlePointerMove);
      thumb.addEventListener("pointerup", stopDragging);
      thumb.addEventListener("pointercancel", stopDragging);
    });

    window.requestAnimationFrame(updatePreviewHorizontalScrollbar);
  }

  function updatePreviewHorizontalScrollbar() {
    const frame = shadowRoot?.querySelector(".preview-scale-frame");
    const track = shadowRoot?.querySelector(".preview-horizontal-scrollbar__track");
    const thumb = shadowRoot?.querySelector(".preview-horizontal-scrollbar__thumb");
    if (!frame || !track || !thumb) {
      return;
    }

    const maxScrollLeft = getPreviewHorizontalScrollMax(frame);
    const trackWidth = track.clientWidth;
    const visibleRatio = frame.scrollWidth > 0 ? Math.min(1, frame.clientWidth / frame.scrollWidth) : 1;
    const thumbWidth = Math.max(56, Math.round(trackWidth * visibleRatio));
    const usableWidth = Math.max(0, trackWidth - thumbWidth);
    const thumbLeft = maxScrollLeft > 0 ? Math.round((frame.scrollLeft / maxScrollLeft) * usableWidth) : 0;

    thumb.style.width = `${thumbWidth}px`;
    thumb.style.transform = `translateX(${thumbLeft}px)`;
  }

  function getPreviewHorizontalScrollMax(frame) {
    return Math.max(0, frame.scrollWidth - frame.clientWidth);
  }

  function renderImagePreview(file) {
    const editor = shadowRoot.querySelector(".editor");
    const fileUrl = createPreviewUrl(file);
    editor.innerHTML = `
      ${buildScalablePreviewWindow(`
        <img class="preview-scale-content image-preview" src="${fileUrl}" alt="${escapeHtml(file.name)} preview">
      `)}
      <div class="preview-resize-handle" contenteditable="false" role="separator" aria-label="${escapeHtml(t("resizePreview"))}" aria-orientation="horizontal" tabindex="0"></div>
      <p class="status">${escapeHtml(t("imageLoaded"))}</p>
      <p></p>
    `;
    applyStoredPreviewHeight();
    bindPreviewResize();
    bindPreviewZoomControls();
  }

  async function renderDocxFile(file) {
    const editor = shadowRoot.querySelector(".editor");

    if (!window.mammoth) {
      renderWordPlaceholder(file, t("docxLibraryMissing"));
      return;
    }

    editor.innerHTML = `<p class="status">${escapeHtml(t("convertingFile", { filename: file.name }))}</p>`;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await window.mammoth.convertToHtml({ arrayBuffer });
      const warningHtml = result.messages.length > 0
        ? `<p class="status">${escapeHtml(result.messages.map((message) => message.message).join(" "))}</p>`
        : "";

      editor.innerHTML = `
        ${warningHtml}
        ${buildScalablePreviewWindow(`
          <article class="preview-scale-content docx-viewer" contenteditable="true">
            ${result.value || `<p>${escapeHtml(t("docxNoText"))}</p>`}
          </article>
        `, { extraClass: "docx-preview-window" })}
        <div class="preview-resize-handle" contenteditable="false" role="separator" aria-label="${escapeHtml(t("resizePreview"))}" aria-orientation="horizontal" tabindex="0"></div>
      `;
      applyStoredPreviewHeight();
      bindPreviewResize();
      bindPreviewZoomControls();
    } catch (error) {
      renderWordPlaceholder(file, t("docxRenderError", { message: error.message || "unknown conversion error" }));
    }
  }

  function renderWordPlaceholder(file, conversionMessage) {
    const editor = shadowRoot.querySelector(".editor");
    editor.innerHTML = `
      <p class="status">${escapeHtml(file.name)} ${escapeHtml(conversionMessage)}</p>
      <p>${escapeHtml(t("typeNotes"))}</p>
    `;
  }

  function renderLegacyDocPreview(file) {
    const editor = shadowRoot.querySelector(".editor");
    editor.innerHTML = `
      ${buildScalablePreviewWindow(`
        <div class="preview-scale-content docx-viewer" contenteditable="true">
          <p><strong>${escapeHtml(file.name)}</strong></p>
          <p>${escapeHtml(t("legacyDocLoaded", { filename: file.name }))}</p>
          <p>${escapeHtml(t("legacyDocInstruction"))}</p>
          <button class="open-original-button" type="button">${escapeHtml(t("downloadOriginalDoc"))}</button>
        </div>
      `, { extraClass: "docx-preview-window" })}
      <div class="preview-resize-handle" contenteditable="false" role="separator" aria-label="${escapeHtml(t("resizePreview"))}" aria-orientation="horizontal" tabindex="0"></div>
    `;

    const openButton = editor.querySelector(".open-original-button");
    openButton.addEventListener("click", () => {
      const fileUrl = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileUrl;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
    });
    applyStoredPreviewHeight();
    bindPreviewResize();
    bindPreviewZoomControls();
  }

  async function renderSpreadsheetFile(file, options = {}) {
    const editor = shadowRoot.querySelector(".editor");
    const shouldCalculate = options.calculate === true;
    const calculationType = options.calculationType === "purchase" ? "purchase" : "financial";

    if (!window.XLSX) {
      editor.innerHTML = `<p class="status status--error">${escapeHtml(t("tableLibraryMissing"))}</p>`;
      return;
    }

    editor.innerHTML = `<p class="status">${escapeHtml(t("openingTable", { filename: file.name }))}</p>`;

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(arrayBuffer, {
        type: "array",
        cellDates: true
      });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        editor.innerHTML = `<p class="status">${escapeHtml(t("noWorksheets"))}</p>`;
        return;
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const sheetRows = window.XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false
      });
      const batchResult = shouldCalculate ? calculateSpreadsheetBatch(sheetRows, calculationType) : null;
      const batchCalculationHtml = shouldCalculate ? buildBatchCalculationHtml(batchResult, calculationType) : "";
      const tableHtml = shouldCalculate
        ? buildCalculatedSheetTableHtml(sheetRows, batchResult, calculationType)
        : buildSheetTableHtml(sheetRows, calculationType);
      const previewClass = shouldCalculate ? " calculated-sheet-preview" : "";
      const statusText = shouldCalculate
        ? t("showingCalculatedSheet", { sheetName: firstSheetName, label: getCalculationLabel(calculationType) })
        : t("showingSheet", { sheetName: firstSheetName });

      editor.innerHTML = `
        ${batchCalculationHtml}
        <p class="status">${escapeHtml(statusText)}</p>
        ${buildScalablePreviewWindow(`
          <div class="preview-scale-content sheet-viewer">
            ${tableHtml}
          </div>
        `, { extraClass: previewClass.trim() })}
        <div class="preview-resize-handle" contenteditable="false" role="separator" aria-label="${escapeHtml(t("resizeTablePreview"))}" aria-orientation="horizontal" tabindex="0"></div>
      `;

      const table = editor.querySelector("#crm-workbench-sheet-table");
      if (table) {
        table.setAttribute("contenteditable", "true");
      }
      applyStoredPreviewHeight();
      bindPreviewResize();
      bindPreviewZoomControls();
    } catch (error) {
      editor.innerHTML = `<p class="status status--error">${escapeHtml(t("tableOpenError", { message: error.message || "unknown spreadsheet error" }))}</p>`;
    }
  }

  function getCalculatedHeaders(calculationType) {
    return calculationType === "purchase" ? PURCHASE_CALCULATED_HEADERS : FINANCIAL_CALCULATED_HEADERS;
  }

  function getCalculationLabel(calculationType) {
    return calculationType === "purchase" ? t("purchaseCalculationLabel") : t("financialCalculationLabel");
  }

  function buildBatchCalculationHtml(batchResult, calculationType) {
    return calculationType === "purchase"
      ? buildPurchaseBatchCalculationHtml(batchResult)
      : buildFinancialBatchCalculationHtml(batchResult);
  }

  function buildFinancialBatchCalculationHtml(batchResult) {
    if (!batchResult || batchResult.items.length === 0) {
      const warningText = batchResult?.warnings?.[0] || t("noFinancialRows");
      return `<section class="batch-calculator" contenteditable="false">
        <p class="batch-calculator__title">${escapeHtml(t("financialBatchTitle"))}</p>
        <p class="batch-warning">${escapeHtml(warningText)}</p>
      </section>`;
    }

    const totalNetProfit = batchResult.items.reduce((sum, item) => sum + item.result[0], 0);
    const totalTaxRebateAmount = batchResult.items.reduce((sum, item) => sum + item.result[1], 0);
    const totalProfit = batchResult.items.reduce((sum, item) => sum + item.result[2], 0);
    const warningHtml = batchResult.warnings.length > 0
      ? `<p class="batch-warning">${escapeHtml(batchResult.warnings.slice(0, 5).join(currentLanguage === "en" ? "; " : "；"))}${batchResult.warnings.length > 5 ? escapeHtml(currentLanguage === "en" ? `; ${t("moreRowsSkipped")}` : `；${t("moreRowsSkipped")}`) : ""}</p>`
      : "";

    const tableRows = batchResult.items.map((item) => {
      return `
        <tr>
          <td>${escapeHtml(item.rowLabel)}</td>
          <td>${formatMoney(item.result[0])}</td>
          <td>${formatMoney(item.result[1])}</td>
          <td>${formatMoney(item.result[2])}</td>
          <td>${formatMoney(item.result[3])}</td>
        </tr>
      `;
    }).join("");

    return `<section class="batch-calculator" contenteditable="false">
      <p class="batch-calculator__title">${escapeHtml(t("financialBatchTitle"))}</p>
      <div class="batch-summary">
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("calculatedRows"))}</span>
          <span class="batch-summary__value">${batchResult.items.length}</span>
        </div>
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("netProfitTotal"))}</span>
          <span class="batch-summary__value">${escapeHtml(formatCurrency(totalNetProfit))}</span>
        </div>
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("taxRebateTotal"))}</span>
          <span class="batch-summary__value">${escapeHtml(formatCurrency(totalTaxRebateAmount))}</span>
        </div>
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("totalProfit"))}</span>
          <span class="batch-summary__value">${escapeHtml(formatCurrency(totalProfit))}</span>
        </div>
      </div>
      <div class="batch-table-wrap">
        <table class="batch-table">
          <thead>
            <tr>
              <th>${escapeHtml(t("row"))}</th>
              <th>${escapeHtml(t("netProfit"))}</th>
              <th>${escapeHtml(t("taxRebateAmount"))}</th>
              <th>${escapeHtml(t("totalProfit"))}</th>
              <th>${escapeHtml(t("exchangeTaxRatio"))}</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      ${warningHtml}
    </section>`;
  }

  function calculateSpreadsheetBatch(rows, calculationType) {
    return calculationType === "purchase"
      ? calculatePurchaseSpreadsheetBatch(rows)
      : calculateFinancialSpreadsheetBatch(rows);
  }

  function calculateFinancialSpreadsheetBatch(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const headerRowIndex = findFinancialHeaderRow(rows);
    if (!Number.isInteger(headerRowIndex)) {
      return {
        items: [],
        warnings: [t("financialHeaderMissing")]
      };
    }

    const items = [];
    const warnings = [];
    for (let rowIndex = headerRowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = (rows[rowIndex] || []).slice(0, FINANCIAL_SOURCE_COLUMN_COUNT);
      if (isEmptyRow(row)) {
        continue;
      }

      if (!hasFinancialSourceValues(row)) {
        warnings.push(t("financialSourceMissing", { row: rowIndex + 1 }));
        continue;
      }

      items.push({
        rowLabel: String(rowIndex + 1),
        sourceRowIndex: rowIndex,
        result: window.calculateFinancials(row)
      });
    }

    return {
      headerRowIndex,
      items,
      warnings
    };
  }

  function buildCalculatedSheetTableHtml(rows, batchResult, calculationType) {
    const resultByRowIndex = new Map();
    if (batchResult) {
      batchResult.items.forEach((item) => {
        resultByRowIndex.set(item.sourceRowIndex, item);
      });
    }

    const headerRowIndex = batchResult?.headerRowIndex ?? findHeaderRowForCalculation(rows, calculationType) ?? 0;
    const maxColumns = getSourceColumnCountForCalculation(rows, calculationType);
    const calculatedHeaders = getCalculatedHeaders(calculationType);
    const targetColumns = calculationType === "financial"
      ? findFinancialTargetColumns(rows[headerRowIndex] || [])
      : null;
    const tableRows = rows.map((row, rowIndex) => {
      const paddedRow = Array.from({ length: maxColumns }, (_, columnIndex) => row[columnIndex] ?? "");
      const calculatedCells = getCalculatedSheetCells(rowIndex, headerRowIndex, resultByRowIndex, calculatedHeaders, calculationType);
      const tagName = rowIndex === headerRowIndex ? "th" : "td";
      const originalCellsHtml = paddedRow.map((cell, columnIndex) => {
        const targetCellIndex = targetColumns ? targetColumns.indexOf(columnIndex) : -1;
        const cellValue = targetCellIndex >= 0 ? calculatedCells[targetCellIndex] : cell;
        const className = targetCellIndex >= 0 ? ` class="sheet-table__calculated"` : "";
        return `<${tagName}${className}>${escapeHtml(cellValue)}</${tagName}>`;
      }).join("");

      if (targetColumns) {
        return `<tr>${originalCellsHtml}</tr>`;
      }

      const calculatedCellsHtml = calculatedCells.map((cell) => `<${tagName} class="sheet-table__calculated">${escapeHtml(cell)}</${tagName}>`).join("");
      return `<tr>${originalCellsHtml}${calculatedCellsHtml}</tr>`;
    }).join("");

    return `<table id="crm-workbench-sheet-table" class="sheet-table calculated-sheet-table" data-original-column-count="${maxColumns}" data-header-row-index="${headerRowIndex}" data-calculation-type="${calculationType}" contenteditable="true">${tableRows}</table>`;
  }

  function buildSheetTableHtml(rows, calculationType) {
    const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
    const headerRowIndex = findHeaderRowForCalculation(rows, calculationType) ?? findFirstNonEmptyRowIndex(rows) ?? 0;
    const tableRows = rows.map((row, rowIndex) => {
      const paddedRow = Array.from({ length: maxColumns }, (_, columnIndex) => row[columnIndex] ?? "");
      const tagName = rowIndex === headerRowIndex ? "th" : "td";
      const cellsHtml = paddedRow.map((cell) => `<${tagName}>${escapeHtml(cell)}</${tagName}>`).join("");
      return `<tr>${cellsHtml}</tr>`;
    }).join("");

    return `<table id="crm-workbench-sheet-table" class="sheet-table plain-sheet-table" data-original-column-count="${maxColumns}" data-header-row-index="${headerRowIndex}" data-calculation-type="${calculationType}" contenteditable="true">${tableRows}</table>`;
  }

  function findFirstNonEmptyRowIndex(rows) {
    const rowIndex = rows.findIndex((row) => !isEmptyRow(row || []));
    return rowIndex >= 0 ? rowIndex : null;
  }

  function getCalculatedSheetCells(rowIndex, headerRowIndex, resultByRowIndex, calculatedHeaders, calculationType) {
    if (rowIndex === headerRowIndex) {
      return calculatedHeaders;
    }

    const item = resultByRowIndex.get(rowIndex);
    if (!item) {
      return calculatedHeaders.map(() => "");
    }

    if (calculationType === "purchase") {
      return [
        formatMoney(item.result.contractPurchaseAmount),
        formatMoney(item.result.taxExcludedAmount),
        formatMoney(item.result.unitPrice)
      ];
    }

    return item.result.map((value) => formatMoney(value));
  }

  function findHeaderRowForCalculation(rows, calculationType) {
    return calculationType === "purchase"
      ? findBatchHeaderRow(rows)?.rowIndex
      : findFinancialHeaderRow(rows);
  }

  function getSourceColumnCountForCalculation(rows, calculationType) {
    if (calculationType === "financial") {
      const headerRowIndex = findFinancialHeaderRow(rows) ?? 0;
      const targetColumns = findFinancialTargetColumns(rows[headerRowIndex] || []);
      const maxColumns = rows.reduce((max, row) => Math.max(max, row.length), 0);
      return targetColumns ? maxColumns : Math.min(FINANCIAL_SOURCE_COLUMN_COUNT, Math.max(FINANCIAL_SOURCE_COLUMN_COUNT, maxColumns));
    }

    return rows.reduce((max, row) => Math.max(max, row.length), 0);
  }

  function findFinancialHeaderRow(rows) {
    const scanLimit = Math.min(rows.length, 20);

    for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
      const row = rows[rowIndex] || [];
      const headerK = normalizeHeader(row[10]);
      const headerT = normalizeHeader(row[19]);
      const headerAA = normalizeHeader(row[26]);
      const headerAB = normalizeHeader(row[27]);

      if (headerK.includes("成交金额")
        && headerT.includes("汇率")
        && headerAA.includes("成本")
        && headerAB.includes("退税额")) {
        return rowIndex;
      }
    }

    return null;
  }

  function hasFinancialSourceValues(row) {
    return [10, 19, 26, 27].some((columnIndex) => String(row[columnIndex] || "").trim() !== "");
  }

  function findFinancialTargetColumns(headerRow) {
    const headers = (headerRow || []).map((cell) => normalizeHeader(cell));
    const netProfitColumn = headers.findIndex((header) => header === normalizeHeader("净利润"));
    const totalProfitColumn = headers.findIndex((header) => header === normalizeHeader("合计利润"));
    const exchangeRatioColumn = headers.findIndex((header) => header === normalizeHeader("税汇比"));
    const taxRebateColumn = headers.reduce((foundIndex, header, columnIndex) => {
      return header === normalizeHeader("退税额") && columnIndex > 27 ? columnIndex : foundIndex;
    }, -1);

    if ([netProfitColumn, taxRebateColumn, totalProfitColumn, exchangeRatioColumn].every((columnIndex) => columnIndex >= 0)) {
      return [netProfitColumn, taxRebateColumn, totalProfitColumn, exchangeRatioColumn];
    }

    return null;
  }

  function buildPurchaseBatchCalculationHtml(batchResult) {
    if (!batchResult || batchResult.items.length === 0) {
      const warningText = batchResult?.warnings?.[0] || t("noPurchaseRows");
      return `<section class="batch-calculator" contenteditable="false">
        <p class="batch-calculator__title">${escapeHtml(t("purchaseBatchTitle"))}</p>
        <p class="batch-warning">${escapeHtml(warningText)}</p>
      </section>`;
    }

    const totalWeightKg = batchResult.items.reduce((sum, item) => sum + item.values.weightKg, 0);
    const totalContractPurchaseAmount = batchResult.items.reduce((sum, item) => sum + item.result.contractPurchaseAmount, 0);
    const totalTaxExcludedAmount = batchResult.items.reduce((sum, item) => sum + item.result.taxExcludedAmount, 0);
    const averageUnitPrice = totalWeightKg > 0 ? totalContractPurchaseAmount / totalWeightKg : 0;
    const warningHtml = batchResult.warnings.length > 0
      ? `<p class="batch-warning">${escapeHtml(batchResult.warnings.slice(0, 5).join(currentLanguage === "en" ? "; " : "；"))}${batchResult.warnings.length > 5 ? escapeHtml(currentLanguage === "en" ? `; ${t("moreRowsSkipped")}` : `；${t("moreRowsSkipped")}`) : ""}</p>`
      : "";

    const tableRows = batchResult.items.map((item) => {
      return `
        <tr>
          <td>${escapeHtml(item.rowLabel)}</td>
          <td>${formatCompactNumber(item.values.weightKg, 6)}</td>
          <td>${formatMoney(item.values.usdPrice)}</td>
          <td>${formatCompactNumber(item.values.exchangeRate, 6)}</td>
          <td>${formatCompactNumber(item.values.taxRefundRate)}%</td>
          <td>${formatCompactNumber(item.values.commissionRate)}%</td>
          <td>${formatMoney(item.values.miscFee)}</td>
          <td>${formatMoney(item.result.contractPurchaseAmount)}</td>
          <td>${formatMoney(item.result.taxExcludedAmount)}</td>
          <td>${formatMoney(item.result.unitPrice)}</td>
        </tr>
      `;
    }).join("");

    return `<section class="batch-calculator" contenteditable="false">
      <p class="batch-calculator__title">${escapeHtml(t("purchaseBatchTitle"))}</p>
      <div class="batch-summary">
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("calculatedRows"))}</span>
          <span class="batch-summary__value">${batchResult.items.length}</span>
        </div>
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("contractPurchaseAmountTotal"))}</span>
          <span class="batch-summary__value">${escapeHtml(formatCurrency(totalContractPurchaseAmount))}</span>
        </div>
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("taxExcludedAmountTotal"))}</span>
          <span class="batch-summary__value">${escapeHtml(formatCurrency(totalTaxExcludedAmount))}</span>
        </div>
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("totalWeight"))}</span>
          <span class="batch-summary__value">${formatCompactNumber(totalWeightKg, 6)} kg</span>
        </div>
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("averageUnitPrice"))}</span>
          <span class="batch-summary__value">${escapeHtml(formatCurrency(averageUnitPrice))}/kg</span>
        </div>
        <div class="batch-summary__item">
          <span class="batch-summary__label">${escapeHtml(t("commissionDefault"))}</span>
          <span class="batch-summary__value">${escapeHtml(t("commissionDefaultValue"))}</span>
        </div>
      </div>
      <div class="batch-table-wrap">
        <table class="batch-table">
          <thead>
            <tr>
              <th>${escapeHtml(t("row"))}</th>
              <th>${escapeHtml(t("quantityKg"))}</th>
              <th>${escapeHtml(t("unitPriceUsdKg"))}</th>
              <th>${escapeHtml(t("exchangeRate"))}</th>
              <th>${escapeHtml(t("taxRate"))}</th>
              <th>${escapeHtml(t("commission"))}</th>
              <th>${escapeHtml(t("miscFeeShort"))}</th>
              <th>${escapeHtml(t("contractPurchaseAmount"))}</th>
              <th>${escapeHtml(t("taxExcludedAmount"))}</th>
              <th>${escapeHtml(t("purchaseUnitPrice"))}</th>
            </tr>
          </thead>
          <tbody>${tableRows}</tbody>
        </table>
      </div>
      ${warningHtml}
    </section>`;
  }

  function calculatePurchaseSpreadsheetBatch(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return null;
    }

    const headerMatch = findBatchHeaderRow(rows);
    if (!headerMatch) {
      return {
        items: [],
        warnings: [t("purchaseHeaderMissing")]
      };
    }

    const items = [];
    const warnings = [];
    for (let rowIndex = headerMatch.rowIndex + 1; rowIndex < rows.length; rowIndex += 1) {
      const row = rows[rowIndex] || [];
      if (isEmptyRow(row)) {
        continue;
      }

      const values = readBatchRowValues(row, headerMatch.columns);
      const validationError = getCalculatorValidationError(values);
      if (validationError) {
        warnings.push(t("skippedRowWithReason", { row: rowIndex + 1, reason: validationError }));
        continue;
      }

      items.push({
        rowLabel: String(rowIndex + 1),
        sourceRowIndex: rowIndex,
        values,
        result: calculateContractPrice(values)
      });
    }

    return {
      headerRowIndex: headerMatch.rowIndex,
      items,
      warnings
    };
  }

  function findBatchHeaderRow(rows) {
    let bestMatch = null;
    const scanLimit = Math.min(rows.length, 20);

    for (let rowIndex = 0; rowIndex < scanLimit; rowIndex += 1) {
      const row = rows[rowIndex] || [];
      const columns = mapBatchColumns(row);
      const score = ["quantity", "unitPrice", "exchangeRate", "taxRate"].reduce((sum, key) => {
        return sum + (Number.isInteger(columns[key]) ? 1 : 0);
      }, 0);

      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { rowIndex, columns, score };
      }
    }

    if (!bestMatch || bestMatch.score < 4) {
      return null;
    }

    return bestMatch;
  }

  function mapBatchColumns(headerRow) {
    const columns = {};
    headerRow.forEach((cell, columnIndex) => {
      const header = normalizeHeader(cell);
      if (!header) {
        return;
      }

      if (!Number.isInteger(columns.quantity) && isHeaderMatch(header, ["数量", "总重量", "重量", "qty", "quantity"])) {
        columns.quantity = columnIndex;
        return;
      }

      if (!Number.isInteger(columns.unitPrice) && isHeaderMatch(header, ["单价", "美金底价", "美元单价", "usdkg", "usdperkg", "price"])) {
        columns.unitPrice = columnIndex;
        return;
      }

      if (!Number.isInteger(columns.exchangeRate) && isHeaderMatch(header, ["汇率", "exchange", "rate"])) {
        columns.exchangeRate = columnIndex;
        return;
      }

      if (!Number.isInteger(columns.taxRate) && isHeaderMatch(header, ["税率", "退税率", "tax", "refund"])) {
        columns.taxRate = columnIndex;
        return;
      }

      if (!Number.isInteger(columns.commissionRate) && isHeaderMatch(header, ["佣金", "固定佣金", "commission"])) {
        columns.commissionRate = columnIndex;
        return;
      }

      if (!Number.isInteger(columns.domesticBankFee) && isHeaderMatch(header, ["国内银行费用cny", "国内银行费用", "银行费用", "bankfee"])) {
        columns.domesticBankFee = columnIndex;
        return;
      }

      if (!Number.isInteger(columns.freightFee) && isHeaderMatch(header, ["运费cny", "运费", "freight", "shipping"])) {
        columns.freightFee = columnIndex;
        return;
      }

      if (!Number.isInteger(columns.insuranceFee) && isHeaderMatch(header, ["保费cny", "保费", "insurance"])) {
        columns.insuranceFee = columnIndex;
      }
    });
    return columns;
  }

  function readBatchRowValues(row, columns) {
    const commissionValue = Number.isInteger(columns.commissionRate)
      ? parsePercentInput(row[columns.commissionRate])
      : Number.NaN;

    return {
      weightKg: parseQuantityKg(row[columns.quantity]),
      usdPrice: parseDecimalInput(row[columns.unitPrice]),
      exchangeRate: parseDecimalInput(row[columns.exchangeRate]),
      taxRefundRate: parsePercentInput(row[columns.taxRate]),
      commissionRate: Number.isFinite(commissionValue) ? commissionValue : 10,
      miscFee: parseFeeValue(row[columns.domesticBankFee])
        + parseFeeValue(row[columns.freightFee])
        + parseFeeValue(row[columns.insuranceFee])
    };
  }

  function parseQuantityKg(value) {
    if (typeof value === "number") {
      return value;
    }

    const text = String(value || "").trim();
    if (!text) {
      return Number.NaN;
    }

    const parenthesizedKg = text.match(/\(([^)]*?[-+]?\d+(?:,\d{3})*(?:\.\d+)?\s*kgs?[^)]*?)\)/i);
    if (parenthesizedKg) {
      const parsedParenthesizedKg = parseUnitNumber(parenthesizedKg[1], "kg");
      if (Number.isFinite(parsedParenthesizedKg)) {
        return parsedParenthesizedKg;
      }
    }

    const kgValue = parseUnitNumber(text, "kg");
    if (Number.isFinite(kgValue)) {
      return kgValue;
    }

    const gramValue = parseUnitNumber(text, "g");
    if (Number.isFinite(gramValue)) {
      return gramValue / 1000;
    }

    return parseDecimalInput(text);
  }

  function parseUnitNumber(text, unit) {
    const unitPattern = unit === "kg" ? "k(?:ilo)?g?s?" : "g(?:ram)?s?";
    const match = String(text || "").match(new RegExp(`([-+]?\\d+(?:,\\d{3})*(?:\\.\\d+)?)\\s*${unitPattern}\\b`, "i"));
    return match ? parseDecimalInput(match[1]) : Number.NaN;
  }

  function parsePercentInput(value) {
    const parsedValue = parseDecimalInput(value);
    if (!Number.isFinite(parsedValue)) {
      return Number.NaN;
    }
    return Math.abs(parsedValue) <= 1 ? parsedValue * 100 : parsedValue;
  }

  function parseFeeValue(value) {
    const parsedValue = parseDecimalInput(value);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  function normalizeHeader(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/\s+/g, "")
      .replace(/[()（）/\\_\-:：,，.。]/g, "");
  }

  function isHeaderMatch(header, aliases) {
    return aliases.some((alias) => header.includes(normalizeHeader(alias)));
  }

  function isEmptyRow(row) {
    return row.every((cell) => String(cell || "").trim() === "");
  }

  function createPreviewUrl(file) {
    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
    }
    currentPreviewUrl = URL.createObjectURL(file);
    return currentPreviewUrl;
  }

  function renderLoadedFiles() {
    const historyWrapper = shadowRoot.querySelector(".file-history");
    const historyList = shadowRoot.querySelector(".file-history__list");

    historyWrapper.classList.toggle("has-files", loadedFiles.length > 0);
    historyList.innerHTML = loadedFiles.map((entry) => {
      const activeClass = entry.id === selectedFileId ? " is-active" : "";
      return `
        <div class="file-chip${activeClass}" title="${escapeHtml(entry.file.name)}">
          <button class="file-chip__select" type="button" data-file-id="${entry.id}">
            <span class="file-chip__name">${escapeHtml(entry.file.name)}</span>
            <span>${escapeHtml(formatFileSize(entry.file.size))}</span>
          </button>
          <button class="file-chip__remove" type="button" data-remove-file-id="${entry.id}" aria-label="${escapeHtml(t("removeFile", { filename: entry.file.name }))}">&times;</button>
        </div>
      `;
    }).join("");
  }

  function handleFileHistoryClick(event) {
    const eventTarget = event.target;
    if (!(eventTarget instanceof Element)) {
      return;
    }

    const removeButton = eventTarget.closest("[data-remove-file-id]");
    if (removeButton) {
      event.preventDefault();
      event.stopPropagation();
      removeLoadedFile(removeButton.dataset.removeFileId);
      return;
    }

    const fileButton = eventTarget.closest("[data-file-id]");
    if (!fileButton) {
      return;
    }
    selectLoadedFile(fileButton.dataset.fileId);
  }

  function removeLoadedFile(fileId) {
    const removedActiveFile = fileId === selectedFileId;
    loadedFiles = loadedFiles.filter((entry) => entry.id !== fileId);

    if (!removedActiveFile) {
      renderLoadedFiles();
      return;
    }

    if (currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      currentPreviewUrl = null;
    }

    const [nextFile] = loadedFiles;
    if (nextFile) {
      selectedFileId = null;
      selectedFile = null;
      renderLoadedFiles();
      selectLoadedFile(nextFile.id);
      return;
    }

    selectedFileId = null;
    selectedFile = null;
    updateDocumentMetaForEmptyState();
    clearEditor();
    renderLoadedFiles();
  }

  function updateDocumentMetaForEmptyState() {
    const label = shadowRoot.querySelector(".document-toolbar__label");
    const meta = shadowRoot.querySelector(".document-toolbar__meta");
    label.textContent = t("documentLabelEmpty");
    meta.textContent = t("noFileLoaded");
  }

  function clearEditor() {
    const editor = shadowRoot.querySelector(".editor");
    editor.innerHTML = "";
  }

  function bindPreviewResize() {
    const resizeHandle = shadowRoot.querySelector(".preview-resize-handle");
    if (!resizeHandle) {
      return;
    }

    resizeHandle.addEventListener("pointerdown", startPreviewResize);
    resizeHandle.addEventListener("keydown", handlePreviewResizeKeydown);
  }

  function startPreviewResize(event) {
    event.preventDefault();
    const resizeHandle = event.currentTarget;
    const previewWindow = shadowRoot.querySelector(".preview-window");
    if (!previewWindow) {
      return;
    }

    const startY = event.clientY;
    const startHeight = previewWindow.getBoundingClientRect().height;
    resizeHandle.classList.add("is-dragging");
    resizeHandle.setPointerCapture(event.pointerId);

    const onPointerMove = (moveEvent) => {
      setPreviewHeight(startHeight + moveEvent.clientY - startY);
    };

    const stopResize = () => {
      resizeHandle.classList.remove("is-dragging");
      resizeHandle.removeEventListener("pointermove", onPointerMove);
      resizeHandle.removeEventListener("pointerup", stopResize);
      resizeHandle.removeEventListener("pointercancel", stopResize);
    };

    resizeHandle.addEventListener("pointermove", onPointerMove);
    resizeHandle.addEventListener("pointerup", stopResize);
    resizeHandle.addEventListener("pointercancel", stopResize);
  }

  function handlePreviewResizeKeydown(event) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }

    event.preventDefault();
    const previewWindow = shadowRoot.querySelector(".preview-window");
    const currentHeight = previewWindow ? previewWindow.getBoundingClientRect().height : DEFAULT_PREVIEW_HEIGHT;
    const direction = event.key === "ArrowDown" ? 1 : -1;
    setPreviewHeight(currentHeight + direction * 24);
  }

  function applyStoredPreviewHeight() {
    const storedHeight = readStoredPreviewHeight();
    setPreviewHeight(storedHeight || DEFAULT_PREVIEW_HEIGHT, { persist: false });
  }

  function setPreviewHeight(heightPx, options = {}) {
    const shouldPersist = options.persist !== false;
    const clampedHeight = clampPreviewHeight(heightPx);
    const previewWindow = shadowRoot.querySelector(".preview-window");

    if (previewWindow) {
      previewWindow.style.height = `${clampedHeight}px`;
    }

    if (shouldPersist) {
      try {
        window.localStorage.setItem(PREVIEW_HEIGHT_STORAGE_KEY, String(clampedHeight));
      } catch (error) {
        // Resizing remains usable even when storage is unavailable.
      }
    }
  }

  function clampPreviewHeight(heightPx) {
    const maxHeight = Math.max(MIN_PREVIEW_HEIGHT, Math.round(window.innerHeight * 0.72));
    return Math.min(Math.max(Math.round(heightPx), MIN_PREVIEW_HEIGHT), maxHeight);
  }

  function readStoredPreviewHeight() {
    try {
      const storedValue = Number(window.localStorage.getItem(PREVIEW_HEIGHT_STORAGE_KEY));
      return Number.isFinite(storedValue) && storedValue > 0 ? storedValue : null;
    } catch (error) {
      return null;
    }
  }

  function updateDocumentMeta(file) {
    const label = shadowRoot.querySelector(".document-toolbar__label");
    const meta = shadowRoot.querySelector(".document-toolbar__meta");
    label.textContent = file.name;
    meta.textContent = formatFileSize(file.size);
  }

  function handleSaveEditedCopy() {
    const editor = shadowRoot.querySelector(".editor");
    const sheetTable = editor.querySelector("#crm-workbench-sheet-table");
    if (sheetTable) {
      saveSheetTableFile(sheetTable);
      return;
    }

    const wordContent = getActiveWordSaveRoot(editor);
    if (wordContent) {
      saveWordDocumentFile(wordContent);
      return;
    }

    const editableHtml = getSavableEditorHtml(editor.innerHTML);

    if (!selectedFile && !editableHtml.trim()) {
      showSidebarStatus(t("noLoadedContentToSave"), "error");
      return;
    }

    const baseName = selectedFile ? getFileBaseName(selectedFile.name) : "crm-workbench";
    const savedAt = new Date().toISOString();
    const htmlDocument = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(baseName)} edited copy</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; margin: 24px; color: #111827; }
    .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
  </style>
</head>
<body>
  <div class="meta">${escapeHtml(t("savedFromWorkbenchAt", { savedAt }))}</div>
  ${editableHtml || "<p></p>"}
</body>
</html>`;

    const editedBlob = new Blob([htmlDocument], { type: "text/html;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(editedBlob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = `${baseName}-edited.html`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    showSidebarStatus(t("savedFile", { filename: downloadLink.download }), "success");
  }

  function saveSheetTableFile(table) {
    if (!window.XLSX) {
      showSidebarStatus(t("exportLibraryMissing"), "error");
      return;
    }

    const baseName = selectedFile ? getFileBaseName(selectedFile.name) : "crm-workbench";
    const rows = readRowsFromSheetTable(table);

    if (rows.length === 0) {
      showSidebarStatus(t("noCalculatedTable"), "error");
      return;
    }

    if (selectedFile && selectedFile.name.toLowerCase().endsWith(".csv")) {
      saveSheetTableCsv(rows, baseName);
      return;
    }

    saveSheetTableWorkbook(rows, baseName, table.classList.contains("calculated-sheet-table"));
  }

  function readRowsFromSheetTable(table) {
    return Array.from(table.rows).map((row) => {
      return Array.from(row.cells).map((cell) => normalizeText(cell.textContent));
    });
  }

  function saveSheetTableCsv(rows, baseName) {
    const worksheet = window.XLSX.utils.aoa_to_sheet(rows);
    const csvText = window.XLSX.utils.sheet_to_csv(worksheet);
    const csvBlob = new Blob([csvText], { type: "text/csv;charset=utf-8" });
    triggerFileDownload(csvBlob, `${baseName}-edited.csv`);
    showSidebarStatus(t("savedWorkbook", { filename: `${baseName}-edited.csv` }), "success");
  }

  function saveSheetTableWorkbook(rows, baseName, isCalculatedTable) {
    const worksheet = window.XLSX.utils.aoa_to_sheet(rows);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, isCalculatedTable ? "Calculated" : "Edited");
    const workbookArray = window.XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array"
    });
    const workbookBlob = new Blob([workbookArray], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });
    const suffix = isCalculatedTable ? "calculated" : "edited";
    const filename = `${baseName}-${suffix}.xlsx`;
    triggerFileDownload(workbookBlob, filename);
    showSidebarStatus(t("savedWorkbook", { filename }), "success");
  }

  function triggerFileDownload(blob, filename) {
    const downloadUrl = URL.createObjectURL(blob);
    const downloadLink = document.createElement("a");
    downloadLink.href = downloadUrl;
    downloadLink.download = filename;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    downloadLink.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  function getActiveWordSaveRoot(editor) {
    if (!selectedFile || (!isDocx(selectedFile) && !isDoc(selectedFile))) {
      return null;
    }

    return editor.querySelector(".docx-viewer") || editor;
  }

  function saveWordDocumentFile(contentRoot) {
    const baseName = selectedFile ? getFileBaseName(selectedFile.name) : "crm-workbench";
    const filename = `${baseName}-edited-${formatDownloadTimestamp(new Date())}.docx`;
    const documentXml = buildDocxDocumentXml(contentRoot);
    const docxBlob = createDocxBlob(documentXml);
    triggerFileDownload(docxBlob, filename);
    showSidebarStatus(t("savedFile", { filename }), "success");
  }

  function buildDocxDocumentXml(contentRoot) {
    const rootClone = contentRoot.cloneNode(true);
    rootClone.querySelectorAll("button, .crm-workbench-runtime-status").forEach((element) => element.remove());
    const bodyXml = buildDocxBlocksXml(rootClone).join("") || buildDocxParagraphXml("");

    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${bodyXml}
    <w:sectPr>
      <w:pgSz w:w="12240" w:h="15840"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>`;
  }

  function buildDocxBlocksXml(node) {
    const blocks = [];

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        const text = normalizeText(child.textContent);
        if (text) {
          blocks.push(buildDocxParagraphXml(text));
        }
        return;
      }

      if (!(child instanceof Element)) {
        return;
      }

      const tagName = child.tagName.toLowerCase();
      if (tagName === "table") {
        blocks.push(buildDocxTableXml(child));
        return;
      }

      if (tagName === "ul" || tagName === "ol") {
        Array.from(child.children).filter((item) => item.tagName.toLowerCase() === "li").forEach((item, itemIndex) => {
          blocks.push(buildDocxParagraphXml(item, { prefix: tagName === "ol" ? `${itemIndex + 1}. ` : "- " }));
        });
        return;
      }

      if (isDocxBlockElement(child)) {
        const nestedBlocks = Array.from(child.children).some((element) => isDocxBlockElement(element) || element.tagName.toLowerCase() === "table");
        if (nestedBlocks && !hasDirectDocxText(child)) {
          blocks.push(...buildDocxBlocksXml(child));
        } else {
          blocks.push(buildDocxParagraphXml(child, { bold: /^h[1-6]$/.test(tagName) }));
        }
        return;
      }

      blocks.push(...buildDocxBlocksXml(child));
    });

    return blocks;
  }

  function isDocxBlockElement(element) {
    return /^(article|section|header|footer|main|aside|div|p|li|blockquote|pre|h[1-6])$/i.test(element.tagName);
  }

  function hasDirectDocxText(element) {
    return Array.from(element.childNodes).some((child) => {
      return child.nodeType === Node.TEXT_NODE && normalizeText(child.textContent);
    });
  }

  function buildDocxParagraphXml(content, options = {}) {
    const prefixRun = options.prefix ? buildDocxRunXml(options.prefix, options) : "";
    const runsXml = typeof content === "string"
      ? buildDocxRunXml(content, options)
      : buildDocxRunsXml(content, options);
    return `<w:p>${prefixRun}${runsXml || buildDocxRunXml("", options)}</w:p>`;
  }

  function buildDocxRunsXml(node, inheritedStyle = {}) {
    let runsXml = "";

    node.childNodes.forEach((child) => {
      if (child.nodeType === Node.TEXT_NODE) {
        runsXml += buildDocxRunXml(child.textContent || "", inheritedStyle);
        return;
      }

      if (!(child instanceof Element)) {
        return;
      }

      const tagName = child.tagName.toLowerCase();
      if (tagName === "br") {
        runsXml += "<w:r><w:br/></w:r>";
        return;
      }

      const nextStyle = {
        bold: inheritedStyle.bold || tagName === "strong" || tagName === "b",
        italic: inheritedStyle.italic || tagName === "em" || tagName === "i",
        underline: inheritedStyle.underline || tagName === "u"
      };
      runsXml += buildDocxRunsXml(child, nextStyle);
    });

    return runsXml;
  }

  function buildDocxRunXml(text, style = {}) {
    const runProperties = [
      style.bold ? "<w:b/>" : "",
      style.italic ? "<w:i/>" : "",
      style.underline ? '<w:u w:val="single"/>' : ""
    ].join("");
    const propertiesXml = runProperties ? `<w:rPr>${runProperties}</w:rPr>` : "";
    return `<w:r>${propertiesXml}<w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r>`;
  }

  function buildDocxTableXml(table) {
    const rowsXml = Array.from(table.rows).map((row) => {
      const cellsXml = Array.from(row.cells).map((cell) => {
        const cellBlocks = buildDocxBlocksXml(cell);
        return `<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>${cellBlocks.join("") || buildDocxParagraphXml(normalizeText(cell.textContent))}</w:tc>`;
      }).join("");
      return `<w:tr>${cellsXml}</w:tr>`;
    }).join("");

    return `<w:tbl>
      <w:tblPr>
        <w:tblW w:w="0" w:type="auto"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
          <w:left w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
          <w:bottom w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
          <w:right w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
          <w:insideV w:val="single" w:sz="4" w:space="0" w:color="D1D5DB"/>
        </w:tblBorders>
      </w:tblPr>
      ${rowsXml}
    </w:tbl>`;
  }

  function createDocxBlob(documentXml) {
    const files = [
      {
        path: "[Content_Types].xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
</Types>`
      },
      {
        path: "_rels/.rels",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
      },
      {
        path: "word/_rels/document.xml.rels",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings" Target="settings.xml"/>
</Relationships>`
      },
      {
        path: "word/document.xml",
        content: documentXml
      },
      {
        path: "word/settings.xml",
        content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:documentProtection w:edit="none" w:enforcement="0"/>
</w:settings>`
      }
    ];

    return new Blob([createStoredZip(files)], {
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    });
  }

  function createStoredZip(files) {
    const encoder = new TextEncoder();
    const localParts = [];
    const centralParts = [];
    let offset = 0;

    files.forEach((file) => {
      const nameBytes = encoder.encode(file.path);
      const contentBytes = encoder.encode(file.content);
      const crc = calculateCrc32(contentBytes);
      const localHeader = createZipLocalHeader(nameBytes, contentBytes.length, crc);
      localParts.push(localHeader, contentBytes);
      centralParts.push(createZipCentralHeader(nameBytes, contentBytes.length, crc, offset));
      offset += localHeader.length + contentBytes.length;
    });

    const centralOffset = offset;
    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
    const endRecord = createZipEndRecord(files.length, centralSize, centralOffset);
    return concatenateUint8Arrays([...localParts, ...centralParts, endRecord]);
  }

  function createZipLocalHeader(nameBytes, contentLength, crc) {
    const header = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0x0800, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, contentLength, true);
    view.setUint32(22, contentLength, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    header.set(nameBytes, 30);
    return header;
  }

  function createZipCentralHeader(nameBytes, contentLength, crc, localHeaderOffset) {
    const header = new Uint8Array(46 + nameBytes.length);
    const view = new DataView(header.buffer);
    view.setUint32(0, 0x02014b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 20, true);
    view.setUint16(8, 0x0800, true);
    view.setUint16(10, 0, true);
    view.setUint16(12, 0, true);
    view.setUint16(14, 0, true);
    view.setUint32(16, crc, true);
    view.setUint32(20, contentLength, true);
    view.setUint32(24, contentLength, true);
    view.setUint16(28, nameBytes.length, true);
    view.setUint16(30, 0, true);
    view.setUint16(32, 0, true);
    view.setUint16(34, 0, true);
    view.setUint16(36, 0, true);
    view.setUint32(38, 0, true);
    view.setUint32(42, localHeaderOffset, true);
    header.set(nameBytes, 46);
    return header;
  }

  function createZipEndRecord(entryCount, centralSize, centralOffset) {
    const record = new Uint8Array(22);
    const view = new DataView(record.buffer);
    view.setUint32(0, 0x06054b50, true);
    view.setUint16(4, 0, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, entryCount, true);
    view.setUint16(10, entryCount, true);
    view.setUint32(12, centralSize, true);
    view.setUint32(16, centralOffset, true);
    view.setUint16(20, 0, true);
    return record;
  }

  function concatenateUint8Arrays(parts) {
    const totalLength = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(totalLength);
    let offset = 0;
    parts.forEach((part) => {
      output.set(part, offset);
      offset += part.length;
    });
    return output;
  }

  function calculateCrc32(bytes) {
    let crc = 0xffffffff;
    for (let index = 0; index < bytes.length; index += 1) {
      crc = (crc >>> 8) ^ getCrc32Table()[(crc ^ bytes[index]) & 0xff];
    }
    return (crc ^ 0xffffffff) >>> 0;
  }

  function getCrc32Table() {
    if (!getCrc32Table.table) {
      getCrc32Table.table = Array.from({ length: 256 }, (_, index) => {
        let value = index;
        for (let bit = 0; bit < 8; bit += 1) {
          value = value & 1 ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
        }
        return value >>> 0;
      });
    }
    return getCrc32Table.table;
  }

  async function handleExtractFillClick() {
    const fillButton = shadowRoot.querySelector(".fill-button");
    fillButton.disabled = true;
    showSidebarStatus(t("fillingCrm"));

    try {
      const text = getCurrentDocumentPlainText();
      if (!text) {
        showSidebarStatus(t("noExtractableContent"), "error");
        return;
      }

      const extractedFields = extractCrmFieldsFromText(text);
      const fieldNames = Object.keys(extractedFields);
      if (fieldNames.length === 0) {
        showSidebarStatus(t("noFieldsDetected"), "error");
        return;
      }

      showSidebarStatus(t("requiredFieldsDetected", { fields: fieldNames.join(", ") }));
      const result = await fillCrmFieldsInBestContext(extractedFields);
      showSidebarStatus(t("crmAutofillComplete", {
        filled: result.filled,
        skipped: result.skipped
      }), result.filled > 0 ? "success" : "error");
    } catch (error) {
      showSidebarStatus(error.message || t("crmAutofillFailed"), "error");
    } finally {
      fillButton.disabled = false;
    }
  }

  function getCurrentDocumentPlainText() {
    const editor = shadowRoot.querySelector(".editor");
    if (!editor) {
      return "";
    }

    const clone = editor.cloneNode(true);
    clone.querySelectorAll(".crm-workbench-runtime-status, .preview-window:not(.docx-preview-window), .preview-resize-handle, button").forEach((element) => element.remove());
    const rows = Array.from(clone.querySelectorAll("tr")).map((row) => {
      return Array.from(row.cells).map((cell) => normalizeText(cell.textContent)).filter(Boolean).join(" | ");
    }).filter(Boolean);
    const text = normalizeText(clone.textContent);
    return normalizeText([text, rows.join("\n")].filter(Boolean).join("\n"));
  }

  function extractCrmFieldsFromText(text) {
    const normalized = normalizeDocumentText(text);
      const fields = {};
      const definitions = getCrmFieldDefinitions();

    definitions.forEach((definition) => {
      const value = extractFieldValue(normalized, definition);
      if (value) {
        fields[definition.key] = {
          label: definition.crmLabel,
          value: normalizeExtractedFieldValue(value, definition)
        };
      }
    });

    applyFallbackFieldExtraction(normalized, fields);
    applyGeneratedApprovalNo(normalized, fields);
    applyDefaultRequiredCrmValues(fields);
    return Object.fromEntries(Object.entries(fields).filter(([, field]) => field.value));
  }

  function getCrmFieldDefinitions() {
    return [
      { key: "approvalNo", crmLabel: "合同审批单号", labels: ["合同审批单号", "审批单号", "Approval No", "Approval Number"], required: true },
      { key: "signDate", crmLabel: "签订日期", labels: ["签订日期", "合同日期", "日期", "Date"], type: "date" },
      { key: "customerOrderNo", crmLabel: "客户订单号", labels: ["客户订单号", "客户单号", "订单号", "PO No", "P/O No", "Purchase Order"] },
      { key: "quoteNo", crmLabel: "报价单号", labels: ["报价单号", "报价号", "Quotation No", "Quote No"] },
      { key: "purchaseSaleMode", crmLabel: "购销方式", labels: ["购销方式", "采购销售方式", "Purchase/Sales Mode"], required: true },
      { key: "customer", crmLabel: "客户", labels: ["客户", "买方", "Buyer", "Customer", "Consignee"], required: true },
      { key: "country", crmLabel: "国别地区", labels: ["国别地区", "国家地区", "目的国", "客户国家", "Country"], required: true },
      { key: "contact", crmLabel: "联系人", labels: ["联系人", "Contact", "Attn", "Attention"] },
      { key: "currency", crmLabel: "币种", labels: ["币种", "货币", "Currency"], type: "currency", required: true },
      { key: "exchangeRate", crmLabel: "汇率", labels: ["汇率", "Exchange Rate", "Ex. Rate"], type: "number", required: true },
      { key: "contractAmount", crmLabel: "合同总金额", labels: ["合同总金额", "合同金额", "总金额", "Total Amount", "Contract Amount"], type: "money", required: true },
      { key: "usdAmount", crmLabel: "美元总金额", labels: ["美元总金额", "USD Amount", "Total USD"], type: "money", required: true },
      { key: "paymentMethod", crmLabel: "付款方法", labels: ["付款方法", "付款方式", "Payment Terms", "Payment Method", "Terms of Payment"], required: true },
      { key: "deliveryTerm", crmLabel: "交货期限", labels: ["交货期限", "交货期", "Delivery Time", "Delivery Term", "Shipment Time"] },
      { key: "transportMode", crmLabel: "运输方式", labels: ["运输方式", "Transport", "Transportation", "Shipment By", "Mode of Transport"], type: "transport", required: true },
      { key: "loadingPort", crmLabel: "装运港", labels: ["装运港", "起运港", "Port of Loading", "Loading Port", "POL"] },
      { key: "destinationPort", crmLabel: "目的港", labels: ["目的港", "卸货港", "Port of Destination", "Destination Port", "POD", "Port of Discharge"], required: true },
      { key: "loadingCountry", crmLabel: "装运港国家(地区)", labels: ["装运港国家", "起运国", "Country of Loading"] },
      { key: "destinationCountry", crmLabel: "目的港国家(地区)", labels: ["目的港国家", "目的国", "Destination Country"] },
      { key: "destination", crmLabel: "目的地", labels: ["目的地", "Final Destination", "Destination"] },
      { key: "tradeTerm", crmLabel: "成交方式", labels: ["成交方式", "贸易术语", "Trade Term", "Incoterms", "Price Term"], type: "tradeTerm", required: true },
      { key: "overfillRate", crmLabel: "溢装率", labels: ["溢装率", "溢短装", "More or Less", "Tolerance"], type: "percent", required: true },
      { key: "shortfallRate", crmLabel: "短装率", labels: ["短装率", "Shortfall Rate", "Tolerance"], type: "percent", required: true },
      { key: "shippingMark", crmLabel: "唛头", labels: ["唛头", "Shipping Mark", "Marks"] },
      { key: "remark", crmLabel: "备注", labels: ["备注", "Remark", "Remarks", "Notes"] },
      { key: "productName", crmLabel: "商品", labels: ["商品", "商品名称", "产品名称", "品名", "Product", "Product Name", "Description"], required: true },
      { key: "casNo", crmLabel: "CAS NO", labels: ["CAS NO", "CAS No.", "CAS", "CAS号"] },
      { key: "quantity", crmLabel: "数量", labels: ["数量", "合同数量", "Quantity", "Qty"], type: "number", required: true },
      { key: "unit", crmLabel: "单位", labels: ["单位", "Unit"], required: true },
      { key: "unitPrice", crmLabel: "单价", labels: ["单价", "销售单价", "Unit Price", "Price"], type: "money", required: true },
      { key: "productAmount", crmLabel: "商品金额", labels: ["商品金额", "销售金额", "Line Amount", "Line Total"], type: "money", required: true }
    ];
  }

  function normalizeDocumentText(text) {
    return String(text || "")
      .replace(/\r/g, "\n")
      .replace(/[ \t]+/g, " ")
      .replace(/\s*\|\s*/g, " | ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function extractFieldValue(text, definition) {
    for (const label of definition.labels) {
      const escapedLabel = escapeRegExp(label);
      const patterns = [
        new RegExp(`(?:^|[\\n|;,，；])\\s*${escapedLabel}\\s*(?:[:：]|\\|)\\s*([^\\n|;,，；]{1,120})`, "i"),
        new RegExp(`(?:^|[\\n|;,，；])\\s*${escapedLabel}\\s{2,}([^\\n|;,，；]{1,120})`, "i"),
        new RegExp(`${escapedLabel}\\s*(?:[:：]|\\|)\\s*([^\\n|;,，；]{1,120})`, "i")
      ];

      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1]) {
          const value = cleanExtractedValue(match[1]);
          if (value && !looksLikeAnotherLabel(value)) {
            return value;
          }
        }
      }
    }

    return "";
  }

  function cleanExtractedValue(value) {
    return normalizeText(String(value || "")
      .replace(/^[：:\-–—\s]+/, "")
      .replace(/\s*(?:\||;|；|,|，)\s*$/, ""));
  }

  function looksLikeAnotherLabel(value) {
    return /^[\u4e00-\u9fa5A-Za-z /().-]{1,24}[：:]$/.test(value);
  }

  function normalizeExtractedFieldValue(value, definition) {
    const cleaned = cleanExtractedValue(value);

    if (definition.type === "date") {
      const dateMatch = cleaned.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
      if (dateMatch) {
        return `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`;
      }
    }

    if (definition.type === "money" || definition.type === "number") {
      const numericMatch = cleaned.match(/[-+]?\d[\d,]*(?:\.\d+)?/);
      return numericMatch ? numericMatch[0].replace(/,/g, "") : cleaned;
    }

    if (definition.type === "percent") {
      const percentMatch = cleaned.match(/[-+]?\d+(?:\.\d+)?/);
      return percentMatch ? `${percentMatch[0]}%` : cleaned;
    }

    if (definition.type === "currency") {
      const currencyMatch = cleaned.match(/\b(USD|EUR|CNY|RMB|JPY|GBP|INR)\b/i);
      return currencyMatch ? currencyMatch[1].toUpperCase().replace("RMB", "CNY") : cleaned;
    }

    if (definition.key === "purchaseSaleMode") {
      if (/以销定购|sale.*purchase|sales.*purchase/i.test(cleaned)) {
        return "以销定购";
      }
    }

    if (definition.key === "paymentMethod") {
      if (/佣金率|commission/i.test(cleaned)) {
        return "佣金率";
      }
      if (/信用证|letter of credit|\bL\/?C\b/i.test(cleaned)) {
        return "信用证";
      }
      if (/电汇|\bT\/?T\b|telegraphic transfer/i.test(cleaned)) {
        return "电汇";
      }
    }

    if (definition.type === "tradeTerm") {
      const tradeTermMatch = cleaned.match(/\b(EXW|FOB|CFR|CNF|CIF|DAP|DDP|FCA|CPT|CIP)\b/i);
      return tradeTermMatch ? tradeTermMatch[1].toUpperCase() : cleaned;
    }

    if (definition.type === "transport") {
      if (/sea|ocean|vessel|船|海运/i.test(cleaned)) {
        return "By Sea";
      }
      if (/air|flight|空运/i.test(cleaned)) {
        return "By Air";
      }
      if (/rail|train|铁路/i.test(cleaned)) {
        return "By Rail";
      }
    }

    return cleaned;
  }

  function applyFallbackFieldExtraction(text, fields) {
    if (!fields.currency) {
      const currencyMatch = text.match(/\b(USD|EUR|CNY|RMB|JPY|GBP|INR)\b/i);
      if (currencyMatch) {
        fields.currency = { label: "币种", value: currencyMatch[1].toUpperCase().replace("RMB", "CNY") };
      }
    }

    if (!fields.tradeTerm) {
      const tradeTermMatch = text.match(/\b(EXW|FOB|CFR|CNF|CIF|DAP|DDP|FCA|CPT|CIP)\b/i);
      if (tradeTermMatch) {
        fields.tradeTerm = { label: "成交方式", value: tradeTermMatch[1].toUpperCase() };
      }
    }

    if (!fields.contractAmount) {
      const amountMatch = text.match(/\b(?:USD|US\$|\$)\s*([\d,]+(?:\.\d{1,2})?)/i);
      if (amountMatch) {
        fields.contractAmount = { label: "合同总金额", value: amountMatch[1].replace(/,/g, "") };
        fields.usdAmount = fields.usdAmount || { label: "美元总金额", value: fields.contractAmount.value };
      }
    }

    if (!fields.signDate) {
      const dateMatch = text.match(/(?:^|[^\d])(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日)?(?:[^\d]|$)/);
      if (dateMatch) {
        fields.signDate = {
          label: "签订日期",
          value: `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`
        };
      }
    }
  }

  function applyGeneratedApprovalNo(text, fields) {
    if (fields.approvalNo?.value) {
      return;
    }

    const companyPrefix = inferApprovalCompanyPrefix(text);
    const customCode = inferApprovalCustomCode(text, fields);
    const dateCode = inferApprovalDateCode(text, fields);

    if (!companyPrefix || !customCode || !dateCode) {
      return;
    }

    fields.approvalNo = {
      label: "合同审批单号",
      value: `${companyPrefix}-${customCode}${dateCode}`
    };
  }

  function inferApprovalCompanyPrefix(text) {
    const normalized = text.toLowerCase();
    const hasYs = /音速|yin\s*su|yinsul|ys\b|杭州音速/.test(normalized);
    const hasDc = /dragon|dc\b|龙/.test(normalized);

    if (hasYs && hasDc) {
      return "YSDC";
    }

    if (hasDc) {
      return "DC";
    }

    return "YS";
  }

  function inferApprovalCustomCode(text, fields) {
    const labeledCode = extractFirstMatchingText(text, [
      /(?:客户简称|客户代码|客户代号|custom(?:er)?\s*(?:name|code)|customer\s*abbr(?:eviation)?|code)\s*[:：|]\s*([A-Z0-9]{2,8})/i,
      /(?:审批单号|合同审批单号)\s*[:：|]\s*(?:YS|DC|YSDC)-([A-Z0-9]{2,8})\d{8}/i
    ]);

    if (labeledCode) {
      return labeledCode.toUpperCase();
    }

    const customerValue = fields.customer?.value || "";
    const mappedCustomerCode = findMappedCustomerCode(customerValue);
    if (mappedCustomerCode) {
      return mappedCustomerCode;
    }

    const customerCode = inferCustomerCode(customerValue);
    return customerCode || "";
  }

  function findMappedCustomerCode(customerName) {
    const normalizedCustomer = normalizeCustomerCodeMapKey(customerName);
    const customerCodeMap = globalThis.CRM_WORKBENCH_CUSTOMER_CODE_MAP || {};

    return Object.entries(customerCodeMap).reduce((matchedCode, [name, code]) => {
      if (matchedCode) {
        return matchedCode;
      }

      const normalizedName = normalizeCustomerCodeMapKey(name);
      if (!normalizedName || !normalizedCustomer) {
        return "";
      }

      const isMatch = normalizedCustomer === normalizedName
        || normalizedCustomer.includes(normalizedName)
        || normalizedName.includes(normalizedCustomer);

      return isMatch ? String(code || "").trim().toUpperCase() : "";
    }, "");
  }

  function normalizeCustomerCodeMapKey(value) {
    return normalizeText(value).toUpperCase().replace(/\s+/g, " ");
  }

  function inferCustomerCode(customerName) {
    const normalizedCustomer = normalizeText(customerName).toUpperCase();
    if (!normalizedCustomer) {
      return "";
    }

    const uppercaseWords = normalizedCustomer.match(/\b[A-Z]{2,}\b/g);
    if (uppercaseWords?.length) {
      return uppercaseWords.slice(0, 3).map((word) => word[0]).join("").slice(0, 5);
    }

    const alphanumeric = normalizedCustomer.replace(/[^A-Z0-9]/g, "");
    return alphanumeric.slice(0, 5);
  }

  function inferApprovalDateCode(text, fields) {
    const dateValue = fields.signDate?.value || extractFirstMatchingText(text, [
      /(?:签订日期|合同日期|date)\s*[:：|]\s*(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2})/i,
      /(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2})/
    ]);
    const dateMatch = String(dateValue || "").match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);

    if (!dateMatch) {
      return "";
    }

    return `${dateMatch[1]}${dateMatch[2].padStart(2, "0")}${dateMatch[3].padStart(2, "0")}`;
  }

  function extractFirstMatchingText(text, patterns) {
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match?.[1]) {
        return cleanExtractedValue(match[1]);
      }
    }

    return "";
  }

  function applyDefaultRequiredCrmValues(fields) {
    getCrmFieldDefinitions().forEach((definition) => {
      if (fields[definition.key] || !Object.prototype.hasOwnProperty.call(DEFAULT_REQUIRED_CRM_VALUES, definition.key)) {
        return;
      }

      fields[definition.key] = {
        label: definition.crmLabel,
        value: DEFAULT_REQUIRED_CRM_VALUES[definition.key]
      };
    });
  }

  async function fillCrmFieldsInBestContext(fields) {
    const currentResult = fillCrmFieldsInDocument(fields);
    const frameResult = getCrmFrames().length > 0
      ? await fillCrmFieldsInFrames(fields)
      : { filled: 0, skipped: 0 };

    return {
      filled: currentResult.filled + frameResult.filled,
      skipped: currentResult.skipped + frameResult.skipped
    };
  }

  function fillCrmFieldsInFrames(fields) {
    const frames = getCrmFrames();
    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    let pendingResponses = frames.length;
    const aggregate = { filled: 0, skipped: 0 };

    return new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        cleanup();
        resolve(aggregate);
      }, FRAME_UPLOAD_TIMEOUT);

      function handleFrameResponse(event) {
        if (event.data?.type !== FRAME_AUTOFILL_RESPONSE || event.data.requestId !== requestId) {
          return;
        }

        aggregate.filled += Number(event.data.filled) || 0;
        aggregate.skipped += Number(event.data.skipped) || 0;
        pendingResponses -= 1;

        if (pendingResponses <= 0) {
          cleanup();
          resolve(aggregate);
        }
      }

      function cleanup() {
        window.clearTimeout(timer);
        window.removeEventListener("message", handleFrameResponse);
      }

      window.addEventListener("message", handleFrameResponse);
      frames.forEach((frame) => {
        frame.contentWindow.postMessage({
          type: FRAME_AUTOFILL_REQUEST,
          requestId,
          fields
        }, "*");
      });
    });
  }

  function fillCrmFieldsInDocument(fields) {
    let filled = 0;
    let skipped = 0;

    Object.values(fields).forEach((field) => {
      if (setCrmFieldValue(field.label, field.value)) {
        filled += 1;
      } else {
        skipped += 1;
      }
    });

    return { filled, skipped };
  }

  function setCrmFieldValue(label, value) {
    const labelElement = findCrmLabelElement(label);
    if (!labelElement) {
      return false;
    }

    const containers = getLikelyFieldContainers(labelElement);
    for (const container of containers) {
      if (setCustomSelectInContainer(container, value, labelElement) || setNativeFieldInContainer(container, value, labelElement)) {
        return true;
      }
    }

    return false;
  }

  function findCrmLabelElement(label) {
    const candidates = Array.from(document.body.querySelectorAll("label,span,div,td,th"))
      .filter((element) => {
        if (isExtensionElement(element) || !isVisible(element)) {
          return false;
        }

        const text = normalizeText(element.textContent).replace(/\*/g, "");
        return text === label || text.endsWith(label) || text.includes(label);
      });

    candidates.sort((first, second) => normalizeText(first.textContent).length - normalizeText(second.textContent).length);
    return candidates[0] || null;
  }

  function getLikelyFieldContainers(labelElement) {
    const selectors = [
      ".el-form-item",
      ".ant-form-item",
      ".ivu-form-item",
      ".form-item",
      "[class*='formItem']",
      "[class*='form-item']",
      "tr"
    ];
    const containers = selectors.map((selector) => labelElement.closest(selector)).filter(Boolean);
    let parent = labelElement.parentElement;
    while (parent && containers.length < 6 && parent !== document.body) {
      containers.push(parent);
      parent = parent.parentElement;
    }
    return [...new Set(containers)];
  }

  function setNativeFieldInContainer(container, value, labelElement) {
    const controls = Array.from(container.querySelectorAll("input:not([type='hidden']), textarea"))
      .filter((control) => control !== labelElement && !control.disabled && isVisible(control));

    const control = controls.find((item) => item.type !== "checkbox" && item.type !== "radio");
    if (!control) {
      return false;
    }

    setInputValue(control, value);
    return true;
  }

  function setCustomSelectInContainer(container, value, labelElement) {
    const select = Array.from(container.querySelectorAll("select")).find((control) => control !== labelElement && !control.disabled && isVisible(control));
    if (select) {
      return setSelectValue(select, value);
    }

    const clickable = Array.from(container.querySelectorAll("[role='combobox'],.el-select,.ant-select,.ivu-select,[class*='select']"))
      .find((element) => element !== labelElement && isVisible(element) && !isDisabled(element));

    if (!clickable) {
      return false;
    }

    clickCrmElement(clickable);
    const option = findDropdownOption(value);
    if (option) {
      clickCrmElement(option);
      return true;
    }

    const input = clickable.querySelector("input:not([type='hidden'])");
    if (input) {
      setInputValue(input, value);
      return true;
    }

    return false;
  }

  function setInputValue(input, value) {
    const setter = Object.getOwnPropertyDescriptor(input.constructor.prototype, "value")?.set;
    if (setter) {
      setter.call(input, value);
    } else {
      input.value = value;
    }
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  function setSelectValue(select, value) {
    const normalizedValue = normalizeComparableText(value);
    const option = Array.from(select.options).find((item) => {
      return normalizeComparableText(item.value) === normalizedValue || normalizeComparableText(item.textContent).includes(normalizedValue);
    });

    if (!option) {
      return false;
    }

    select.value = option.value;
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    return true;
  }

  function findDropdownOption(value) {
    const normalizedValue = normalizeComparableText(value);
    const optionSelectors = [
      ".el-select-dropdown__item",
      ".ant-select-item-option",
      ".ivu-select-item",
      "[role='option']",
      "li,div,span"
    ].join(",");

    const options = Array.from(document.body.querySelectorAll(optionSelectors)).filter((element) => {
      if (isExtensionElement(element) || !isVisible(element) || isDisabled(element)) {
        return false;
      }

      const text = normalizeComparableText(element.textContent);
      return text === normalizedValue || text.includes(normalizedValue) || normalizedValue.includes(text);
    });

    options.sort((first, second) => normalizeText(first.textContent).length - normalizeText(second.textContent).length);
    return options[0] || null;
  }

  function normalizeComparableText(value) {
    return normalizeText(value).toLowerCase().replace(/\s+/g, "").replace(/[()（）]/g, "");
  }

  function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  async function handleSyncClick() {
    if (!selectedFile) {
      showSidebarStatus(t("chooseFileBeforeSync"), "error");
      return;
    }

    const syncButton = shadowRoot.querySelector(".sync-button");
    syncButton.disabled = true;
    showSidebarStatus(t("uploadingFile", { filename: selectedFile.name }));

    try {
      await uploadSelectedFileToBestCrmContext(selectedFile);
      showSidebarStatus(t("uploadSent", { filename: selectedFile.name }), "success");
    } catch (error) {
      showSidebarStatus(error.message || t("crmUploadFailed"), "error");
    } finally {
      syncButton.disabled = false;
    }
  }

  async function uploadSelectedFileToBestCrmContext(file) {
    if (getCrmFrames().length > 0) {
      try {
        await uploadFileInCrmFrame(file);
        return;
      } catch (frameError) {
        if (!findAttachmentTab(document.body)) {
          throw frameError;
        }
      }
    }

    await uploadSelectedFileToCrm(file);
  }

  async function uploadSelectedFileToCrm(file) {
    const crmRoot = getCrmRoot();

    const attachmentTab = await waitForElement(() => findAttachmentTab(crmRoot), {
      timeout: CRM_MODAL_TIMEOUT,
      description: t("attachmentTabDescription")
    });

    clickCrmElement(attachmentTab);

    const uploadAttachmentButton = await waitForElement(() => findUploadAttachmentButton(crmRoot), {
      timeout: CRM_MODAL_TIMEOUT,
      description: t("uploadAttachmentButtonDescription")
    });

    clickCrmElement(uploadAttachmentButton);

    const uploadModal = await waitForElement(findUploadModal, {
      timeout: CRM_MODAL_TIMEOUT,
      description: t("uploadModalDescription")
    });

    const modalFileInput = await waitForElement(() => findModalFileInput(uploadModal), {
      timeout: CRM_MODAL_TIMEOUT,
      description: t("modalFileInputDescription")
    });

    injectFileIntoInput(modalFileInput, file);

    const modalUploadButton = await waitForElement(() => {
      return findEnabledButtonByText(uploadModal, ["上传文件"]);
    }, {
      timeout: CRM_UPLOAD_CONFIRM_TIMEOUT,
      description: t("modalUploadButtonDescription")
    });

    clickCrmElement(modalUploadButton);
  }

  function setupFrameUploadBridge() {
    window.addEventListener("message", async (event) => {
      if (event.source !== window.parent || event.data?.type !== FRAME_UPLOAD_REQUEST) {
        return;
      }

      const { requestId, file } = event.data;
      try {
        await uploadSelectedFileToCrm(file);
        window.parent.postMessage({
          type: FRAME_UPLOAD_RESPONSE,
          requestId,
          ok: true
        }, "*");
      } catch (error) {
        window.parent.postMessage({
          type: FRAME_UPLOAD_RESPONSE,
          requestId,
          ok: false,
          error: error.message || t("frameUploadFailed")
        }, "*");
      }
    });

    window.addEventListener("message", (event) => {
      if (event.source !== window.parent || event.data?.type !== FRAME_AUTOFILL_REQUEST) {
        return;
      }

      const { requestId, fields } = event.data;
      try {
        const result = fillCrmFieldsInDocument(fields || {});
        window.parent.postMessage({
          type: FRAME_AUTOFILL_RESPONSE,
          requestId,
          ok: true,
          filled: result.filled,
          skipped: result.skipped
        }, "*");
      } catch (error) {
        window.parent.postMessage({
          type: FRAME_AUTOFILL_RESPONSE,
          requestId,
          ok: false,
          filled: 0,
          skipped: Object.keys(fields || {}).length,
          error: error.message || t("crmAutofillFailed")
        }, "*");
      }
    });
  }

  function uploadFileInCrmFrame(file) {
    const frames = getCrmFrames();
    if (frames.length === 0) {
      return Promise.reject(new Error(t("frameNotFound")));
    }

    const requestId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const frameErrors = [];

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error(frameErrors[0] || t("frameReachFailed")));
      }, FRAME_UPLOAD_TIMEOUT);

      function handleFrameResponse(event) {
        if (event.data?.type !== FRAME_UPLOAD_RESPONSE || event.data.requestId !== requestId) {
          return;
        }

        if (event.data.ok) {
          cleanup();
          resolve();
          return;
        }

        if (event.data.error) {
          frameErrors.push(event.data.error);
        }
      }

      function cleanup() {
        window.clearTimeout(timer);
        window.removeEventListener("message", handleFrameResponse);
      }

      window.addEventListener("message", handleFrameResponse);
      for (const frame of frames) {
        frame.contentWindow.postMessage({
          type: FRAME_UPLOAD_REQUEST,
          requestId,
          file
        }, "*");
      }
    });
  }

  function getCrmFrames() {
    return Array.from(document.querySelectorAll("iframe")).filter((frame) => {
      try {
        return Boolean(frame.contentWindow);
      } catch (error) {
        return false;
      }
    });
  }

  function getCrmRoot() {
    return document.body;
  }

  function findAttachmentTab(root) {
    return findClickableByText(root, ["附件"], {
      exact: true,
      selectors: ".el-tabs__item,.ant-tabs-tab,.ivu-tabs-tab,[role='tab'],button,a,span,div"
    });
  }

  function findUploadAttachmentButton(root) {
    return findClickableByText(root, ["+ 上传附件", "＋ 上传附件", "上传附件"], {
      selectors: "button,a,[role='button'],.el-button,.ant-btn,.ivu-btn,span,div"
    });
  }

  function findUploadModal() {
    const frameworkModalCandidates = Array.from(document.querySelectorAll([
      ".el-dialog",
      ".ant-modal",
      ".ivu-modal",
      ".modal",
      "[role='dialog']",
      "[aria-modal='true']"
    ].join(",")));

    const frameworkModal = frameworkModalCandidates.find(isUploadModalElement);
    if (frameworkModal) {
      return frameworkModal;
    }

    const textMatchedCandidates = Array.from(document.body.querySelectorAll("div,section,article,[class]"))
      .filter(isUploadModalElement)
      .filter((candidate) => {
        const rect = candidate.getBoundingClientRect();
        return rect.width >= 260 && rect.height >= 120;
      });

    textMatchedCandidates.sort((first, second) => {
      return getElementArea(first) - getElementArea(second);
    });

    return textMatchedCandidates[0] || null;
  }

  function findModalFileInput(modal) {
    return findEnabledFileInput(modal) || findEnabledFileInput(document.body);
  }

  function findEnabledFileInput(root) {
    return Array.from(root.querySelectorAll("input[type='file']")).find((input) => {
      return !input.disabled && !isExtensionElement(input);
    }) || null;
  }

  function isUploadModalElement(element) {
    if (isExtensionElement(element) || !isVisible(element)) {
      return false;
    }

    const text = normalizeText(element.textContent);
    return text.includes("文件上传") && (text.includes("选择文件") || text.includes("上传文件"));
  }

  function getElementArea(element) {
    const rect = element.getBoundingClientRect();
    return Math.round(rect.width * rect.height);
  }

  function findClickableByText(root, labels, options = {}) {
    const exact = options.exact === true;
    const selectorTiers = options.selectors ? [options.selectors] : [
      "button,a,[role='button'],.el-button,.ant-btn,.ivu-btn,.el-tabs__item,.ant-tabs-tab,.ivu-tabs-tab",
      "span,li,div"
    ];

    for (const selectors of selectorTiers) {
      const matches = Array.from(root.querySelectorAll(selectors)).filter((element) => {
        if (isExtensionElement(element) || !isVisible(element) || isDisabled(element)) {
          return false;
        }

        const elementText = normalizeText(element.textContent);
        if (!elementText) {
          return false;
        }

        return labels.some((label) => {
          const normalizedLabel = normalizeText(label);
          return exact ? elementText === normalizedLabel : elementText.includes(normalizedLabel);
        });
      });

      if (matches.length > 0) {
        matches.sort((first, second) => normalizeText(first.textContent).length - normalizeText(second.textContent).length);
        return getClosestClickable(matches[0]);
      }
    }

    return null;
  }

  function findEnabledButtonByText(root, labels) {
    const buttonSelectors = "button,[role='button'],.el-button,.ant-btn,.ivu-btn";
    return Array.from(root.querySelectorAll(buttonSelectors)).find((element) => {
      if (isExtensionElement(element) || !isVisible(element) || isDisabled(element)) {
        return false;
      }

      const elementText = normalizeText(element.textContent);
      return labels.some((label) => elementText.includes(normalizeText(label)));
    }) || null;
  }

  function injectFileIntoInput(fileInput, file) {
    const transfer = new DataTransfer();
    transfer.items.add(file);
    fileInput.files = transfer.files;
    fileInput.dispatchEvent(new Event("input", { bubbles: true }));
    fileInput.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function getClosestClickable(element) {
    return element.closest("button,a,[role='button'],.el-button,.ant-btn,.ivu-btn,.el-tabs__item,.ant-tabs-tab,.ivu-tabs-tab") || element;
  }

  function clickCrmElement(element) {
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true, view: window }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true, view: window }));
    element.click();
  }

  function isExtensionElement(element) {
    return Boolean(element.closest(`#${SIDEBAR_ID}`));
  }

  function waitForElement(findElement, options) {
    const timeout = options.timeout || 8000;
    const description = options.description || "the requested element";

    return new Promise((resolve, reject) => {
      const existingElement = findElement();
      if (existingElement) {
        resolve(existingElement);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = findElement();
        if (element) {
          cleanup();
          resolve(element);
        }
      });

      const interval = window.setInterval(() => {
        const element = findElement();
        if (element) {
          cleanup();
          resolve(element);
        }
      }, 150);

      const timer = window.setTimeout(() => {
        cleanup();
        reject(new Error(t("waitAttachmentForm", { description })));
      }, timeout);

      function cleanup() {
        window.clearTimeout(timer);
        window.clearInterval(interval);
        observer.disconnect();
      }

      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "disabled", "aria-disabled"]
      });
    });
  }

  function isVisible(element) {
    const rect = element.getBoundingClientRect();
    const style = window.getComputedStyle(element);
    return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  }

  function isDisabled(element) {
    return element.disabled === true || element.getAttribute("aria-disabled") === "true" || element.classList.contains("is-disabled") || element.classList.contains("disabled");
  }

  function normalizeText(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function showSidebarStatus(message, type = "info") {
    const editor = shadowRoot.querySelector(".editor");
    const statusClass = type === "success" ? " status--success" : type === "error" ? " status--error" : "";
    const existingStatus = editor.querySelector(".crm-workbench-runtime-status");

    if (existingStatus) {
      existingStatus.remove();
    }

    editor.insertAdjacentHTML("afterbegin", `<p class="status crm-workbench-runtime-status${statusClass}">${escapeHtml(message)}</p>`);
  }

  function isPdf(file) {
    return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  }

  function isDocx(file) {
    return file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || file.name.toLowerCase().endsWith(".docx");
  }

  function isDoc(file) {
    return file.type === "application/msword" || file.name.toLowerCase().endsWith(".doc");
  }

  function isPreviewableImage(file) {
    const filename = file.name.toLowerCase();
    return file.type === "image/jpeg" || file.type === "image/png" || filename.endsWith(".jpg") || filename.endsWith(".jpeg") || filename.endsWith(".png");
  }

  function isSpreadsheet(file) {
    const filename = file.name.toLowerCase();
    return file.type === "application/vnd.ms-excel"
      || file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      || file.type === "text/csv"
      || filename.endsWith(".xls")
      || filename.endsWith(".xlsx")
      || filename.endsWith(".csv");
  }

  function getSavableEditorHtml(html) {
    const template = document.createElement("template");
    template.innerHTML = html;
    template.content.querySelectorAll(".crm-workbench-runtime-status").forEach((element) => element.remove());
    template.content.querySelectorAll(".docx-preview-window").forEach((previewWindow) => {
      const scaleSurface = previewWindow.querySelector(".preview-scale-surface");
      if (scaleSurface) {
        previewWindow.replaceWith(...Array.from(scaleSurface.childNodes));
      }
    });
    template.content.querySelectorAll(".preview-window:not(.calculated-sheet-preview):not(.docx-preview-window), .preview-resize-handle").forEach((element) => element.remove());
    return template.innerHTML;
  }

  function getFileBaseName(filename) {
    return filename.replace(/\.[^.]+$/, "") || "crm-workbench";
  }

  function formatDownloadTimestamp(date) {
    const pad = (value) => String(value).padStart(2, "0");
    return [
      date.getFullYear(),
      pad(date.getMonth() + 1),
      pad(date.getDate())
    ].join("")
      + "-"
      + [
        pad(date.getHours()),
        pad(date.getMinutes()),
        pad(date.getSeconds())
      ].join("");
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1024 * 1024) {
      return `${Math.round(bytes / 1024)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
      };
      return entities[character];
    });
  }

  function escapeXml(value) {
    return String(value).replace(/[&<>"']/g, (character) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;"
      };
      return entities[character];
    });
  }
})();
