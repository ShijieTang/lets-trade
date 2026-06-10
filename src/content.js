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
  const CRM_HORIZONTAL_SCROLLBAR_ID = "crm-workbench-crm-horizontal-scrollbar";
  const SIDEBAR_ID = "crm-workbench-sidebar-host";
  const STYLE_ID = "crm-workbench-page-split-style";
  const WIDTH_STORAGE_KEY = "crmWorkbenchSidebarWidthPx";
  const COLLAPSED_STORAGE_KEY = "crmWorkbenchSidebarCollapsed";
  const PREVIEW_HEIGHT_STORAGE_KEY = "crmWorkbenchPreviewHeightPx";
  const PREVIEW_ZOOM_STORAGE_KEY = "crmWorkbenchPreviewZoom";
  const LANGUAGE_STORAGE_KEY = "crmWorkbenchLanguage";
  const QUICK_LINKS_STORAGE_KEY = "crmWorkbenchQuickLinks";
  const REMOVED_DEFAULT_QUICK_LINKS_STORAGE_KEY = "crmWorkbenchRemovedDefaultQuickLinks";
  const DOC_FLOW_UI_STATE_STORAGE_KEY = "crmWorkbenchDocFlowUiState";
  const DOC_FLOW_QUICK_REF_OPEN_STORAGE_KEY = "crmWorkbenchDocFlowQuickRefOpen";
  const GEMINI_FIRST_SEND_CONFIRMED_STORAGE_KEY = "crmWorkbenchGeminiFirstSendConfirmed";
  const DOC_FLOW_DB_NAME = "DocFlowMatrixDB";
  const DOC_FLOW_DB_VERSION = 1;
  const DOC_FLOW_ORDER_STORE = "orders";
  const DOC_FLOW_FILE_STORE = "files";
  const BOOKMARK_FOLDERS_MESSAGE = "CRM_WORKBENCH_GET_BOOKMARK_FOLDERS";
  const BOOKMARK_LINKS_MESSAGE = "CRM_WORKBENCH_GET_BOOKMARK_LINKS";
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
  const FINANCIAL_CALCULATED_HEADER_KEYS = ["netProfit", "taxRebateAmount", "totalProfit", "exchangeTaxRatio"];
  const PURCHASE_CALCULATED_HEADER_KEYS = ["contractPurchaseAmount", "taxExcludedAmount", "contractUnitPrice"];
  const DOC_FLOW_STEPS = [
    { step: 1 },
    { step: 2 },
    { step: 3 },
    { step: 4 }
  ];
  const DOC_FLOW_FILE_SLOTS = ["factoryDispatchPhoto", "warehouseEntryPhoto"];
  const DOC_FLOW_TRANSLATIONS = {
    zh: {
      moduleTitle: "单证流水推进矩阵",
      moduleSubtitle: "IndexedDB 保存单证记录和图片，chrome.storage.local 仅保存当前界面状态。",
      quickRefTab: "📋 关键信息",
      quickRefTitle: "关键信息面板",
      quickRefClose: "收起关键信息面板",
      quickRefEmpty: "打开或新建单证流程后显示高频追踪信息。",
      dashboardTitle: "中央大盘",
      newFlow: "新建单证流程",
      dashboardLoading: "正在读取单证流水推进记录...",
      dashboardError: "无法读取单证流水记录，请确认浏览器允许 IndexedDB。",
      dashboardEmpty: "暂无活跃单证流程。点击“新建单证流程”输入 SC NO. 后开始跟踪。",
      orderNo: "订单号/SC NO.",
      customerName: "客户名称",
      destinationPort: "目的港",
      etd: "ETD",
      currentProgress: "当前进度",
      action: "操作",
      open: "打开",
      delete: "删除",
      archived: "已归档",
      loadingOrder: "正在异步读取 {scNo} 的记录和图片...",
      orderLoadFailed: "单证流水记录加载失败。",
      backDashboard: "返回中央大盘",
      prev: "返回上一步",
      saveExit: "暂存并退出",
      next: "下一步",
      finalStep: "流程终点",
      stepTitle1: "合同建立与需求锁定",
      stepTitle2: "询价订舱与单据初制",
      stepTitle3: "贴签控制、发货出库与进仓核对",
      stepTitle4: "报关申请、单证确认、交单寄件",
      canNext: "可进入下一步",
      canArchive: "可归档结单",
      step1Gate: "需确认收到客户官方 PO。",
      step2Gate: "需完成标签/COA 客户确认邮件；如已登记船期，还需确认财务预警。",
      step3Gate: "需客户邮件确认标签和 COA，并核对进仓标签/船机批复。",
      step4Gate: "需填写 DHL 单号，并确认已邮件通知客户。",
      orderOverview: "订单概况",
      customerPoNo: "客户订单号 / PO NO.",
      incoterms: "成交方式 / Incoterms",
      paymentTime: "付款时间",
      officialEnglishName: "官方英文品名",
      step1Section: "合同建立与需求锁定",
      productName: "品名",
      unitPrice: "单价",
      quantity: "数量",
      commissionRequirement: "佣金要求",
      scCreatedAndSent: "我已在主系统完成 SC 制作并发送给业务员",
      scAndPoTracking: "跟踪客户回签 SC 与正式 PO 的下发状态",
      officialPoReceived: "确认收到客户官方 PO",
      poWarning: "收到PO，请深度核对是否存在客户的特殊单证或包装需求！",
      specialRequirements: "客户特殊需求备注",
      factoryLine: "工厂线",
      expectedFactoryDispatchDate: "预计发货日期",
      factoryCoaWarning: "请立即联系工厂提供 CoA 或生产批号/日期！",
      coaBatchDate: "CoA / 生产批号 / 日期",
      hazardousChemicals: "本单属于危险化学品",
      dangerousCasNo: "危险品 CAS NO.",
      hazchemInspectionNeeded: "需要危包商检，提供商检资料",
      hazchemInspectionTooltip: "提示按照工厂要求发送相关资料，若不需要商检可略过",
      hazchemInfoReceived: "收到危包信息",
      hazchemInfoTooltip: "特殊化学品需在系统中上传 YSDC 和 DC 文件",
      forwarderLine: "货代线",
      forwarderEtd: "预计船期/ETD",
      eta: "到港时间 / ETA",
      warehouseEntryTime: "进仓时间",
      documentCutoffTime: "截单时间",
      forwarderPhone: "货代电话",
      freightUsd: "运价(USD)",
      freightRmb: "运价(RMB)",
      bookingDocs: "订舱与单据初制",
      bookingInstructionSent: "已发送托书",
      tenDigitWarehouseNo: "十位进仓编号",
      bookPackageCount: "账面件数",
      bookVolume: "账面体积",
      bookGrossWeight: "账面毛重",
      invoice: "INVOICE",
      packingList: "PL",
      cooDraft: "产地证(COO)草单",
      insurancePolicy: "保单",
      batchCertificate: "批号证明文件",
      financeAndCustomerConfirm: "财务预警与客户确认",
      productScheduleRegistered: "已在主系统首页登记产品船期",
      financeWarningAcknowledged: "已知晓并通知会计（或本单不涉及）",
      formalLabelAndCoaSent: "缮制正式货物标签，并将【COA + 标签】邮件发送至客户进行最终确认",
      preConfirm: "前置确认",
      customerLabelCoaConfirmed: "客户已正式邮件答复，最终确认标签和 COA",
      step3Section: "贴签控制、发货出库与进仓核对",
      originalFactory: "原厂货物",
      nonOriginalFactory: "非原厂货物",
      factoryTruckDispatched: "工厂已装车发货",
      driverNamePlate: "司机姓名/车牌",
      driverPhone: "司机电话",
      factoryDispatchPhoto: "选择并上传: 工厂发货现场照片",
      actualPackageCount: "实际件数",
      actualVolume: "实际体积",
      actualWeight: "实际重量",
      warehouseEntryPhoto: "选择并上传: 现场进仓照与截止图",
      warehouseLabelVerified: "仔细核对进仓标签，确认船/机未被否决（船批复否 = 否）",
      customsHazchemDocs: "报关与危化品文件",
      customsDocsSentToForwarder: "完整报关文件已发给货代",
      declarationElementsStamped: "申报要素产品说明盖章后扫描...",
      hazchemOriginalsForwarded: "催收工厂危包证/商检单正本，收到后秒转发给货代",
      vesselTracking: "船期跟踪",
      normalDeparture: "顺利离港",
      abnormalDeparture: "发生异常（托班/漏装等）",
      blConfirm: "提单确认",
      blDraftReceivedAndReviewed: "收到提单草稿并我方一审核对",
      customerConfirmedBlDraft: "客户已正式邮件确认提单草稿",
      officialBlReceived: "确认开船，已收到正式正本提单（或电放件）",
      blScanSentToCustomer: "正本提单扫描件已发给客户",
      dispatchAudit: "交单寄件审核",
      bankDocsSentByDhl: "全套结汇资料送交银行并由 DHL 寄出",
      ciPlLabelSigned: "客户的CI/PL/标签为签字版",
      labelCustomsInfoAccurate: "标签，报关单等资料的信息准确无误",
      closeout: "结单",
      dhlNo: "DHL 单号 / DHL NO.",
      dhlNoNotifiedCustomer: "已通过邮件将 DHL 单号正式通知客户，提示准备赎单",
      archiveCloseout: "点击归档结单",
      vesselCritical: "必须第一时间通报业务员，由其对外协调解释口径！",
      newFlowTitle: "新建单证流程",
      newFlowText: "输入新的 SC NO.，系统将在 DocFlowMatrixDB 中建立空白流程记录。",
      cancel: "取消",
      create: "创建",
      invalidScNo: "请输入有效的 SC NO.",
      createFailed: "单证流程创建失败。",
      financeWarningTitle: "财务预警",
      financeWarningText: "预警：拉货前需付货款的，更新前必须提前通知会计！",
      acknowledged: "已知晓",
      fileEmpty: "未上传图片。选择文件后将直接写入 DocFlowMatrixDB。",
      uploadedImage: "已上传图片",
      imagePreview: "单证图片预览",
      copy: "复制{label}",
      copied: "已复制",
      copyFailed: "复制失败",
      notFilled: "未填写",
      specialRequirementsEmpty: "未填写，请在 Step 1 补充。",
      groupContract: "契约身份与防错核心",
      groupLogistics: "物流追踪与窗口期",
      groupCargo: "货物性状与单据要素",
      groupFinance: "财务与收尾",
      salesContractNo: "销售合同号",
      contractPayment: "成交/付款",
      paymentTimeLocked: "付款时间已锁定",
      warehouseCutoff: "进仓/截单",
      productionBatchDate: "生产批号/日期",
      bookData: "账面数据",
      actualWarehouseData: "实际进仓数据",
      packageCountShort: "件数",
      volumeShort: "体积",
      grossWeightShort: "毛重",
      financeStatus: "会计预警状态",
      financeNotified: "🟢 已通知会计",
      financeNotApplicable: "⚪ 未触发/不涉及",
      deleteConfirm: "确认删除订单 {scNo}？该操作会同时删除该订单的单证记录和图片。",
      deletingOrder: "正在删除 {scNo}...",
      deletedOrder: "已删除 {scNo}。",
      deleteFailed: "订单删除失败。",
      archiveFailed: "归档结单失败。",
      saveFailed: "单证记录暂存失败。",
      imageSaveFailed: "图片写入 IndexedDB 失败。",
      justNow: "刚刚"
    },
    en: {
      moduleTitle: "Documentation Flow Matrix",
      moduleSubtitle: "IndexedDB stores document records and images. chrome.storage.local stores only active UI state.",
      quickRefTab: "📋 Key Info",
      quickRefTitle: "Quick Reference",
      quickRefClose: "Collapse quick reference drawer",
      quickRefEmpty: "Open or create a documentation flow to show frequent tracking data.",
      dashboardTitle: "Dashboard",
      newFlow: "New Doc Flow",
      dashboardLoading: "Loading documentation flow records...",
      dashboardError: "Unable to read documentation records. Confirm the browser allows IndexedDB.",
      dashboardEmpty: "No active documentation flows. Click “New Doc Flow” and enter an SC NO. to start tracking.",
      orderNo: "Order/SC NO.",
      customerName: "Customer",
      destinationPort: "Destination Port",
      etd: "ETD",
      currentProgress: "Progress",
      action: "Action",
      open: "Open",
      delete: "Delete",
      archived: "Archived",
      loadingOrder: "Loading records and images for {scNo} asynchronously...",
      orderLoadFailed: "Documentation flow record failed to load.",
      backDashboard: "Back to Dashboard",
      prev: "Previous",
      saveExit: "Save & Exit",
      next: "Next",
      finalStep: "Final Step",
      stepTitle1: "Contract Setup & Requirement Lock",
      stepTitle2: "Inquiry, Booking & Initial Documents",
      stepTitle3: "Label Control, Dispatch & Warehouse Check",
      stepTitle4: "Customs, Document Confirmation & Dispatch",
      canNext: "Ready for next step",
      canArchive: "Ready to archive",
      step1Gate: "Confirm customer official PO.",
      step2Gate: "Complete the label/COA confirmation email; if schedule was registered, confirm the finance warning.",
      step3Gate: "Customer email must confirm label and COA, and warehouse label/vessel approval must be checked.",
      step4Gate: "Fill the DHL number and confirm the customer was notified by email.",
      orderOverview: "Order Overview",
      customerPoNo: "Customer PO NO.",
      incoterms: "Incoterms",
      paymentTime: "Payment Time",
      officialEnglishName: "Official English Product Name",
      step1Section: "Contract Setup & Requirement Lock",
      productName: "Product name",
      unitPrice: "Unit price",
      quantity: "Quantity",
      commissionRequirement: "Commission requirement",
      scCreatedAndSent: "SC has been created in the main system and sent to salesperson",
      scAndPoTracking: "Track customer countersigned SC and official PO release",
      officialPoReceived: "Official customer PO received",
      poWarning: "PO received. Deep-check whether the customer has special documentation or packaging requirements!",
      specialRequirements: "Customer special requirements notes",
      factoryLine: "Factory Line",
      expectedFactoryDispatchDate: "Expected Dispatch Date",
      factoryCoaWarning: "Contact factory immediately for CoA or production batch/date!",
      coaBatchDate: "CoA / Production Batch / Date",
      hazardousChemicals: "This order is hazardous chemicals",
      dangerousCasNo: "Dangerous Goods CAS NO.",
      hazchemInspectionNeeded: "Dangerous package inspection needed; provide inspection materials",
      hazchemInspectionTooltip: "Send relevant materials according to factory requirements. Skip if inspection is not needed.",
      hazchemInfoReceived: "Hazardous package info received",
      hazchemInfoTooltip: "Special chemicals require YSDC and DC files uploaded in the system.",
      forwarderLine: "Forwarder Line",
      forwarderEtd: "Estimated Sailing / ETD",
      eta: "Arrival Time / ETA",
      warehouseEntryTime: "Warehouse Entry Time",
      documentCutoffTime: "SI Cut-off",
      forwarderPhone: "Forwarder Phone",
      freightUsd: "Freight (USD)",
      freightRmb: "Freight (RMB)",
      bookingDocs: "Booking & Initial Documents",
      bookingInstructionSent: "Booking instruction sent",
      tenDigitWarehouseNo: "10-digit Warehouse Code",
      bookPackageCount: "Book Package Count",
      bookVolume: "Book Volume",
      bookGrossWeight: "Book Gross Weight",
      invoice: "INVOICE",
      packingList: "PL",
      cooDraft: "COO draft",
      insurancePolicy: "Insurance policy",
      batchCertificate: "Batch certificate file",
      financeAndCustomerConfirm: "Finance Warning & Customer Confirmation",
      productScheduleRegistered: "Product sailing schedule registered on main system homepage",
      financeWarningAcknowledged: "Known and accountant notified (or not applicable)",
      formalLabelAndCoaSent: "Formal cargo label prepared; COA + label emailed to customer for final confirmation",
      preConfirm: "Pre-confirmation",
      customerLabelCoaConfirmed: "Customer formally confirmed label and COA by email",
      step3Section: "Label Control, Dispatch, and Warehouse Check",
      originalFactory: "Original factory goods",
      nonOriginalFactory: "Non-original factory goods",
      factoryTruckDispatched: "Factory loaded and dispatched truck",
      driverNamePlate: "Driver name / Plate",
      driverPhone: "Driver phone",
      factoryDispatchPhoto: "Select/upload: Factory dispatch site photos",
      actualPackageCount: "Actual package count",
      actualVolume: "Actual volume",
      actualWeight: "Actual weight",
      warehouseEntryPhoto: "Select/upload: Warehouse site photos and cut-off screenshot",
      warehouseLabelVerified: "Carefully checked warehouse labels and confirmed vessel/flight was not rejected",
      customsHazchemDocs: "Customs & Hazardous Chemical Docs",
      customsDocsSentToForwarder: "Complete customs declaration documents sent to forwarder",
      declarationElementsStamped: "Declaration elements/product description stamped and scanned...",
      hazchemOriginalsForwarded: "Chase factory for original dangerous package/inspection docs and forward immediately",
      vesselTracking: "Vessel Tracking",
      normalDeparture: "Departed normally",
      abnormalDeparture: "Exception occurred (delay/missed loading/etc.)",
      blConfirm: "BL Confirmation",
      blDraftReceivedAndReviewed: "BL draft received and reviewed by us first",
      customerConfirmedBlDraft: "Customer formally confirmed BL draft by email",
      officialBlReceived: "Sailing confirmed; official original BL or telex release received",
      blScanSentToCustomer: "Original BL scan sent to customer",
      dispatchAudit: "Presentation & Dispatch Audit",
      bankDocsSentByDhl: "Full bank negotiation docs delivered to bank and sent by DHL",
      ciPlLabelSigned: "Customer CI/PL/label are signed versions",
      labelCustomsInfoAccurate: "Label, customs declaration, and related document information is accurate",
      closeout: "Closeout",
      dhlNo: "DHL NO.",
      dhlNoNotifiedCustomer: "DHL number formally emailed to customer with redemption reminder",
      archiveCloseout: "Archive & Close Order",
      vesselCritical: "Notify salesperson immediately so they can coordinate the external explanation!",
      newFlowTitle: "New Documentation Flow",
      newFlowText: "Enter a new SC NO. to create a blank flow record in DocFlowMatrixDB.",
      cancel: "Cancel",
      create: "Create",
      invalidScNo: "Enter a valid SC NO.",
      createFailed: "Documentation flow creation failed.",
      financeWarningTitle: "Finance Warning",
      financeWarningText: "Warning: if payment is required before cargo pickup, accounting must be notified before updating!",
      acknowledged: "Acknowledged",
      fileEmpty: "No image uploaded. Choosing a file writes it directly into DocFlowMatrixDB.",
      uploadedImage: "Uploaded image",
      imagePreview: "Document image preview",
      copy: "Copy {label}",
      copied: "Copied",
      copyFailed: "Copy failed",
      notFilled: "Not filled",
      specialRequirementsEmpty: "Not filled. Complete this in Step 1.",
      groupContract: "Contract & Rules",
      groupLogistics: "Logistics & Deadlines",
      groupCargo: "Cargo & Spec",
      groupFinance: "Finance & Closeout",
      salesContractNo: "SC NO.",
      contractPayment: "Incoterms/Payment",
      paymentTimeLocked: "Payment time locked",
      warehouseCutoff: "Warehouse/Cut-off",
      productionBatchDate: "Production Batch/Date",
      bookData: "Book Data",
      actualWarehouseData: "Actual Warehouse Data",
      packageCountShort: "Pkg",
      volumeShort: "Vol",
      grossWeightShort: "GW",
      financeStatus: "Accounting Status",
      financeNotified: "🟢 Accountant notified",
      financeNotApplicable: "⚪ Not triggered / N/A",
      deleteConfirm: "Delete order {scNo}? This also deletes its documentation record and images.",
      deletingOrder: "Deleting {scNo}...",
      deletedOrder: "Deleted {scNo}.",
      deleteFailed: "Order deletion failed.",
      archiveFailed: "Archive closeout failed.",
      saveFailed: "Documentation record save failed.",
      imageSaveFailed: "Image write to IndexedDB failed.",
      justNow: "Just now"
    }
  };
  const DEFAULT_QUICK_LINKS = [
    {
      id: "default-origin-certificate",
      title: "中国贸促会原产地网上签证",
      titleEn: "CCPIT Certificate of Origin Online Application",
      url: "https://declare.ecoccpit.net/#/login",
      legacyUrls: ["https://declare.ecoccpit.net/#/home"]
    },
    {
      id: "default-hs-code",
      title: "HS Code查询网站",
      titleEn: "HS Code Lookup",
      url: "https://www.hsbianma.com/"
    },
    {
      id: "default-iupac",
      title: "化合物百科（IUPAC NAME）",
      titleEn: "Compound Encyclopedia (IUPAC Name)",
      url: "https://baike.kingdraw.com/Scripts/app/index.html?lang=zh-cn"
    },
    {
      id: "default-english-amount",
      title: "英文金额大写转换器",
      titleEn: "English Amount in Words Converter",
      url: "https://www.iamwawa.cn/yingwendaxie.html"
    },
    {
      id: "default-qr-code",
      title: "二维码",
      titleEn: "QR Code Generator",
      url: "https://www.hlcode.cn/files?p=bd-tt-2&bd_vid=10001297870238842467"
    },
    {
      id: "default-time-calculator",
      title: "时间计算器",
      titleEn: "Time Calculator",
      url: "https://8jz.cn/time-calculator/"
    }
  ];
  const DEFAULT_REQUIRED_CRM_VALUES = {
    purchaseSaleMode: "以销定购",
    overfillRate: "5%",
    shortfallRate: "5%"
  };
  const PRODUCT_FIELD_KEYS = new Set(["productName", "quantity", "unit", "unitPrice", "productAmount"]);
  const GEMINI_TO_CRM_FIELD_MAP = {
    signingDate: "signDate",
    customerOrderNo: "customerOrderNo",
    quotationNo: "quoteNo",
    purchaseSaleMode: "purchaseSaleMode",
    customer: "customer",
    countryRegion: "country",
    contactPerson: "contact",
    currency: "currency",
    exchangeRate: "exchangeRate",
    contractTotalAmount: "contractAmount",
    usdTotalAmount: "usdAmount",
    paymentMethod: "paymentMethod",
    deliveryPeriod: "deliveryTerm",
    transportMode: "transportMode",
    portOfLoading: "loadingPort",
    destinationPort: "destinationPort",
    portOfLoadingCountry: "loadingCountry",
    destinationPortCountry: "destinationCountry",
    destinationPlace: "destination",
    incoterm: "tradeTerm",
    overfillRate: "overfillRate",
    shortfallRate: "shortfallRate",
    shippingMark: "shippingMark",
    remarks: "remark",
    casNo: "casNo",
    customsScNo: "customsScNo"
  };
  const TRADE_TO_CRM_FIELD_MAP = {
    buyer: "customer",
    productName: "productName",
    officialEnglishName: "productName",
    casNo: "casNo",
    quantity: "quantity",
    unit: "unit",
    unitPrice: "unitPrice",
    currency: "currency",
    totalAmount: "contractAmount",
    paymentTerm: "paymentMethod",
    incoterm: "tradeTerm",
    destinationPort: "destinationPort",
    portOfLoading: "loadingPort"
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
      crmHorizontalScrollLabel: "CRM 横向滚动控制",
      crmHorizontalScrollStart: "滚动到 CRM 最左侧",
      crmHorizontalScrollLeft: "CRM 向左滚动",
      crmHorizontalScrollRight: "CRM 向右滚动",
      crmHorizontalScrollEnd: "滚动到 CRM 最右侧",
      crmHorizontalScrollThumb: "拖动 CRM 横向滚动条",
      sectionNavLabel: "工作台分区导航",
      navUpload: "上传",
      navLinks: "网站",
      navAutoFill: "填表",
      navDocFlow: "单证",
      navCalculator: "计算",
      navFinancial: "退税",
      navDocument: "文档",
      navActions: "操作",
      uploadTitle: "上传文档或图片文件",
      uploadHint: "点击或拖入文档、PDF、图片或表格文件。",
      uploadAria: "文档上传拖放区域",
      autoFillTitle: "AI 自动填表",
      autoFillLoadPdf: "载入 PDF",
      autoFillValidate: "校验数据",
      autoFillFillCrm: "填入 CRM 字段",
      autoFillSaveMapping: "保存映射",
      autoFillSettings: "Gemini 设置",
      autoFillSaveSettings: "保存 Gemini 设置",
      autoFillApiKey: "API Key",
      autoFillModel: "模型",
      autoFillMode: "提取模式",
      autoFillEmpty: "载入 PDF 后显示可填字段。",
      autoFillNoPdf: "请先选择 PDF 文件。",
      autoFillExtracting: "正在通过 Gemini 提取 PDF 字段...",
      autoFillExtracted: "已提取 {count} 个字段，请校验后填入。",
      autoFillValidated: "已校验：{ready} 项可填，{review} 项需复核。",
      autoFillFilled: "已填 {filled} 项，跳过 {skipped} 项，未匹配 {unmatched} 项。",
      autoFillMappingSaved: "已保存 {count} 个字段映射。",
      autoFillConfigSaved: "Gemini 设置已保存。",
      autoFillRawResponse: "Gemini 原始响应",
      autoFillRawResponseEmpty: "提取后显示 Gemini 原始响应。",
      autoFillField: "字段",
      autoFillValue: "值",
      autoFillConfidence: "置信度",
      autoFillRisk: "风险",
      autoFillValidation: "校验",
      autoFillInclude: "填入",
      autoFillReady: "通过",
      autoFillReview: "复核",
      autoFillHigh: "高",
      autoFillMedium: "中",
      autoFillLow: "低",
      autoFillNoFields: "没有可填字段。",
      quickLinksTitle: "常用网站",
      quickLinksNameLabel: "网站名称",
      quickLinksUrlLabel: "网址",
      quickLinksNamePlaceholder: "网站名称",
      quickLinksUrlPlaceholder: "https://example.com",
      quickLinksAdd: "添加",
      quickLinksUpdate: "更新",
      quickLinksCancel: "取消",
      quickLinksOpen: "打开 {name}",
      quickLinksEdit: "编辑 {name}",
      quickLinksRemove: "移除 {name}",
      quickLinksDefaultBadge: "默认",
      quickLinksCustomBadge: "自定义",
      quickLinksBookmarkFolder: "Chrome 收藏夹",
      quickLinksBookmarkSelect: "选择收藏夹",
      quickLinksImport: "导入",
      quickLinksInvalidUrl: "请输入有效网址。",
      quickLinksDuplicate: "该网址已存在。",
      quickLinksSaved: "已添加 {name}。",
      quickLinksRemoved: "已移除 {name}。",
      quickLinksBookmarkUnavailable: "无法读取 Chrome 收藏夹。",
      quickLinksImportNone: "该收藏夹没有可导入的网站链接。",
      quickLinksImportSuccess: "已导入 {count} 个链接。",
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
      pdfLoaded: "PDF 预览已加载，正在提取可编辑文本。",
      pdfExtracting: "正在从 PDF 中提取可编辑文本...",
      pdfExtracted: "已提取 PDF 文本，可直接编辑后再填入 CRM。",
      pdfExtractNoText: "未从 PDF 中提取到可编辑文字。如果这是扫描件，请先 OCR 后把文字粘贴到这里。",
      pdfExtractFailed: "PDF 文本提取失败：{message}。如为扫描件，请先 OCR 后把文字粘贴到这里。",
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
      noExtractableContent: "没有可识别的文本。请先上传可提取文字的 PDF、DOCX 或表格；扫描件请先 OCR 后把文字粘贴到这里。",
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
      crmHorizontalScrollLabel: "CRM horizontal scroll controls",
      crmHorizontalScrollStart: "Scroll CRM to the far left",
      crmHorizontalScrollLeft: "Scroll CRM left",
      crmHorizontalScrollRight: "Scroll CRM right",
      crmHorizontalScrollEnd: "Scroll CRM to the far right",
      crmHorizontalScrollThumb: "Drag CRM horizontal scrollbar",
      sectionNavLabel: "Workbench section navigation",
      navUpload: "Upload",
      navLinks: "Links",
      navAutoFill: "Auto Fill",
      navDocFlow: "Flow",
      navCalculator: "Calc",
      navFinancial: "Tax",
      navDocument: "Docs",
      navActions: "Actions",
      uploadTitle: "Upload document or image file",
      uploadHint: "Click or drag document, PDF, image, or table files here.",
      uploadAria: "Document upload drop zone",
      autoFillTitle: "AI Auto Fill",
      autoFillLoadPdf: "Load PDF",
      autoFillValidate: "Validate Data",
      autoFillFillCrm: "Fill CRM Fields",
      autoFillSaveMapping: "Save Mapping",
      autoFillSettings: "Gemini Settings",
      autoFillSaveSettings: "Save Gemini Settings",
      autoFillApiKey: "API Key",
      autoFillModel: "Model",
      autoFillMode: "Extraction mode",
      autoFillEmpty: "Load a PDF to review fillable fields.",
      autoFillNoPdf: "Choose a PDF file first.",
      autoFillExtracting: "Extracting PDF fields with Gemini...",
      autoFillExtracted: "Extracted {count} fields. Validate before filling.",
      autoFillValidated: "Validated: {ready} ready, {review} need review.",
      autoFillFilled: "Filled {filled}, skipped {skipped}, unmatched {unmatched}.",
      autoFillMappingSaved: "Saved {count} field mappings.",
      autoFillConfigSaved: "Gemini settings saved.",
      autoFillRawResponse: "Gemini Raw Response",
      autoFillRawResponseEmpty: "Gemini raw response appears after extraction.",
      autoFillField: "Field",
      autoFillValue: "Value",
      autoFillConfidence: "Confidence",
      autoFillRisk: "Risk",
      autoFillValidation: "Validation",
      autoFillInclude: "Fill",
      autoFillReady: "Ready",
      autoFillReview: "Review",
      autoFillHigh: "High",
      autoFillMedium: "Medium",
      autoFillLow: "Low",
      autoFillNoFields: "No fillable fields detected.",
      quickLinksTitle: "Quick Links",
      quickLinksNameLabel: "Website name",
      quickLinksUrlLabel: "URL",
      quickLinksNamePlaceholder: "Website name",
      quickLinksUrlPlaceholder: "https://example.com",
      quickLinksAdd: "Add",
      quickLinksUpdate: "Update",
      quickLinksCancel: "Cancel",
      quickLinksOpen: "Open {name}",
      quickLinksEdit: "Edit {name}",
      quickLinksRemove: "Remove {name}",
      quickLinksDefaultBadge: "Default",
      quickLinksCustomBadge: "Custom",
      quickLinksBookmarkFolder: "Chrome bookmarks",
      quickLinksBookmarkSelect: "Choose folder",
      quickLinksImport: "Import",
      quickLinksInvalidUrl: "Enter a valid website URL.",
      quickLinksDuplicate: "That URL already exists.",
      quickLinksSaved: "Added {name}.",
      quickLinksRemoved: "Removed {name}.",
      quickLinksBookmarkUnavailable: "Chrome bookmarks are unavailable.",
      quickLinksImportNone: "This folder has no website links to import.",
      quickLinksImportSuccess: "Imported {count} links.",
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
      pdfLoaded: "PDF preview loaded. Extracting editable text.",
      pdfExtracting: "Extracting editable text from the PDF...",
      pdfExtracted: "PDF text extracted. You can edit it before filling CRM.",
      pdfExtractNoText: "No editable text was extracted from this PDF. If it is scanned, OCR it first and paste the text here.",
      pdfExtractFailed: "PDF text extraction failed: {message}. If it is scanned, OCR it first and paste the text here.",
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
      noExtractableContent: "No recognizable text is available. Upload a text-based PDF, DOCX, or table first; for scanned PDFs, OCR them and paste the text here.",
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
  let autoFillState = {
    extraction: null,
    fields: {},
    validations: {},
    matches: [],
    status: "",
    rawResponsePreview: "",
    parsedResponsePreview: ""
  };
  let currentPreviewUrl = null;
  let lastExpandedSidebarWidth = null;
  let isSidebarCollapsed = false;
  let calculatedSheetUpdateTimer = null;
  let currentLanguage = readStoredLanguage();
  let userQuickLinks = readStoredQuickLinks();
  let removedDefaultQuickLinkKeys = readRemovedDefaultQuickLinkKeys();
  let bookmarkFolders = [];
  let editingQuickLinkId = null;
  let docFlowStorage = null;
  let docFlowView = "dashboard";
  let docFlowOrder = null;
  let docFlowCurrentStep = 1;
  let docFlowOrdersList = [];
  let docFlowFiles = {};
  let docFlowObjectUrls = {};
  let docFlowHydrationToken = 0;
  let docFlowSaveQueue = Promise.resolve();
  let isDocFlowQuickReferenceOpen = readStoredDocFlowQuickReferenceOpen();
  let docFlowQuickRefToastTimer = null;
  let crmHorizontalScrollbarUpdateFrame = 0;
  let crmHorizontalResizeObserver = null;

  class DocFlowMatrixStorage {
    constructor() {
      this.dbPromise = null;
    }

    open() {
      if (this.dbPromise) {
        return this.dbPromise;
      }

      if (!window.indexedDB) {
        this.dbPromise = Promise.reject(new Error("IndexedDB is unavailable"));
        return this.dbPromise;
      }

      this.dbPromise = new Promise((resolve, reject) => {
        const request = window.indexedDB.open(DOC_FLOW_DB_NAME, DOC_FLOW_DB_VERSION);

        request.onupgradeneeded = () => {
          const db = request.result;

          if (!db.objectStoreNames.contains(DOC_FLOW_ORDER_STORE)) {
            const orderStore = db.createObjectStore(DOC_FLOW_ORDER_STORE, { keyPath: "scNo" });
            orderStore.createIndex("archived", "archived", { unique: false });
            orderStore.createIndex("currentStep", "currentStep", { unique: false });
            orderStore.createIndex("updatedAt", "updatedAt", { unique: false });
          }

          if (!db.objectStoreNames.contains(DOC_FLOW_FILE_STORE)) {
            db.createObjectStore(DOC_FLOW_FILE_STORE, { keyPath: "scNo" });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("Failed to open DocFlowMatrixDB"));
      });

      return this.dbPromise;
    }

    async listOrders(options = {}) {
      const includeArchived = options.includeArchived === true;
      const db = await this.open();
      const orders = await this.requestToPromise(db.transaction(DOC_FLOW_ORDER_STORE, "readonly").objectStore(DOC_FLOW_ORDER_STORE).getAll());

      return orders
        .filter((order) => includeArchived || !order.archived)
        .map((order) => ({
          scNo: order.scNo,
          customerName: order.customerName || "",
          destinationPort: order.destinationPort || "",
          etd: order.etd || "",
          currentStep: Number(order.currentStep) || 1,
          archived: order.archived === true,
          updatedAt: order.updatedAt || order.createdAt || ""
        }))
        .sort((first, second) => String(second.updatedAt).localeCompare(String(first.updatedAt)));
    }

    async getOrder(scNo) {
      const db = await this.open();
      return this.requestToPromise(db.transaction(DOC_FLOW_ORDER_STORE, "readonly").objectStore(DOC_FLOW_ORDER_STORE).get(scNo));
    }

    async saveOrder(order) {
      const db = await this.open();
      const normalizedOrder = normalizeDocFlowOrder(order);
      return this.requestToPromise(db.transaction(DOC_FLOW_ORDER_STORE, "readwrite").objectStore(DOC_FLOW_ORDER_STORE).put(normalizedOrder));
    }

    async createOrder(scNo) {
      const normalizedScNo = sanitizeDocFlowScNo(scNo);
      const existingOrder = await this.getOrder(normalizedScNo);
      if (existingOrder) {
        return normalizeDocFlowOrder(existingOrder);
      }

      const order = createBlankDocFlowOrder(normalizedScNo);
      await this.saveOrder(order);
      return order;
    }

    async archiveOrder(scNo) {
      const order = await this.getOrder(scNo);
      if (!order) {
        return null;
      }

      const archivedOrder = normalizeDocFlowOrder({
        ...order,
        archived: true,
        updatedAt: new Date().toISOString()
      });
      await this.saveOrder(archivedOrder);
      return archivedOrder;
    }

    async deleteOrder(scNo) {
      const db = await this.open();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([DOC_FLOW_ORDER_STORE, DOC_FLOW_FILE_STORE], "readwrite");
        transaction.objectStore(DOC_FLOW_ORDER_STORE).delete(scNo);
        transaction.objectStore(DOC_FLOW_FILE_STORE).delete(scNo);
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error || new Error("Failed to delete Doc Flow order"));
        transaction.onabort = () => reject(transaction.error || new Error("Doc Flow delete aborted"));
      });
    }

    async getFiles(scNo) {
      const db = await this.open();
      return this.requestToPromise(db.transaction(DOC_FLOW_FILE_STORE, "readonly").objectStore(DOC_FLOW_FILE_STORE).get(scNo));
    }

    async saveFile(scNo, slot, file) {
      const db = await this.open();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction(DOC_FLOW_FILE_STORE, "readwrite");
        const store = transaction.objectStore(DOC_FLOW_FILE_STORE);
        const getRequest = store.get(scNo);
        let nextRecord = null;

        getRequest.onsuccess = () => {
          nextRecord = getRequest.result || { scNo };
          nextRecord[slot] = {
            blob: file,
            name: file.name || slot,
            type: file.type || "application/octet-stream",
            size: Number(file.size) || 0,
            updatedAt: new Date().toISOString()
          };
          store.put(nextRecord);
        };

        getRequest.onerror = () => reject(getRequest.error || new Error("Failed to read file slot"));
        transaction.oncomplete = () => resolve(nextRecord);
        transaction.onerror = () => reject(transaction.error || new Error("Failed to save file slot"));
        transaction.onabort = () => reject(transaction.error || new Error("File save aborted"));
      });
    }

    requestToPromise(request) {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error("IndexedDB request failed"));
      });
    }
  }

  docFlowStorage = new DocFlowMatrixStorage();

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
  createCrmHorizontalScrollbar();
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
        z-index: 1 !important;
        scrollbar-gutter: stable both-edges !important;
        scrollbar-color: #64748b #e2e8f0 !important;
        scrollbar-width: auto !important;
      }

      html.crm-workbench-active #${LEFT_VIEWPORT_ID}::-webkit-scrollbar {
        width: 16px !important;
        height: 16px !important;
      }

      html.crm-workbench-active #${LEFT_VIEWPORT_ID}::-webkit-scrollbar-track {
        background: #e2e8f0 !important;
      }

      html.crm-workbench-active #${LEFT_VIEWPORT_ID}::-webkit-scrollbar-thumb {
        min-width: 72px !important;
        min-height: 48px !important;
        border: 4px solid #e2e8f0 !important;
        border-radius: 999px !important;
        background: #64748b !important;
      }

      html.crm-workbench-active #${LEFT_VIEWPORT_ID}::-webkit-scrollbar-thumb:hover {
        background: #475569 !important;
      }

      html.crm-workbench-active #${CRM_SURFACE_ID} {
        width: 100vw !important;
        max-width: none !important;
        min-width: 100vw !important;
        min-height: 100vh !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} {
        all: initial !important;
        position: fixed !important;
        left: 14px !important;
        right: calc(var(--crm-workbench-sidebar-width, 50vw) + 14px) !important;
        bottom: 14px !important;
        height: 42px !important;
        z-index: 2147483000 !important;
        display: flex !important;
        align-items: center !important;
        gap: 8px !important;
        padding: 6px 8px !important;
        box-sizing: border-box !important;
        border: 1px solid rgba(100, 116, 139, 0.48) !important;
        border-radius: 8px !important;
        background: rgba(255, 255, 255, 0.96) !important;
        box-shadow: 0 10px 24px rgba(15, 23, 42, 0.18) !important;
        opacity: 1 !important;
        transform: translateY(0) !important;
        transition: opacity 120ms ease, transform 120ms ease !important;
        pointer-events: auto !important;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID}.is-hidden {
        opacity: 0 !important;
        transform: translateY(12px) !important;
        pointer-events: none !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} *,
      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} *::before,
      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} *::after {
        box-sizing: border-box !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} .crm-h-scroll__button {
        all: initial !important;
        width: 30px !important;
        height: 28px !important;
        display: grid !important;
        place-items: center !important;
        border: 1px solid #cbd5e1 !important;
        border-radius: 6px !important;
        background: #ffffff !important;
        color: #0f172a !important;
        cursor: pointer !important;
        font-family: inherit !important;
        font-size: 15px !important;
        font-weight: 850 !important;
        line-height: 1 !important;
        user-select: none !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} .crm-h-scroll__button:hover,
      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} .crm-h-scroll__button:focus {
        border-color: #0f766e !important;
        background: #ecfdf5 !important;
        color: #0f3f3a !important;
        outline: none !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} .crm-h-scroll__button:disabled {
        cursor: default !important;
        opacity: 0.38 !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} .crm-h-scroll__track {
        position: relative !important;
        flex: 1 1 auto !important;
        min-width: 120px !important;
        height: 12px !important;
        border-radius: 999px !important;
        background: #e2e8f0 !important;
        cursor: pointer !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} .crm-h-scroll__thumb {
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        min-width: 72px !important;
        height: 12px !important;
        border-radius: 999px !important;
        background: #64748b !important;
        cursor: grab !important;
        outline: none !important;
        touch-action: none !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} .crm-h-scroll__thumb:hover,
      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} .crm-h-scroll__thumb:focus {
        background: #475569 !important;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.16) !important;
      }

      html.crm-workbench-active #${CRM_HORIZONTAL_SCROLLBAR_ID} .crm-h-scroll__thumb.is-dragging {
        cursor: grabbing !important;
        background: #334155 !important;
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

  function createCrmHorizontalScrollbar() {
    const leftViewport = document.getElementById(LEFT_VIEWPORT_ID);
    if (!leftViewport || document.getElementById(CRM_HORIZONTAL_SCROLLBAR_ID)) {
      return;
    }

    const scrollbar = document.createElement("div");
    scrollbar.id = CRM_HORIZONTAL_SCROLLBAR_ID;
    scrollbar.className = "is-hidden";
    scrollbar.setAttribute("role", "group");
    scrollbar.innerHTML = `
      <button class="crm-h-scroll__button" type="button" data-crm-horizontal-scroll-action="start">&laquo;</button>
      <button class="crm-h-scroll__button" type="button" data-crm-horizontal-scroll-action="left">&lt;</button>
      <div class="crm-h-scroll__track" data-crm-horizontal-scroll-track>
        <div class="crm-h-scroll__thumb" role="scrollbar" aria-orientation="horizontal" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0" data-crm-horizontal-scroll-thumb></div>
      </div>
      <button class="crm-h-scroll__button" type="button" data-crm-horizontal-scroll-action="right">&gt;</button>
      <button class="crm-h-scroll__button" type="button" data-crm-horizontal-scroll-action="end">&raquo;</button>
    `;

    document.documentElement.appendChild(scrollbar);
    updateCrmHorizontalScrollbarLabels();
    bindCrmHorizontalScrollbar(scrollbar, leftViewport);
    scheduleCrmHorizontalScrollbarUpdate();
  }

  function bindCrmHorizontalScrollbar(scrollbar, leftViewport) {
    const track = scrollbar.querySelector("[data-crm-horizontal-scroll-track]");
    const thumb = scrollbar.querySelector("[data-crm-horizontal-scroll-thumb]");
    if (!track || !thumb) {
      return;
    }

    leftViewport.addEventListener("scroll", scheduleCrmHorizontalScrollbarUpdate);
    window.addEventListener("resize", scheduleCrmHorizontalScrollbarUpdate);

    scrollbar.addEventListener("click", (event) => {
      const button = event.target instanceof Element ? event.target.closest("[data-crm-horizontal-scroll-action]") : null;
      if (!button) {
        return;
      }

      event.preventDefault();
      handleCrmHorizontalScrollAction(button.dataset.crmHorizontalScrollAction);
    });

    scrollbar.addEventListener("wheel", (event) => {
      const maxScrollLeft = getCrmHorizontalScrollMax();
      if (maxScrollLeft <= 0) {
        return;
      }

      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      if (!delta) {
        return;
      }

      event.preventDefault();
      leftViewport.scrollLeft = Math.min(Math.max(0, leftViewport.scrollLeft + delta), maxScrollLeft);
    }, { passive: false });

    track.addEventListener("click", (event) => {
      if (event.target === thumb) {
        return;
      }

      const maxScrollLeft = getCrmHorizontalScrollMax();
      if (maxScrollLeft <= 0) {
        return;
      }

      const trackRect = track.getBoundingClientRect();
      const thumbWidth = thumb.getBoundingClientRect().width;
      const usableWidth = Math.max(1, trackRect.width - thumbWidth);
      const targetLeft = Math.min(Math.max(0, event.clientX - trackRect.left - (thumbWidth / 2)), usableWidth);
      leftViewport.scrollLeft = (targetLeft / usableWidth) * maxScrollLeft;
    });

    thumb.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const maxScrollLeft = getCrmHorizontalScrollMax();
      if (maxScrollLeft <= 0) {
        return;
      }

      const startX = event.clientX;
      const startScrollLeft = leftViewport.scrollLeft;
      const trackWidth = track.getBoundingClientRect().width;
      const thumbWidth = thumb.getBoundingClientRect().width;
      const usableWidth = Math.max(1, trackWidth - thumbWidth);
      thumb.classList.add("is-dragging");
      thumb.setPointerCapture(event.pointerId);

      const handlePointerMove = (moveEvent) => {
        const deltaX = moveEvent.clientX - startX;
        leftViewport.scrollLeft = startScrollLeft + ((deltaX / usableWidth) * maxScrollLeft);
      };

      const stopDragging = () => {
        thumb.classList.remove("is-dragging");
        thumb.removeEventListener("pointermove", handlePointerMove);
        thumb.removeEventListener("pointerup", stopDragging);
        thumb.removeEventListener("pointercancel", stopDragging);
      };

      thumb.addEventListener("pointermove", handlePointerMove);
      thumb.addEventListener("pointerup", stopDragging);
      thumb.addEventListener("pointercancel", stopDragging);
    });

    thumb.addEventListener("keydown", handleCrmHorizontalThumbKeydown);

    if (typeof ResizeObserver === "function") {
      const crmSurface = document.getElementById(CRM_SURFACE_ID);
      crmHorizontalResizeObserver = new ResizeObserver(scheduleCrmHorizontalScrollbarUpdate);
      crmHorizontalResizeObserver.observe(leftViewport);
      if (crmSurface) {
        crmHorizontalResizeObserver.observe(crmSurface);
      }
    }
  }

  function handleCrmHorizontalScrollAction(action) {
    const leftViewport = document.getElementById(LEFT_VIEWPORT_ID);
    const maxScrollLeft = getCrmHorizontalScrollMax();
    if (!leftViewport || maxScrollLeft <= 0) {
      return;
    }

    if (action === "start") {
      scrollCrmHorizontalTo(0);
      return;
    }

    if (action === "end") {
      scrollCrmHorizontalTo(maxScrollLeft);
      return;
    }

    const step = Math.max(120, Math.round(leftViewport.clientWidth * 0.8));
    const direction = action === "left" ? -1 : 1;
    scrollCrmHorizontalTo(leftViewport.scrollLeft + (direction * step));
  }

  function handleCrmHorizontalThumbKeydown(event) {
    const leftViewport = document.getElementById(LEFT_VIEWPORT_ID);
    const maxScrollLeft = getCrmHorizontalScrollMax();
    if (!leftViewport || maxScrollLeft <= 0) {
      return;
    }

    const smallStep = 80;
    const pageStep = Math.max(120, Math.round(leftViewport.clientWidth * 0.8));
    const keyActions = {
      ArrowLeft: () => scrollCrmHorizontalTo(leftViewport.scrollLeft - smallStep),
      ArrowRight: () => scrollCrmHorizontalTo(leftViewport.scrollLeft + smallStep),
      PageUp: () => scrollCrmHorizontalTo(leftViewport.scrollLeft - pageStep),
      PageDown: () => scrollCrmHorizontalTo(leftViewport.scrollLeft + pageStep),
      Home: () => scrollCrmHorizontalTo(0),
      End: () => scrollCrmHorizontalTo(maxScrollLeft)
    };

    const action = keyActions[event.key];
    if (!action) {
      return;
    }

    event.preventDefault();
    action();
  }

  function scrollCrmHorizontalTo(scrollLeft) {
    const leftViewport = document.getElementById(LEFT_VIEWPORT_ID);
    const maxScrollLeft = getCrmHorizontalScrollMax();
    if (!leftViewport) {
      return;
    }

    const nextScrollLeft = Math.min(Math.max(0, scrollLeft), maxScrollLeft);
    leftViewport.scrollTo({
      left: nextScrollLeft,
      behavior: "smooth"
    });
  }

  function scheduleCrmHorizontalScrollbarUpdate() {
    if (crmHorizontalScrollbarUpdateFrame) {
      return;
    }

    crmHorizontalScrollbarUpdateFrame = window.requestAnimationFrame(() => {
      crmHorizontalScrollbarUpdateFrame = 0;
      updateCrmHorizontalScrollbar();
    });
  }

  function updateCrmHorizontalScrollbar() {
    const leftViewport = document.getElementById(LEFT_VIEWPORT_ID);
    const scrollbar = document.getElementById(CRM_HORIZONTAL_SCROLLBAR_ID);
    const track = scrollbar?.querySelector("[data-crm-horizontal-scroll-track]");
    const thumb = scrollbar?.querySelector("[data-crm-horizontal-scroll-thumb]");
    if (!leftViewport || !scrollbar || !track || !thumb) {
      return;
    }

    const maxScrollLeft = getCrmHorizontalScrollMax();
    const hasHorizontalOverflow = maxScrollLeft > 4;
    scrollbar.classList.toggle("is-hidden", !hasHorizontalOverflow);
    scrollbar.setAttribute("aria-hidden", hasHorizontalOverflow ? "false" : "true");

    if (!hasHorizontalOverflow) {
      return;
    }

    if (leftViewport.scrollLeft > maxScrollLeft) {
      leftViewport.scrollLeft = maxScrollLeft;
    }

    const trackWidth = track.clientWidth;
    const visibleRatio = leftViewport.scrollWidth > 0 ? Math.min(1, leftViewport.clientWidth / leftViewport.scrollWidth) : 1;
    const thumbWidth = Math.max(72, Math.round(trackWidth * visibleRatio));
    const usableWidth = Math.max(0, trackWidth - thumbWidth);
    const scrollRatio = maxScrollLeft > 0 ? leftViewport.scrollLeft / maxScrollLeft : 0;
    const thumbLeft = Math.round(scrollRatio * usableWidth);

    thumb.style.width = `${thumbWidth}px`;
    thumb.style.transform = `translateX(${thumbLeft}px)`;
    thumb.setAttribute("aria-valuenow", String(Math.round(scrollRatio * 100)));

    scrollbar.querySelectorAll("[data-crm-horizontal-scroll-action]").forEach((button) => {
      const action = button.dataset.crmHorizontalScrollAction;
      const atStart = leftViewport.scrollLeft <= 1;
      const atEnd = leftViewport.scrollLeft >= maxScrollLeft - 1;
      button.disabled = (action === "start" || action === "left") ? atStart : atEnd;
    });
  }

  function updateCrmHorizontalScrollbarLabels() {
    const scrollbar = document.getElementById(CRM_HORIZONTAL_SCROLLBAR_ID);
    if (!scrollbar) {
      return;
    }

    scrollbar.setAttribute("aria-label", t("crmHorizontalScrollLabel"));

    const actionLabels = {
      start: "crmHorizontalScrollStart",
      left: "crmHorizontalScrollLeft",
      right: "crmHorizontalScrollRight",
      end: "crmHorizontalScrollEnd"
    };

    scrollbar.querySelectorAll("[data-crm-horizontal-scroll-action]").forEach((button) => {
      const labelKey = actionLabels[button.dataset.crmHorizontalScrollAction];
      if (!labelKey) {
        return;
      }

      button.setAttribute("aria-label", t(labelKey));
      button.setAttribute("title", t(labelKey));
    });

    const thumb = scrollbar.querySelector("[data-crm-horizontal-scroll-thumb]");
    if (thumb) {
      thumb.setAttribute("aria-label", t("crmHorizontalScrollThumb"));
      thumb.setAttribute("title", t("crmHorizontalScrollThumb"));
    }
  }

  function getCrmHorizontalScrollMax() {
    const leftViewport = document.getElementById(LEFT_VIEWPORT_ID);
    if (!leftViewport) {
      return 0;
    }

    return Math.max(0, leftViewport.scrollWidth - leftViewport.clientWidth);
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
      .workbench.is-collapsed .quick-links,
      .workbench.is-collapsed .doc-flow,
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

      .quick-links {
        flex: 0 0 auto;
        margin: 0 16px 12px;
        background: #ffffff;
        border: 1px solid #dbe3ef;
        border-radius: 8px;
        overflow: hidden;
      }

      .quick-links__summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        padding: 12px;
        color: #0f172a;
        cursor: pointer;
        list-style: none;
      }

      .quick-links__summary::-webkit-details-marker {
        display: none;
      }

      .quick-links__summary::after {
        content: "⌄";
        flex: 0 0 auto;
        color: #64748b;
        font-size: 18px;
        line-height: 1;
        transform: rotate(-90deg);
        transition: transform 120ms ease;
      }

      .quick-links[open] .quick-links__summary::after {
        transform: rotate(0deg);
      }

      .quick-links__title {
        margin: 0;
        color: #0f172a;
        font-size: 14px;
        font-weight: 850;
        line-height: 1.3;
      }

      .quick-links__body {
        padding: 0 12px 12px;
        border-top: 1px solid #e2e8f0;
      }

      .quick-links__list {
        display: grid;
        gap: 7px;
        padding-top: 10px;
      }

      .quick-link-row {
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr) auto auto auto;
        gap: 8px;
        align-items: center;
        min-height: 40px;
        padding: 6px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: #f8fafc;
      }

      .quick-link-row__avatar {
        width: 30px;
        height: 30px;
        display: inline-grid;
        place-items: center;
        border-radius: 6px;
        background: #e0f2fe;
        color: #075985;
        font-size: 12px;
        font-weight: 900;
        line-height: 1;
      }

      .quick-link-row__main {
        min-width: 0;
        display: grid;
        gap: 2px;
      }

      .quick-link-row__title {
        min-width: 0;
        overflow: hidden;
        color: #0f172a;
        font: inherit;
        font-size: 13px;
        font-weight: 800;
        line-height: 1.25;
        text-decoration: none;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .quick-link-row__title:hover {
        color: #0f766e;
        text-decoration: underline;
      }

      .quick-link-row__meta {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 6px;
        overflow: hidden;
        color: #64748b;
        font-size: 11px;
        font-weight: 700;
        line-height: 1.25;
      }

      .quick-link-row__host {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .quick-link-row__badge {
        flex: 0 0 auto;
        padding: 1px 5px;
        border-radius: 999px;
        background: #e2e8f0;
        color: #475569;
        font-size: 10px;
        font-weight: 850;
      }

      .quick-link-row__button {
        width: 30px;
        height: 30px;
        display: inline-grid;
        place-items: center;
        padding: 0;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
        font: inherit;
        font-size: 15px;
        font-weight: 850;
        line-height: 1;
      }

      .quick-link-row__button:hover {
        border-color: #0f766e;
        background: #ecfdf5;
        color: #0f3f3a;
      }

      .quick-link-row__button--remove:hover {
        border-color: #fecaca;
        background: #fee2e2;
        color: #b91c1c;
      }

      .quick-links__form {
        display: grid;
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr) auto auto;
        gap: 8px;
        margin-top: 10px;
      }

      .quick-links__input,
      .quick-links__select {
        min-width: 0;
        height: 34px;
        padding: 0 9px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        font: inherit;
        font-size: 12px;
        font-weight: 650;
      }

      .quick-links__input:focus,
      .quick-links__select:focus {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
        outline: none;
      }

      .quick-links__button {
        min-height: 34px;
        padding: 0 12px;
        border: 0;
        border-radius: 6px;
        background: #0f766e;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 850;
        line-height: 1.2;
        white-space: nowrap;
      }

      .quick-links__button:hover {
        background: #115e59;
      }

      .quick-links__button:disabled {
        cursor: not-allowed;
        opacity: 0.62;
      }

      .quick-links__button--secondary {
        display: none;
        border: 1px solid #cbd5e1;
        background: #ffffff;
        color: #0f172a;
      }

      .quick-links__button--secondary:hover {
        border-color: #94a3b8;
        background: #f1f5f9;
      }

      .quick-links__form.is-editing .quick-links__button--secondary {
        display: inline-block;
      }

      .quick-links-bookmarks {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 8px;
        align-items: center;
        margin-top: 8px;
      }

      .quick-links-bookmarks[hidden] {
        display: none;
      }

      .quick-links__status {
        min-height: 17px;
        margin: 8px 0 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.4;
      }

      .quick-links__status.is-error {
        color: #b91c1c;
      }

      .quick-links__status.is-success {
        color: #166534;
      }

      .doc-flow {
        container-type: inline-size;
        flex: 0 0 auto;
        margin: 0 16px 12px;
        background: #ffffff;
        border: 1px solid #dbe3ef;
        border-radius: 8px;
        overflow: hidden;
      }

      .doc-flow__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 12px;
        padding: 12px 14px;
        border-bottom: 1px solid #e2e8f0;
        background: #f8fafc;
      }

      .doc-flow__title {
        margin: 0;
        color: #0f172a;
        font-size: 15px;
        font-weight: 900;
        line-height: 1.3;
      }

      .doc-flow__subtitle {
        margin: 4px 0 0;
        color: #64748b;
        font-size: 12px;
        font-weight: 650;
        line-height: 1.4;
      }

      .doc-flow__body {
        padding: 12px 14px 14px;
      }

      .doc-flow__toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-bottom: 10px;
      }

      .doc-flow__heading {
        margin: 0;
        color: #0f172a;
        font-size: 14px;
        font-weight: 850;
        line-height: 1.35;
      }

      .doc-flow__button {
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0 12px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 850;
        line-height: 1.2;
        white-space: nowrap;
      }

      .doc-flow__button:hover {
        border-color: #0f766e;
        background: #ecfdf5;
        color: #0f3f3a;
      }

      .doc-flow__button--primary {
        border-color: #0f766e;
        background: #0f766e;
        color: #ffffff;
      }

      .doc-flow__button--primary:hover {
        background: #115e59;
        color: #ffffff;
      }

      .doc-flow__button--danger {
        border-color: #b91c1c;
        background: #b91c1c;
        color: #ffffff;
      }

      .doc-flow__button--danger:hover {
        background: #991b1b;
        color: #ffffff;
      }

      .doc-flow__button:disabled {
        cursor: not-allowed;
        opacity: 0.54;
      }

      .doc-flow-actions {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .doc-flow-actions .doc-flow__button {
        min-height: 32px;
        padding: 0 10px;
      }

      .doc-flow-table-wrap {
        overflow-x: auto;
        border: 1px solid #dbe3ef;
        border-radius: 8px;
      }

      .doc-flow-table {
        width: 100%;
        min-width: 620px;
        border-collapse: collapse;
        font-size: 12px;
      }

      .doc-flow-table th,
      .doc-flow-table td {
        padding: 9px 10px;
        border-bottom: 1px solid #e2e8f0;
        color: #0f172a;
        text-align: left;
        vertical-align: middle;
        word-break: break-word;
      }

      .doc-flow-table th {
        background: #f8fafc;
        color: #475569;
        font-weight: 850;
      }

      .doc-flow-table tr:last-child td {
        border-bottom: 0;
      }

      .doc-flow-table__empty {
        min-height: 96px;
        display: grid;
        place-items: center;
        padding: 22px;
        color: #64748b;
        font-size: 13px;
        line-height: 1.45;
        text-align: center;
      }

      @container (max-width: 620px) {
        .doc-flow-table-wrap {
          overflow-x: visible;
          border: 0;
          border-radius: 0;
        }

        .doc-flow-table,
        .doc-flow-table tbody,
        .doc-flow-table tr,
        .doc-flow-table td {
          display: block;
          width: 100%;
        }

        .doc-flow-table {
          min-width: 0;
          border-collapse: separate;
        }

        .doc-flow-table thead {
          display: none;
        }

        .doc-flow-table tbody {
          display: grid;
          gap: 10px;
        }

        .doc-flow-table tr {
          display: grid;
          gap: 7px;
          padding: 10px;
          border: 1px solid #dbe3ef;
          border-radius: 8px;
          background: #ffffff;
        }

        .doc-flow-table td {
          display: grid;
          grid-template-columns: 112px minmax(0, 1fr);
          gap: 10px;
          align-items: start;
          padding: 0;
          border-bottom: 0;
        }

        .doc-flow-table td::before {
          content: attr(data-label);
          min-width: 0;
          color: #64748b;
          font-size: 11px;
          font-weight: 850;
          line-height: 1.25;
        }

        .doc-flow-table .doc-flow-table__actions-cell {
          grid-template-columns: 112px minmax(0, 1fr);
        }

        .doc-flow-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }

        .doc-flow-actions .doc-flow__button {
          width: 100%;
          min-width: 0;
          padding: 0 8px;
        }

        .doc-flow-progress {
          min-width: 0;
          white-space: normal;
        }
      }

      .doc-flow-progress {
        display: inline-flex;
        align-items: center;
        min-height: 24px;
        padding: 2px 8px;
        border-radius: 999px;
        background: #e0f2fe;
        color: #075985;
        font-size: 11px;
        font-weight: 850;
        line-height: 1.2;
        white-space: nowrap;
      }

      .doc-flow-progress.is-archived {
        background: #dcfce7;
        color: #166534;
      }

      .doc-flow-alert {
        margin: 0 0 10px;
        padding: 10px 12px;
        border: 1px solid #fde68a;
        border-radius: 6px;
        background: #fffbeb;
        color: #92400e;
        font-size: 12px;
        font-weight: 750;
        line-height: 1.45;
      }

      .doc-flow-alert--critical {
        position: sticky;
        top: 0;
        z-index: 2;
        border-color: #fecaca;
        background: #fee2e2;
        color: #991b1b;
      }

      .doc-flow-alert[hidden] {
        display: none;
      }

      .doc-flow-nav {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 6px;
        margin-bottom: 12px;
      }

      .doc-flow-step {
        min-width: 0;
        min-height: 48px;
        display: grid;
        align-content: center;
        gap: 3px;
        padding: 7px 8px;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #334155;
        cursor: pointer;
        font: inherit;
        text-align: left;
      }

      .doc-flow-step__number {
        color: #64748b;
        font-size: 10px;
        font-weight: 900;
        line-height: 1;
        text-transform: uppercase;
      }

      .doc-flow-step__title {
        overflow: hidden;
        color: inherit;
        font-size: 11px;
        font-weight: 850;
        line-height: 1.25;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .doc-flow-step.is-current {
        border-color: #0f766e;
        background: #ecfdf5;
        color: #0f3f3a;
      }

      .doc-flow-step.is-complete {
        border-color: #99f6e4;
        background: #f0fdfa;
      }

      .doc-flow-step:disabled {
        cursor: not-allowed;
        opacity: 0.5;
      }

      .doc-flow-page {
        display: grid;
        gap: 12px;
      }

      .doc-flow-section {
        display: grid;
        gap: 10px;
        padding: 12px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .doc-flow-section[disabled] {
        opacity: 0.58;
      }

      .doc-flow-section__title {
        margin: 0;
        color: #0f172a;
        font-size: 13px;
        font-weight: 900;
        line-height: 1.35;
      }

      .doc-flow-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .doc-flow-field {
        min-width: 0;
        display: grid;
        gap: 5px;
      }

      .doc-flow-field span,
      .doc-flow-field label {
        color: #475569;
        font-size: 12px;
        font-weight: 760;
        line-height: 1.3;
      }

      .doc-flow-field input,
      .doc-flow-field select,
      .doc-flow-field textarea {
        width: 100%;
        min-width: 0;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        font: inherit;
        font-size: 13px;
        line-height: 1.35;
      }

      .doc-flow-field input,
      .doc-flow-field select {
        height: 36px;
        padding: 0 9px;
      }

      .doc-flow-field textarea {
        min-height: 86px;
        padding: 9px;
        resize: vertical;
      }

      .doc-flow-field input:focus,
      .doc-flow-field select:focus,
      .doc-flow-field textarea:focus {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
        outline: none;
      }

      .doc-flow-checklist {
        display: grid;
        gap: 8px;
      }

      .doc-flow-check,
      .doc-flow-radio {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        min-width: 0;
        color: #0f172a;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.35;
      }

      .doc-flow-check input,
      .doc-flow-radio input {
        width: 16px;
        height: 16px;
        flex: 0 0 auto;
        margin: 1px 0 0;
        accent-color: #0f766e;
      }

      .doc-flow-reveal[hidden] {
        display: none;
      }

      .doc-flow-file {
        display: grid;
        gap: 8px;
      }

      .doc-flow-file__preview {
        display: grid;
        grid-template-columns: 84px minmax(0, 1fr);
        gap: 10px;
        align-items: center;
        min-height: 72px;
        padding: 8px;
        border: 1px solid #dbe3ef;
        border-radius: 6px;
        background: #f8fafc;
      }

      .doc-flow-file__preview img {
        width: 84px;
        height: 64px;
        border-radius: 6px;
        object-fit: cover;
        background: #e2e8f0;
      }

      .doc-flow-file__meta {
        min-width: 0;
        color: #475569;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.4;
      }

      .doc-flow-footer {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        margin-top: 12px;
      }

      .doc-flow-status {
        min-height: 18px;
        margin: 8px 0 0;
        color: #64748b;
        font-size: 12px;
        line-height: 1.4;
      }

      .doc-flow-status.is-error {
        color: #b91c1c;
      }

      .doc-flow-status.is-success {
        color: #166534;
      }

      .doc-flow-modal {
        position: fixed;
        inset: 0;
        z-index: 10;
        display: grid;
        place-items: center;
        padding: 18px;
        background: rgba(15, 23, 42, 0.38);
      }

      .doc-flow-modal[hidden] {
        display: none;
      }

      .doc-flow-modal__panel {
        width: min(420px, 100%);
        padding: 16px;
        border-radius: 8px;
        background: #ffffff;
        box-shadow: 0 20px 50px rgba(15, 23, 42, 0.24);
      }

      .doc-flow-modal__title {
        margin: 0 0 10px;
        color: #0f172a;
        font-size: 15px;
        font-weight: 900;
        line-height: 1.35;
      }

      .doc-flow-modal__text {
        margin: 0 0 12px;
        color: #475569;
        font-size: 13px;
        font-weight: 700;
        line-height: 1.5;
      }

      .doc-flow-modal__actions {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
        margin-top: 12px;
      }

      .doc-flow-quick-ref {
        position: fixed;
        top: 88px;
        right: 0;
        bottom: 18px;
        z-index: 8;
        width: min(380px, calc(100vw - 68px));
        padding-left: 38px;
        transform: translateX(calc(100% - 38px));
        transition: transform 180ms ease;
        pointer-events: none;
      }

      .doc-flow-quick-ref.is-open {
        transform: translateX(0);
      }

      .doc-flow-quick-ref__tab {
        position: absolute;
        right: auto;
        bottom: 24px;
        left: 0;
        width: 38px;
        min-height: 122px;
        display: inline-grid;
        place-items: center;
        padding: 8px 5px;
        border: 1px solid #0f766e;
        border-right: 0;
        border-radius: 8px 0 0 8px;
        background: #0f766e;
        color: #ffffff;
        cursor: pointer;
        font: inherit;
        font-size: 12px;
        font-weight: 900;
        line-height: 1.15;
        writing-mode: vertical-rl;
        text-orientation: mixed;
        pointer-events: auto;
      }

      .doc-flow-quick-ref__tab:hover,
      .doc-flow-quick-ref__tab:focus {
        background: #115e59;
        outline: none;
      }

      .doc-flow-quick-ref__panel {
        height: 100%;
        display: flex;
        flex-direction: column;
        border: 1px solid #0f766e;
        border-right: 0;
        border-radius: 8px 0 0 8px;
        background: #ffffff;
        box-shadow: -16px 0 30px rgba(15, 23, 42, 0.18);
        overflow: hidden;
        pointer-events: auto;
      }

      .doc-flow-quick-ref__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        padding: 10px 12px;
        border-bottom: 1px solid #dbe3ef;
        background: #f8fafc;
      }

      .doc-flow-quick-ref__title {
        margin: 0;
        color: #0f172a;
        font-size: 14px;
        font-weight: 900;
        line-height: 1.25;
      }

      .doc-flow-quick-ref__close {
        width: 28px;
        height: 28px;
        display: inline-grid;
        place-items: center;
        padding: 0;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
        font: inherit;
        font-size: 16px;
        font-weight: 900;
        line-height: 1;
      }

      .doc-flow-quick-ref__close:hover {
        border-color: #0f766e;
        background: #ecfdf5;
        color: #0f3f3a;
      }

      .doc-flow-quick-ref__body {
        flex: 1 1 auto;
        min-height: 0;
        display: grid;
        align-content: start;
        gap: 10px;
        padding: 10px;
        overflow-y: auto;
      }

      .doc-flow-quick-ref__empty {
        margin: 0;
        padding: 12px;
        border: 1px dashed #cbd5e1;
        border-radius: 8px;
        color: #64748b;
        font-size: 12px;
        font-weight: 700;
        line-height: 1.45;
      }

      .doc-flow-quick-ref__critical {
        padding: 10px;
        border: 1px solid #f59e0b;
        border-radius: 8px;
        background: #fef3c7;
        color: #78350f;
        font-size: 13px;
        font-weight: 900;
        line-height: 1.45;
      }

      .doc-flow-quick-ref__critical-label {
        display: block;
        margin-bottom: 4px;
        color: #92400e;
        font-size: 11px;
        font-weight: 950;
        line-height: 1.2;
      }

      .doc-flow-quick-ref__group {
        display: grid;
        gap: 6px;
        padding: 9px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background: #ffffff;
      }

      .doc-flow-quick-ref__group-title {
        margin: 0;
        color: #0f172a;
        font-size: 12px;
        font-weight: 950;
        line-height: 1.25;
      }

      .doc-flow-quick-ref__item {
        display: grid;
        grid-template-columns: minmax(92px, 0.42fr) minmax(0, 1fr) auto;
        gap: 7px;
        align-items: center;
        min-height: 30px;
        padding: 5px 6px;
        border-radius: 6px;
        background: #f8fafc;
      }

      .doc-flow-quick-ref__item.is-warning {
        background: #fef08a;
        color: #713f12;
      }

      .doc-flow-quick-ref__item-label {
        color: #64748b;
        font-size: 11px;
        font-weight: 850;
        line-height: 1.25;
      }

      .doc-flow-quick-ref__item-value {
        min-width: 0;
        overflow: hidden;
        color: #0f172a;
        font-size: 12px;
        font-weight: 850;
        line-height: 1.3;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .doc-flow-quick-ref__item-value.is-muted {
        color: #94a3b8;
        font-weight: 750;
      }

      .doc-flow-quick-ref__item-value.is-danger {
        color: #b91c1c;
        font-weight: 950;
      }

      .doc-flow-quick-ref__item-value.is-pulsing {
        animation: doc-flow-danger-pulse 1000ms ease-in-out infinite;
      }

      .doc-flow-quick-ref__copy {
        width: 26px;
        height: 26px;
        display: inline-grid;
        place-items: center;
        padding: 0;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        cursor: pointer;
        font: inherit;
        font-size: 13px;
        line-height: 1;
      }

      .doc-flow-quick-ref__copy:hover {
        border-color: #0f766e;
        background: #ecfdf5;
      }

      .doc-flow-quick-ref__copy:disabled {
        cursor: not-allowed;
        opacity: 0.4;
      }

      .doc-flow-quick-ref__snapshot {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 6px;
      }

      .doc-flow-quick-ref__snapshot-cell {
        min-width: 0;
        padding: 7px;
        border-radius: 6px;
        background: #f8fafc;
      }

      .doc-flow-quick-ref__snapshot-label {
        display: block;
        color: #64748b;
        font-size: 10px;
        font-weight: 850;
        line-height: 1.25;
      }

      .doc-flow-quick-ref__snapshot-value {
        display: block;
        margin-top: 3px;
        color: #0f172a;
        font-size: 12px;
        font-weight: 900;
        line-height: 1.35;
      }

      .doc-flow-quick-ref__toast {
        position: absolute;
        right: 12px;
        bottom: 12px;
        padding: 6px 9px;
        border-radius: 999px;
        background: #0f766e;
        color: #ffffff;
        font-size: 12px;
        font-weight: 900;
        line-height: 1.2;
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 120ms ease, transform 120ms ease;
        pointer-events: none;
      }

      .doc-flow-quick-ref__toast.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      @keyframes doc-flow-danger-pulse {
        0%,
        100% {
          color: #b91c1c;
          text-shadow: none;
        }
        50% {
          color: #dc2626;
          text-shadow: 0 0 8px rgba(220, 38, 38, 0.35);
        }
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

      .pdf-preview {
        display: block;
        width: 100%;
        height: 100%;
        border: 0;
        background: #262626;
      }

      .pdf-text-extract {
        min-height: 120px;
        margin: 12px 0;
        padding: 12px 14px;
        border: 1px solid #dbe3ef;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
        font-size: 12px;
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        outline: none;
      }

      .pdf-text-extract:empty::before {
        content: attr(data-placeholder);
        color: #94a3b8;
      }

      .pdf-text-extract:focus {
        border-color: #0f766e;
        box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
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

      .automation-ai {
        border-top: 1px solid #e2e8f0;
        padding: 12px 16px;
        display: grid;
        gap: 10px;
      }

      .automation-ai__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
      }

      .automation-ai__title {
        margin: 0;
        font-size: 16px;
        line-height: 1.25;
        color: #0f172a;
      }

      .automation-ai__summary {
        cursor: pointer;
        font-weight: 700;
        color: #0f172a;
      }

      .automation-ai__body {
        display: grid;
        gap: 10px;
        padding: 12px 0;
      }

      .automation-ai__grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .automation-ai__field {
        display: grid;
        gap: 4px;
        font-size: 12px;
        color: #475569;
      }

      .automation-ai__field input,
      .automation-ai__field select {
        min-width: 0;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        padding: 7px 8px;
        font: inherit;
      }

      .automation-ai__checkbox {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: #334155;
      }

      .automation-ai__buttons {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .automation-ai__button {
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #ffffff;
        color: #0f172a;
        padding: 8px;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }

      .automation-ai__button:hover {
        background: #f8fafc;
      }

      .automation-review,
      .automation-debug {
        overflow: auto;
        max-height: 320px;
        border: 1px solid #e2e8f0;
        border-radius: 6px;
        background: #ffffff;
      }

      .automation-review table {
        width: 100%;
        min-width: 900px;
        border-collapse: collapse;
        font-size: 12px;
      }

      .automation-review th,
      .automation-review td {
        border-bottom: 1px solid #e2e8f0;
        padding: 6px;
        text-align: left;
        vertical-align: top;
      }

      .automation-review input[type="checkbox"] {
        width: 16px;
        height: 16px;
      }

      .automation-review__empty {
        margin: 0;
        padding: 10px;
        color: #64748b;
        font-size: 12px;
      }

      .automation-debug {
        padding: 8px;
        white-space: pre-wrap;
        font-size: 11px;
        color: #334155;
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
          grid-template-columns: repeat(3, minmax(0, 1fr));
          margin: 10px 16px 0;
          box-shadow: none;
        }

        .section-nav__button {
          width: 100%;
        }

        .calculator-grid,
        .calculator-results,
        .calculator-file-tools,
        .quick-links__form,
        .quick-links-bookmarks,
        .doc-flow-grid,
        .doc-flow-nav,
        .doc-flow-footer,
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
        <button class="section-nav__button" type="button" data-section-target="links" data-i18n="navLinks" data-i18n-title="navLinks" title="${t("navLinks")}">${t("navLinks")}</button>
        <button class="section-nav__button" type="button" data-section-target="auto-fill" data-i18n="navAutoFill" data-i18n-title="navAutoFill" title="${t("navAutoFill")}">${t("navAutoFill")}</button>
        <button class="section-nav__button" type="button" data-section-target="doc-flow" data-i18n="navDocFlow" data-i18n-title="navDocFlow" title="${t("navDocFlow")}">${t("navDocFlow")}</button>
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

        <section class="automation-ai" data-section="auto-fill">
          <div class="automation-ai__header">
            <h2 class="automation-ai__title" data-i18n="autoFillTitle">${t("autoFillTitle")}</h2>
            <input class="automation-pdf-input" type="file" accept=".pdf,application/pdf" hidden>
            <button class="automation-ai__button" type="button" data-auto-fill-load-pdf data-i18n="autoFillLoadPdf">${t("autoFillLoadPdf")}</button>
          </div>
          <div class="automation-ai__buttons">
            <button class="automation-ai__button" type="button" data-auto-fill-validate data-i18n="autoFillValidate">${t("autoFillValidate")}</button>
            <button class="automation-ai__button" type="button" data-auto-fill-fill data-i18n="autoFillFillCrm">${t("autoFillFillCrm")}</button>
            <button class="automation-ai__button" type="button" data-auto-fill-save-mapping data-i18n="autoFillSaveMapping">${t("autoFillSaveMapping")}</button>
          </div>
          <p class="status" data-auto-fill-status>${t("autoFillEmpty")}</p>
          <div class="automation-review" data-auto-fill-review></div>
          <details class="automation-debug-panel">
            <summary class="automation-ai__summary" data-i18n="autoFillRawResponse">${t("autoFillRawResponse")}</summary>
            <pre class="automation-debug" data-auto-fill-raw-response>${t("autoFillRawResponseEmpty")}</pre>
          </details>
          <details class="automation-ai__settings">
            <summary class="automation-ai__summary" data-i18n="autoFillSettings">${t("autoFillSettings")}</summary>
            <div class="automation-ai__body">
              <label class="automation-ai__field">
                <span data-i18n="autoFillApiKey">${t("autoFillApiKey")}</span>
                <input type="password" autocomplete="off" data-auto-fill-api-key>
              </label>
              <div class="automation-ai__grid">
                <label class="automation-ai__field">
                  <span data-i18n="autoFillModel">${t("autoFillModel")}</span>
                  <input type="text" value="gemini-2.5-flash" data-auto-fill-model>
                </label>
                <label class="automation-ai__field">
                  <span data-i18n="autoFillMode">${t("autoFillMode")}</span>
                  <select data-auto-fill-mode>
                    <option value="gemini_pdf_direct">gemini_pdf_direct</option>
                  </select>
                </label>
              </div>
              <button class="automation-ai__button" type="button" data-auto-fill-save-config data-i18n="autoFillSaveSettings">${t("autoFillSaveSettings")}</button>
            </div>
          </details>
        </section>

        <details class="quick-links" data-section="links">
          <summary class="quick-links__summary">
            <h2 class="quick-links__title" data-i18n="quickLinksTitle">${t("quickLinksTitle")}</h2>
          </summary>
          <div class="quick-links__body">
            <div class="quick-links__list" aria-live="polite"></div>
            <form class="quick-links__form">
              <input class="quick-links__input" name="name" type="text" autocomplete="off" data-i18n-aria-label="quickLinksNameLabel" data-i18n-placeholder="quickLinksNamePlaceholder" aria-label="${t("quickLinksNameLabel")}" placeholder="${t("quickLinksNamePlaceholder")}">
              <input class="quick-links__input" name="url" type="text" autocomplete="off" inputmode="url" data-i18n-aria-label="quickLinksUrlLabel" data-i18n-placeholder="quickLinksUrlPlaceholder" aria-label="${t("quickLinksUrlLabel")}" placeholder="${t("quickLinksUrlPlaceholder")}">
              <button class="quick-links__button" type="submit" data-i18n="quickLinksAdd">${t("quickLinksAdd")}</button>
              <button class="quick-links__button quick-links__button--secondary" type="button" data-quick-links-cancel-edit data-i18n="quickLinksCancel">${t("quickLinksCancel")}</button>
            </form>
            <div class="quick-links-bookmarks" hidden>
              <select class="quick-links__select" data-quick-links-bookmark-folders data-i18n-aria-label="quickLinksBookmarkFolder" aria-label="${t("quickLinksBookmarkFolder")}">
                <option value="" data-i18n="quickLinksBookmarkSelect">${t("quickLinksBookmarkSelect")}</option>
              </select>
              <button class="quick-links__button" type="button" data-quick-links-import disabled data-i18n="quickLinksImport">${t("quickLinksImport")}</button>
            </div>
            <p class="quick-links__status" role="status"></p>
          </div>
        </details>

        <section class="doc-flow" data-section="doc-flow">
          <div class="doc-flow__header">
            <div>
              <h2 class="doc-flow__title">${df("moduleTitle")}</h2>
              <p class="doc-flow__subtitle">${df("moduleSubtitle")}</p>
            </div>
          </div>
          <div class="doc-flow__body" data-doc-flow-root>
            <p class="doc-flow-status">${df("dashboardLoading")}</p>
          </div>
          <aside class="doc-flow-quick-ref${isDocFlowQuickReferenceOpen ? " is-open" : ""}" data-doc-flow-quick-ref aria-label="${df("quickRefTitle")}">
            <button class="doc-flow-quick-ref__tab" type="button" data-doc-flow-quick-ref-toggle aria-expanded="${isDocFlowQuickReferenceOpen ? "true" : "false"}">${df("quickRefTab")}</button>
            <div class="doc-flow-quick-ref__panel">
              <div class="doc-flow-quick-ref__header">
                <h3 class="doc-flow-quick-ref__title">${df("quickRefTitle")}</h3>
                <button class="doc-flow-quick-ref__close" type="button" data-doc-flow-quick-ref-toggle aria-label="${df("quickRefClose")}">×</button>
              </div>
              <div class="doc-flow-quick-ref__body" data-doc-flow-quick-ref-body>
                <p class="doc-flow-quick-ref__empty">${df("quickRefEmpty")}</p>
              </div>
              <div class="doc-flow-quick-ref__toast" data-doc-flow-quick-ref-toast role="status"></div>
            </div>
          </aside>
          <div class="doc-flow-modal" data-doc-flow-modal hidden></div>
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

        <details class="price-calculator" data-section="financial">
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
    const quickLinksList = shadowRoot.querySelector(".quick-links__list");
    const quickLinksForm = shadowRoot.querySelector(".quick-links__form");
    const bookmarkFolderSelect = shadowRoot.querySelector("[data-quick-links-bookmark-folders]");
    const bookmarkImportButton = shadowRoot.querySelector("[data-quick-links-import]");
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
    const docFlowSection = shadowRoot.querySelector(".doc-flow");
    const autoFillSection = shadowRoot.querySelector("[data-section='auto-fill']");

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
    quickLinksList.addEventListener("click", handleQuickLinksClick);
    quickLinksForm.addEventListener("submit", handleQuickLinkSubmit);
    quickLinksForm.querySelector("[data-quick-links-cancel-edit]").addEventListener("click", resetQuickLinkForm);
    bookmarkFolderSelect.addEventListener("change", () => {
      bookmarkImportButton.disabled = !bookmarkFolderSelect.value;
    });
    bookmarkImportButton.addEventListener("click", handleBookmarkImportClick);
    editor.addEventListener("input", handleCalculatedSheetInput);
    saveButton.addEventListener("click", handleSaveEditedCopy);
    fillButton.addEventListener("click", handleExtractFillClick);
    syncButton.addEventListener("click", handleSyncClick);
    calculator.addEventListener("input", handleCalculatorInput);
    sectionNav.addEventListener("click", handleSectionNavClick);
    autoFillSection.addEventListener("click", handleAutoFillClick);
    autoFillSection.addEventListener("change", handleAutoFillChange);
    docFlowSection.addEventListener("click", handleDocFlowClick);
    docFlowSection.addEventListener("input", handleDocFlowInput);
    docFlowSection.addEventListener("change", handleDocFlowChange);
    docFlowSection.addEventListener("submit", handleDocFlowSubmit);
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
    renderQuickLinks();
    initializeAutoFillPanel();
    loadBookmarkFolders();
    initializeDocFlowMatrix();
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

  function df(key, replacements = {}) {
    const dictionary = DOC_FLOW_TRANSLATIONS[currentLanguage] || DOC_FLOW_TRANSLATIONS[DEFAULT_LANGUAGE];
    const fallbackDictionary = DOC_FLOW_TRANSLATIONS[DEFAULT_LANGUAGE];
    const template = dictionary[key] || fallbackDictionary[key] || key;

    return Object.entries(replacements).reduce((text, [name, value]) => {
      return text.replaceAll(`{${name}}`, String(value));
    }, template);
  }

  function getDocFlowStepTitle(step) {
    return df(`stepTitle${clampDocFlowStep(step)}`);
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
    updateCrmHorizontalScrollbarLabels();

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

    shadowRoot.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
      element.setAttribute("placeholder", t(element.dataset.i18nPlaceholder));
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
    renderQuickLinks();
    renderBookmarkFolders();
    updateQuickLinkFormMode();
    renderLoadedFiles();
    renderAutoFillPanel();
    renderDocFlowForCurrentLanguage();
  }

  function renderDocFlowForCurrentLanguage() {
    if (!shadowRoot?.querySelector("[data-doc-flow-root]")) {
      return;
    }

    updateDocFlowStaticChrome();

    if (docFlowView === "workflow" && docFlowOrder) {
      renderDocFlowWorkflow();
      return;
    }

    renderDocFlowDashboard();
  }

  function updateDocFlowStaticChrome() {
    const title = shadowRoot?.querySelector(".doc-flow__title");
    const subtitle = shadowRoot?.querySelector(".doc-flow__subtitle");
    const drawer = shadowRoot?.querySelector("[data-doc-flow-quick-ref]");
    const tab = shadowRoot?.querySelector(".doc-flow-quick-ref__tab");
    const drawerTitle = shadowRoot?.querySelector(".doc-flow-quick-ref__title");
    const closeButton = shadowRoot?.querySelector(".doc-flow-quick-ref__close");

    if (title) {
      title.textContent = df("moduleTitle");
    }
    if (subtitle) {
      subtitle.textContent = df("moduleSubtitle");
    }
    if (drawer) {
      drawer.setAttribute("aria-label", df("quickRefTitle"));
    }
    if (tab) {
      tab.textContent = df("quickRefTab");
    }
    if (drawerTitle) {
      drawerTitle.textContent = df("quickRefTitle");
    }
    if (closeButton) {
      closeButton.setAttribute("aria-label", df("quickRefClose"));
    }
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

  function readStoredQuickLinks() {
    try {
      const storedValue = window.localStorage.getItem(QUICK_LINKS_STORAGE_KEY);
      const parsedLinks = JSON.parse(storedValue || "[]");
      if (!Array.isArray(parsedLinks)) {
        return [];
      }

      return parsedLinks.reduce((links, link) => {
        const normalizedUrl = normalizeQuickLinkUrl(link?.url);
        const title = sanitizeQuickLinkTitle(link?.title, normalizedUrl);
        if (!normalizedUrl || !title) {
          return links;
        }

        const storedLink = {
          id: typeof link.id === "string" && link.id ? link.id : createQuickLinkId(),
          title,
          titleEn: typeof link?.titleEn === "string" && link.titleEn.trim()
            ? sanitizeQuickLinkTitle(link.titleEn, normalizedUrl)
            : translateQuickLinkTitleToEnglish(title),
          url: normalizedUrl,
          source: link.source === "bookmark" ? "bookmark" : "custom"
        };

        if (typeof link.replacesDefaultId === "string" && link.replacesDefaultId) {
          storedLink.replacesDefaultId = link.replacesDefaultId;
        }

        links.push(storedLink);
        return links;
      }, []);
    } catch (error) {
      return [];
    }
  }

  function saveStoredQuickLinks() {
    try {
      window.localStorage.setItem(QUICK_LINKS_STORAGE_KEY, JSON.stringify(userQuickLinks));
    } catch (error) {
      showQuickLinksStatus(t("quickLinksBookmarkUnavailable"), "error");
    }
  }

  function readRemovedDefaultQuickLinkKeys() {
    try {
      const storedValue = window.localStorage.getItem(REMOVED_DEFAULT_QUICK_LINKS_STORAGE_KEY);
      const parsedKeys = JSON.parse(storedValue || "[]");
      if (!Array.isArray(parsedKeys)) {
        return [];
      }

      return parsedKeys.filter((key) => typeof key === "string" && key);
    } catch (error) {
      return [];
    }
  }

  function saveRemovedDefaultQuickLinkKeys() {
    try {
      window.localStorage.setItem(REMOVED_DEFAULT_QUICK_LINKS_STORAGE_KEY, JSON.stringify(removedDefaultQuickLinkKeys));
    } catch (error) {
      showQuickLinksStatus(t("quickLinksBookmarkUnavailable"), "error");
    }
  }

  function getMergedQuickLinks() {
    const seenUrls = new Set();
    const defaultOverrideById = new Map();

    userQuickLinks.forEach((link) => {
      if (link.replacesDefaultId && !defaultOverrideById.has(link.replacesDefaultId)) {
        defaultOverrideById.set(link.replacesDefaultId, link);
      }
    });

    const defaultLinks = DEFAULT_QUICK_LINKS.reduce((links, link) => {
      const normalizedUrl = normalizeQuickLinkUrl(link.url);
      if (!normalizedUrl) {
        return links;
      }

      const overrideLink = defaultOverrideById.get(link.id);
      if (overrideLink) {
        seenUrls.add(getQuickLinkUrlKey(overrideLink.url));
        links.push(overrideLink);
        return links;
      }

      const key = getQuickLinkUrlKey(normalizedUrl);
      const legacyKeys = Array.isArray(link.legacyUrls) ? link.legacyUrls.map(getQuickLinkUrlKey) : [];
      if ([key].concat(legacyKeys).some((defaultKey) => removedDefaultQuickLinkKeys.includes(defaultKey))) {
        return links;
      }

      seenUrls.add(key);
      links.push({
        ...link,
        url: normalizedUrl,
        isDefault: true
      });
      return links;
    }, []);

    const storedLinks = userQuickLinks.filter((link) => {
      if (link.replacesDefaultId) {
        return false;
      }

      const key = getQuickLinkUrlKey(link.url);
      if (seenUrls.has(key)) {
        return false;
      }
      seenUrls.add(key);
      return true;
    });

    return defaultLinks.concat(storedLinks);
  }

  function renderQuickLinks() {
    if (!shadowRoot) {
      return;
    }

    const list = shadowRoot.querySelector(".quick-links__list");
    if (!list) {
      return;
    }

    list.innerHTML = getMergedQuickLinks().map((link) => {
      const displayTitle = getQuickLinkDisplayTitle(link);
      const badge = link.isDefault ? t("quickLinksDefaultBadge") : t("quickLinksCustomBadge");
      const removeControl = `<button class="quick-link-row__button quick-link-row__button--remove" type="button" data-quick-link-remove="${escapeHtml(link.id)}" aria-label="${escapeHtml(t("quickLinksRemove", { name: displayTitle }))}" title="${escapeHtml(t("quickLinksRemove", { name: displayTitle }))}">×</button>`;
      const editControl = `<button class="quick-link-row__button" type="button" data-quick-link-edit="${escapeHtml(link.id)}" aria-label="${escapeHtml(t("quickLinksEdit", { name: displayTitle }))}" title="${escapeHtml(t("quickLinksEdit", { name: displayTitle }))}">✎</button>`;

      return `
        <article class="quick-link-row">
          <span class="quick-link-row__avatar" aria-hidden="true">${escapeHtml(getQuickLinkInitials(displayTitle))}</span>
          <div class="quick-link-row__main">
            <a class="quick-link-row__title" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" data-quick-link-open="${escapeHtml(link.id)}">${escapeHtml(displayTitle)}</a>
            <span class="quick-link-row__meta">
              <span class="quick-link-row__host">${escapeHtml(getQuickLinkHost(link.url))}</span>
              <span class="quick-link-row__badge">${escapeHtml(badge)}</span>
            </span>
          </div>
          <button class="quick-link-row__button" type="button" data-quick-link-open="${escapeHtml(link.id)}" aria-label="${escapeHtml(t("quickLinksOpen", { name: displayTitle }))}" title="${escapeHtml(t("quickLinksOpen", { name: displayTitle }))}">↗</button>
          ${editControl}
          ${removeControl}
        </article>
      `;
    }).join("");
  }

  function renderBookmarkFolders() {
    if (!shadowRoot) {
      return;
    }

    const bookmarksPanel = shadowRoot.querySelector(".quick-links-bookmarks");
    const folderSelect = shadowRoot.querySelector("[data-quick-links-bookmark-folders]");
    const importButton = shadowRoot.querySelector("[data-quick-links-import]");
    if (!bookmarksPanel || !folderSelect || !importButton) {
      return;
    }

    if (!bookmarkFolders.length) {
      bookmarksPanel.hidden = true;
      importButton.disabled = true;
      return;
    }

    const selectedValue = folderSelect.value;
    folderSelect.innerHTML = [
      `<option value="">${escapeHtml(t("quickLinksBookmarkSelect"))}</option>`,
      ...bookmarkFolders.map((folder) => {
        const selected = selectedValue === folder.id ? " selected" : "";
        return `<option value="${escapeHtml(folder.id)}"${selected}>${escapeHtml(folder.path || folder.title || folder.id)}</option>`;
      })
    ].join("");

    bookmarksPanel.hidden = false;
    importButton.disabled = !folderSelect.value;
  }

  function handleQuickLinksClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    const openButton = target.closest("[data-quick-link-open]");
    if (openButton) {
      event.preventDefault();
      const link = getMergedQuickLinks().find((quickLink) => quickLink.id === openButton.dataset.quickLinkOpen);
      if (link) {
        openQuickLink(link.url);
      }
      return;
    }

    const editButton = target.closest("[data-quick-link-edit]");
    if (editButton) {
      const link = getMergedQuickLinks().find((quickLink) => quickLink.id === editButton.dataset.quickLinkEdit);
      if (link) {
        startQuickLinkEdit(link);
      }
      return;
    }

    const removeButton = target.closest("[data-quick-link-remove]");
    if (!removeButton) {
      return;
    }

    const link = getMergedQuickLinks().find((quickLink) => quickLink.id === removeButton.dataset.quickLinkRemove);
    if (!link) {
      return;
    }

    const displayTitle = getQuickLinkDisplayTitle(link);
    if (link.isDefault) {
      const key = getQuickLinkUrlKey(link.url);
      if (!removedDefaultQuickLinkKeys.includes(key)) {
        removedDefaultQuickLinkKeys = removedDefaultQuickLinkKeys.concat(key);
      }
      saveRemovedDefaultQuickLinkKeys();
    } else {
      userQuickLinks = userQuickLinks.filter((quickLink) => quickLink.id !== link.id);
      saveStoredQuickLinks();
    }

    renderQuickLinks();
    showQuickLinksStatus(t("quickLinksRemoved", { name: displayTitle }), "success");
  }

  function handleQuickLinkSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const nameInput = form.querySelector('input[name="name"]');
    const urlInput = form.querySelector('input[name="url"]');
    if (!nameInput || !urlInput) {
      return;
    }

    const normalizedUrl = normalizeQuickLinkUrl(urlInput.value);

    if (!normalizedUrl) {
      showQuickLinksStatus(t("quickLinksInvalidUrl"), "error");
      urlInput.focus();
      return;
    }

    if (hasQuickLinkUrl(normalizedUrl, editingQuickLinkId)) {
      showQuickLinksStatus(t("quickLinksDuplicate"), "error");
      urlInput.focus();
      return;
    }

    const titleInput = sanitizeQuickLinkTitle(nameInput.value, normalizedUrl);
    const editingLink = editingQuickLinkId
      ? getMergedQuickLinks().find((quickLink) => quickLink.id === editingQuickLinkId)
      : null;
    const title = currentLanguage === "en" && editingLink ? editingLink.title : titleInput;
    const titleEn = currentLanguage === "en" && !hasCjkText(titleInput)
      ? titleInput
      : translateQuickLinkTitleToEnglish(titleInput);

    if (editingQuickLinkId) {
      updateQuickLink(editingQuickLinkId, {
        title,
        titleEn,
        url: normalizedUrl
      });
      resetQuickLinkForm();
      showQuickLinksStatus(t("quickLinksSaved", { name: currentLanguage === "en" ? titleEn : title }), "success");
      return;
    }

    const link = {
      id: createQuickLinkId(),
      title,
      titleEn,
      url: normalizedUrl,
      source: "custom"
    };

    userQuickLinks = userQuickLinks.concat(link);
    saveStoredQuickLinks();
    renderQuickLinks();
    form.reset();
    showQuickLinksStatus(t("quickLinksSaved", { name: currentLanguage === "en" ? titleEn : title }), "success");
  }

  function startQuickLinkEdit(link) {
    const form = shadowRoot.querySelector(".quick-links__form");
    const nameInput = form?.querySelector('input[name="name"]');
    const urlInput = form?.querySelector('input[name="url"]');
    if (!form || !nameInput || !urlInput) {
      return;
    }

    editingQuickLinkId = link.id;
    nameInput.value = getQuickLinkDisplayTitle(link);
    urlInput.value = link.url;
    updateQuickLinkFormMode();
    nameInput.focus();
  }

  function updateQuickLink(linkId, values) {
    const link = getMergedQuickLinks().find((quickLink) => quickLink.id === linkId);
    if (!link) {
      return;
    }

    if (link.isDefault) {
      const key = getQuickLinkUrlKey(link.url);
      if (!removedDefaultQuickLinkKeys.includes(key)) {
        removedDefaultQuickLinkKeys = removedDefaultQuickLinkKeys.concat(key);
      }
      saveRemovedDefaultQuickLinkKeys();

      userQuickLinks = userQuickLinks.concat({
        id: createQuickLinkId(),
        title: values.title,
        titleEn: values.titleEn,
        url: values.url,
        source: "custom",
        replacesDefaultId: link.id
      });
    } else {
      userQuickLinks = userQuickLinks.map((quickLink) => {
        if (quickLink.id !== link.id) {
          return quickLink;
        }
        return {
          ...quickLink,
          title: values.title,
          titleEn: values.titleEn,
          url: values.url
        };
      });
    }

    saveStoredQuickLinks();
    renderQuickLinks();
  }

  function resetQuickLinkForm() {
    const form = shadowRoot?.querySelector(".quick-links__form");
    if (!form) {
      return;
    }

    editingQuickLinkId = null;
    form.reset();
    updateQuickLinkFormMode();
  }

  function updateQuickLinkFormMode() {
    const form = shadowRoot?.querySelector(".quick-links__form");
    const submitButton = form?.querySelector('button[type="submit"]');
    if (!form || !submitButton) {
      return;
    }

    form.classList.toggle("is-editing", Boolean(editingQuickLinkId));
    submitButton.textContent = editingQuickLinkId ? t("quickLinksUpdate") : t("quickLinksAdd");
  }

  async function loadBookmarkFolders() {
    try {
      const response = await sendRuntimeMessage({ type: BOOKMARK_FOLDERS_MESSAGE });
      if (!response?.ok || !Array.isArray(response.folders)) {
        throw new Error(response?.error || "Bookmark folders unavailable");
      }

      bookmarkFolders = response.folders.filter((folder) => folder && folder.id);
      renderBookmarkFolders();
    } catch (error) {
      bookmarkFolders = [];
      renderBookmarkFolders();
    }
  }

  async function handleBookmarkImportClick() {
    const folderSelect = shadowRoot.querySelector("[data-quick-links-bookmark-folders]");
    const importButton = shadowRoot.querySelector("[data-quick-links-import]");
    if (!folderSelect?.value || !importButton) {
      return;
    }

    importButton.disabled = true;
    try {
      const response = await sendRuntimeMessage({
        type: BOOKMARK_LINKS_MESSAGE,
        folderId: folderSelect.value
      });
      if (!response?.ok || !Array.isArray(response.links)) {
        throw new Error(response?.error || "Bookmark links unavailable");
      }

      let importedCount = 0;
      const nextLinks = userQuickLinks.slice();
      const seenUrls = new Set(getMergedQuickLinks().map((link) => getQuickLinkUrlKey(link.url)));

      response.links.forEach((bookmarkLink) => {
        const normalizedUrl = normalizeQuickLinkUrl(bookmarkLink?.url);
        if (!normalizedUrl) {
          return;
        }

        const key = getQuickLinkUrlKey(normalizedUrl);
        if (seenUrls.has(key)) {
          return;
        }

        seenUrls.add(key);
        const title = sanitizeQuickLinkTitle(bookmarkLink?.title, normalizedUrl);
        nextLinks.push({
          id: createQuickLinkId(),
          title,
          titleEn: translateQuickLinkTitleToEnglish(title),
          url: normalizedUrl,
          source: "bookmark"
        });
        importedCount += 1;
      });

      if (!importedCount) {
        showQuickLinksStatus(t("quickLinksImportNone"), "error");
        return;
      }

      userQuickLinks = nextLinks;
      saveStoredQuickLinks();
      renderQuickLinks();
      showQuickLinksStatus(t("quickLinksImportSuccess", { count: importedCount }), "success");
    } catch (error) {
      showQuickLinksStatus(t("quickLinksBookmarkUnavailable"), "error");
    } finally {
      importButton.disabled = !folderSelect.value;
    }
  }

  function sendRuntimeMessage(message) {
    return new Promise((resolve, reject) => {
      if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
        reject(new Error("Chrome runtime messaging unavailable"));
        return;
      }

      try {
        chrome.runtime.sendMessage(message, (response) => {
          const runtimeError = chrome.runtime?.lastError;
          if (runtimeError) {
            reject(new Error(runtimeError.message));
            return;
          }

          resolve(response);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  function openQuickLink(url) {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function hasQuickLinkUrl(url, excludedLinkId = null) {
    const key = getQuickLinkUrlKey(url);
    return getMergedQuickLinks().some((link) => {
      return link.id !== excludedLinkId && getQuickLinkUrlKey(link.url) === key;
    });
  }

  function normalizeQuickLinkUrl(value) {
    const rawValue = String(value || "").trim();
    if (!rawValue) {
      return "";
    }

    const valueWithProtocol = /^[a-z][a-z0-9+.-]*:/i.test(rawValue) ? rawValue : `https://${rawValue}`;

    try {
      const url = new URL(valueWithProtocol);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        return "";
      }
      return url.href;
    } catch (error) {
      return "";
    }
  }

  function getQuickLinkUrlKey(url) {
    return normalizeQuickLinkUrl(url).replace(/\/$/, "").toLowerCase();
  }

  function sanitizeQuickLinkTitle(title, fallbackUrl) {
    const trimmedTitle = String(title || "").trim();
    if (trimmedTitle) {
      return trimmedTitle.slice(0, 80);
    }
    return getQuickLinkHost(fallbackUrl) || "Website";
  }

  function getQuickLinkDisplayTitle(link) {
    if (currentLanguage === "en") {
      return sanitizeQuickLinkTitle(link.titleEn || translateQuickLinkTitleToEnglish(link.title), link.url);
    }
    return sanitizeQuickLinkTitle(link.title, link.url);
  }

  function translateQuickLinkTitleToEnglish(title) {
    const originalTitle = String(title || "").trim();
    if (!originalTitle || !hasCjkText(originalTitle)) {
      return originalTitle;
    }

    const exactPhraseMap = new Map([
      ["中国贸促会原产地网上签证", "CCPIT Certificate of Origin Online Application"],
      ["HS Code查询网站", "HS Code Lookup"],
      ["化合物百科（IUPAC NAME）", "Compound Encyclopedia (IUPAC Name)"],
      ["化合物百科(IUPAC NAME)", "Compound Encyclopedia (IUPAC Name)"],
      ["英文金额大写转换器", "English Amount in Words Converter"],
      ["二维码", "QR Code Generator"],
      ["时间计算器", "Time Calculator"]
    ]);
    if (exactPhraseMap.has(originalTitle)) {
      return exactPhraseMap.get(originalTitle);
    }

    const phraseMap = [
      ["中国贸促会", "CCPIT"],
      ["原产地", "Certificate of Origin"],
      ["网上签证", "Online Application"],
      ["签证", "Application"],
      ["查询网站", "Lookup"],
      ["查询", "Lookup"],
      ["化合物百科", "Compound Encyclopedia"],
      ["百科", "Encyclopedia"],
      ["英文金额大写", "English Amount in Words"],
      ["金额大写", "Amount in Words"],
      ["英文", "English"],
      ["金额", "Amount"],
      ["大写", "in Words"],
      ["转换器", "Converter"],
      ["二维码", "QR Code"],
      ["时间计算器", "Time Calculator"],
      ["时间", "Time"],
      ["计算器", "Calculator"],
      ["海关", "Customs"],
      ["报关", "Customs Declaration"],
      ["外贸", "Foreign Trade"],
      ["贸易", "Trade"],
      ["出口", "Export"],
      ["进口", "Import"],
      ["退税", "Tax Rebate"],
      ["汇率", "Exchange Rate"],
      ["发票", "Invoice"],
      ["合同", "Contract"],
      ["物流", "Logistics"],
      ["船期", "Shipping Schedule"],
      ["港口", "Port"],
      ["单证", "Documents"],
      ["证书", "Certificate"],
      ["公司", "Company"],
      ["银行", "Bank"],
      ["翻译", "Translator"],
      ["工具", "Tool"],
      ["网站", "Website"]
    ];

    let translatedTitle = originalTitle;
    phraseMap.forEach(([source, replacement]) => {
      translatedTitle = translatedTitle.replaceAll(source, ` ${replacement} `);
    });

    translatedTitle = translatedTitle
      .replace(/[（）]/g, (character) => character === "（" ? " (" : ") ")
      .replace(/\s+/g, " ")
      .trim();

    if (!translatedTitle || hasCjkText(translatedTitle)) {
      return originalTitle;
    }

    return translatedTitle.slice(0, 80);
  }

  function hasCjkText(value) {
    return /[\u3400-\u9fff]/.test(String(value || ""));
  }

  function getQuickLinkHost(url) {
    try {
      return new URL(url).hostname.replace(/^www\./i, "");
    } catch (error) {
      return String(url || "");
    }
  }

  function getQuickLinkInitials(title) {
    const compactTitle = String(title || "").trim();
    if (!compactTitle) {
      return "↗";
    }

    const asciiWords = compactTitle.match(/[A-Za-z0-9]+/g);
    if (asciiWords?.length) {
      return asciiWords.slice(0, 2).map((word) => word[0].toUpperCase()).join("");
    }

    return compactTitle.slice(0, 2);
  }

  function createQuickLinkId() {
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `quick-link-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function showQuickLinksStatus(message, type = "info") {
    const status = shadowRoot?.querySelector(".quick-links__status");
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-success", type === "success");
  }

  function readStoredDocFlowQuickReferenceOpen() {
    try {
      return window.localStorage.getItem(DOC_FLOW_QUICK_REF_OPEN_STORAGE_KEY) === "true";
    } catch (error) {
      return false;
    }
  }

  function setDocFlowQuickReferenceOpen(shouldOpen) {
    isDocFlowQuickReferenceOpen = shouldOpen === true;

    try {
      window.localStorage.setItem(DOC_FLOW_QUICK_REF_OPEN_STORAGE_KEY, String(isDocFlowQuickReferenceOpen));
    } catch (error) {
      // Drawer state remains usable for the current page if localStorage is blocked.
    }

    updateDocFlowQuickReferenceDrawer();
  }

  function initializeDocFlowMatrix() {
    renderDocFlowDashboard({ loading: true });

    readDocFlowUiState()
      .then((uiState) => {
        const activeOrderId = sanitizeDocFlowScNo(uiState.activeOrderId);
        if (activeOrderId) {
          refreshDocFlowDashboardOrders();
          hydrateDocFlowOrder(activeOrderId, clampDocFlowStep(uiState.currentStep));
          return;
        }

        refreshDocFlowDashboardOrders();
      })
      .catch(() => {
        refreshDocFlowDashboardOrders();
      });
  }

  function getDocFlowRoot() {
    return shadowRoot?.querySelector("[data-doc-flow-root]") || null;
  }

  function readDocFlowUiState() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage?.local) {
        resolve({});
        return;
      }

      try {
        chrome.storage.local.get(DOC_FLOW_UI_STATE_STORAGE_KEY, (result) => {
          if (chrome.runtime?.lastError) {
            resolve({});
            return;
          }

          resolve(result?.[DOC_FLOW_UI_STATE_STORAGE_KEY] || {});
        });
      } catch (error) {
        if (isExtensionContextInvalidatedError(error)) {
          resolve({});
          return;
        }

        resolve({});
      }
    });
  }

  function saveDocFlowUiState(activeOrderId, currentStep) {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage?.local) {
        resolve();
        return;
      }

      try {
        chrome.storage.local.set({
          [DOC_FLOW_UI_STATE_STORAGE_KEY]: {
            activeOrderId: sanitizeDocFlowScNo(activeOrderId),
            currentStep: clampDocFlowStep(currentStep)
          }
        }, () => {
          resolve();
        });
      } catch (error) {
        resolve();
      }
    });
  }

  function clearDocFlowUiState() {
    return new Promise((resolve) => {
      if (typeof chrome === "undefined" || !chrome.storage?.local) {
        resolve();
        return;
      }

      try {
        chrome.storage.local.remove(DOC_FLOW_UI_STATE_STORAGE_KEY, () => {
          resolve();
        });
      } catch (error) {
        resolve();
      }
    });
  }

  function isExtensionContextInvalidatedError(error) {
    return String(error?.message || error || "").includes("Extension context invalidated");
  }

  async function refreshDocFlowDashboardOrders() {
    const hydrationToken = ++docFlowHydrationToken;

    try {
      docFlowOrdersList = await docFlowStorage.listOrders();
      if (hydrationToken === docFlowHydrationToken && docFlowView === "dashboard") {
        renderDocFlowDashboard();
      }
    } catch (error) {
      if (hydrationToken === docFlowHydrationToken && docFlowView === "dashboard") {
        renderDocFlowDashboard({ error: df("dashboardError") });
      }
    }
  }

  function renderDocFlowDashboard(options = {}) {
    docFlowView = "dashboard";
    docFlowOrder = null;
    docFlowCurrentStep = 1;
    clearDocFlowFileObjectUrls();

    const root = getDocFlowRoot();
    if (!root) {
      return;
    }

    const statusHtml = options.error
      ? `<p class="doc-flow-status is-error">${escapeHtml(options.error)}</p>`
      : options.loading
        ? `<p class="doc-flow-status">${escapeHtml(df("dashboardLoading"))}</p>`
        : "";

    root.innerHTML = `
      <div class="doc-flow__toolbar">
        <h3 class="doc-flow__heading">${escapeHtml(df("dashboardTitle"))}</h3>
        <button class="doc-flow__button doc-flow__button--primary" type="button" data-doc-flow-new>${escapeHtml(df("newFlow"))}</button>
      </div>
      ${statusHtml}
      ${options.loading || options.error ? "" : buildDocFlowDashboardTableHtml()}
      <p class="doc-flow-status" data-doc-flow-status></p>
    `;
    updateDocFlowQuickReferenceDrawer();
  }

  function buildDocFlowDashboardTableHtml() {
    if (!docFlowOrdersList.length) {
      return `<div class="doc-flow-table__empty">${escapeHtml(df("dashboardEmpty"))}</div>`;
    }

    const rows = docFlowOrdersList.map((order) => {
      return `
        <tr>
          <td data-label="${escapeHtml(df("orderNo"))}"><strong>${escapeHtml(order.scNo)}</strong></td>
          <td data-label="${escapeHtml(df("customerName"))}">${escapeHtml(order.customerName || "--")}</td>
          <td data-label="${escapeHtml(df("destinationPort"))}">${escapeHtml(order.destinationPort || "--")}</td>
          <td data-label="${escapeHtml(df("etd"))}">${escapeHtml(order.etd || "--")}</td>
          <td data-label="${escapeHtml(df("currentProgress"))}">${buildDocFlowProgressBadge(order)}</td>
          <td class="doc-flow-table__actions-cell" data-label="${escapeHtml(df("action"))}">
            <div class="doc-flow-actions">
              <button class="doc-flow__button" type="button" data-doc-flow-open="${escapeHtml(order.scNo)}">${escapeHtml(df("open"))}</button>
              <button class="doc-flow__button doc-flow__button--danger" type="button" data-doc-flow-delete="${escapeHtml(order.scNo)}">${escapeHtml(df("delete"))}</button>
            </div>
          </td>
        </tr>
      `;
    }).join("");

    return `
      <div class="doc-flow-table-wrap">
        <table class="doc-flow-table">
          <thead>
            <tr>
              <th>${escapeHtml(df("orderNo"))}</th>
              <th>${escapeHtml(df("customerName"))}</th>
              <th>${escapeHtml(df("destinationPort"))}</th>
              <th>${escapeHtml(df("etd"))}</th>
              <th>${escapeHtml(df("currentProgress"))}</th>
              <th>${escapeHtml(df("action"))}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  function buildDocFlowProgressBadge(order) {
    if (order.archived) {
      return `<span class="doc-flow-progress is-archived">${escapeHtml(df("archived"))}</span>`;
    }

    const step = clampDocFlowStep(order.currentStep);
    const stepTitle = getDocFlowStepTitle(step);
    return `<span class="doc-flow-progress">Step ${step}/4 ${escapeHtml(stepTitle)}</span>`;
  }

  async function hydrateDocFlowOrder(scNo, step) {
    const normalizedScNo = sanitizeDocFlowScNo(scNo);
    if (!normalizedScNo) {
      return;
    }

    const hydrationToken = ++docFlowHydrationToken;
    docFlowView = "workflow";
    docFlowCurrentStep = clampDocFlowStep(step);
    renderDocFlowLoading(normalizedScNo);

    try {
      await docFlowSaveQueue.catch(() => {});
      const storedOrder = await docFlowStorage.getOrder(normalizedScNo);
      const order = storedOrder ? normalizeDocFlowOrder(storedOrder) : await docFlowStorage.createOrder(normalizedScNo);
      const files = await docFlowStorage.getFiles(normalizedScNo).catch(() => null);

      if (hydrationToken !== docFlowHydrationToken) {
        return;
      }

      docFlowOrder = normalizeDocFlowOrder(order);
      docFlowCurrentStep = clampDocFlowStep(step || docFlowOrder.currentStep || 1);
      setDocFlowFiles(files);
      await saveDocFlowUiState(docFlowOrder.scNo, docFlowCurrentStep);
      renderDocFlowWorkflow();
      updateDocFlowQuickReferenceDrawer();
    } catch (error) {
      if (hydrationToken === docFlowHydrationToken) {
        renderDocFlowError(error.message || df("orderLoadFailed"));
      }
    }
  }

  function renderDocFlowLoading(scNo) {
    const root = getDocFlowRoot();
    if (!root) {
      return;
    }

    root.innerHTML = `<p class="doc-flow-status">${escapeHtml(df("loadingOrder", { scNo }))}</p>`;
  }

  function renderDocFlowError(message) {
    const root = getDocFlowRoot();
    if (!root) {
      return;
    }

    root.innerHTML = `
      <p class="doc-flow-status is-error">${escapeHtml(message)}</p>
      <button class="doc-flow__button" type="button" data-doc-flow-exit>${escapeHtml(df("backDashboard"))}</button>
    `;
  }

  function renderDocFlowWorkflow() {
    const root = getDocFlowRoot();
    if (!root || !docFlowOrder) {
      return;
    }

    const stepTitle = getDocFlowStepTitle(docFlowCurrentStep);
    root.innerHTML = `
      <div class="doc-flow-alert doc-flow-alert--critical" data-doc-flow-critical-banner${getDocFlowField("vesselTracking") === "abnormal" ? "" : " hidden"}>
        ${escapeHtml(df("vesselCritical"))}
      </div>
      <div class="doc-flow__toolbar">
        <h3 class="doc-flow__heading">${escapeHtml(docFlowOrder.scNo)} · ${escapeHtml(stepTitle)}</h3>
        <span class="doc-flow-progress">${escapeHtml(buildDocFlowPlainProgress(docFlowOrder))}</span>
      </div>
      ${buildDocFlowBreadcrumbHtml()}
      <div class="doc-flow-page">
        ${buildDocFlowStepPageHtml(docFlowCurrentStep)}
      </div>
      ${buildDocFlowFooterHtml()}
      <p class="doc-flow-status" data-doc-flow-status></p>
    `;

    updateDocFlowReactiveBlocks();
    updateDocFlowQuickReferenceDrawer();
  }

  function buildDocFlowPlainProgress(order) {
    const step = clampDocFlowStep(order.currentStep);
    return order.archived ? df("archived") : `Step ${step}/4`;
  }

  function buildDocFlowBreadcrumbHtml() {
    const maxAccessibleStep = Math.max(clampDocFlowStep(docFlowOrder.currentStep), docFlowCurrentStep);

    return `<nav class="doc-flow-nav" aria-label="${escapeHtml(df("moduleTitle"))}">
      ${DOC_FLOW_STEPS.map((item) => {
        const isCurrent = item.step === docFlowCurrentStep;
        const isComplete = item.step < maxAccessibleStep;
        const isAccessible = item.step <= maxAccessibleStep;
        const className = [
          "doc-flow-step",
          isCurrent ? "is-current" : "",
          isComplete ? "is-complete" : ""
        ].filter(Boolean).join(" ");
        return `
          <button class="${className}" type="button" data-doc-flow-step="${item.step}"${isAccessible ? "" : " disabled"}>
            <span class="doc-flow-step__number">Step ${item.step}</span>
            <span class="doc-flow-step__title">${escapeHtml(getDocFlowStepTitle(item.step))}</span>
          </button>
        `;
      }).join("")}
    </nav>`;
  }

  function buildDocFlowStepPageHtml(step) {
    if (step === 1) {
      return buildDocFlowStepOneHtml();
    }
    if (step === 2) {
      return buildDocFlowStepTwoHtml();
    }
    if (step === 3) {
      return buildDocFlowStepThreeHtml();
    }
    return buildDocFlowStepFourHtml();
  }

  function buildDocFlowStepOneHtml() {
    return `
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("orderOverview"))}</h4>
        <div class="doc-flow-grid">
          ${buildDocFlowTextInput("customerName", df("customerName"))}
          ${buildDocFlowTextInput("customerPoNo", df("customerPoNo"))}
          ${buildDocFlowTextInput("destinationPort", df("destinationPort"))}
          ${buildDocFlowTextInput("incoterms", df("incoterms"))}
          ${buildDocFlowTextInput("paymentTimeText", df("paymentTime"))}
          ${buildDocFlowTextInput("officialEnglishProductName", df("officialEnglishName"))}
        </div>
      </section>
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("step1Section"))}</h4>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("productNameLocked", df("productName"))}
          ${buildDocFlowCheckbox("unitPriceLocked", df("unitPrice"))}
          ${buildDocFlowCheckbox("quantityLocked", df("quantity"))}
          ${buildDocFlowCheckbox("destinationPortLocked", df("destinationPort"))}
          ${buildDocFlowCheckbox("paymentTimeLocked", df("paymentTime"))}
          ${buildDocFlowCheckbox("commissionRequirementLocked", df("commissionRequirement"))}
          ${buildDocFlowCheckbox("scCreatedAndSent", df("scCreatedAndSent"))}
          ${buildDocFlowCheckbox("scAndPoTracking", df("scAndPoTracking"))}
          ${buildDocFlowCheckbox("officialPoReceived", df("officialPoReceived"))}
        </div>
        <div class="doc-flow-reveal" data-doc-flow-reveal="official-po"${isDocFlowChecked("officialPoReceived") ? "" : " hidden"}>
          <div class="doc-flow-alert">${escapeHtml(df("poWarning"))}</div>
          ${buildDocFlowTextarea("specialRequirements", df("specialRequirements"))}
        </div>
      </section>
    `;
  }

  function buildDocFlowStepTwoHtml() {
    const hasFactoryDate = Boolean(getDocFlowField("expectedFactoryDispatchDate"));
    const isHazChem = isDocFlowChecked("hazardousChemicals");
    const needsFinanceAck = isDocFlowChecked("productScheduleRegistered");

    return `
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("factoryLine"))}</h4>
        <div class="doc-flow-grid">
          ${buildDocFlowTextInput("expectedFactoryDispatchDate", df("expectedFactoryDispatchDate"), { type: "date" })}
        </div>
        <div class="doc-flow-reveal" data-doc-flow-reveal="factory-coa"${hasFactoryDate ? "" : " hidden"}>
          <div class="doc-flow-alert">${escapeHtml(df("factoryCoaWarning"))}</div>
          ${buildDocFlowTextInput("coaBatchDate", df("coaBatchDate"))}
        </div>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("hazardousChemicals", df("hazardousChemicals"))}
        </div>
        <div class="doc-flow-checklist doc-flow-reveal" data-doc-flow-reveal="hazchem"${isHazChem ? "" : " hidden"}>
          ${buildDocFlowTextInput("dangerousCasNo", df("dangerousCasNo"))}
          ${buildDocFlowCheckbox("hazchemInspectionNeeded", df("hazchemInspectionNeeded"), { title: df("hazchemInspectionTooltip") })}
          ${buildDocFlowCheckbox("hazchemInfoReceived", df("hazchemInfoReceived"), { title: df("hazchemInfoTooltip") })}
        </div>
      </section>
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("forwarderLine"))}</h4>
        <div class="doc-flow-grid">
          ${buildDocFlowTextInput("forwarderEtd", df("forwarderEtd"), { type: "date" })}
          ${buildDocFlowTextInput("eta", df("eta"), { type: "date" })}
          ${buildDocFlowTextInput("warehouseEntryTime", df("warehouseEntryTime"))}
          ${buildDocFlowTextInput("documentCutoffTime", df("documentCutoffTime"))}
          ${buildDocFlowTextInput("forwarderPhone", df("forwarderPhone"))}
          ${buildDocFlowTextInput("freightUsd", df("freightUsd"), { type: "number", step: "0.01" })}
          ${buildDocFlowTextInput("freightRmb", df("freightRmb"), { type: "number", step: "0.01" })}
        </div>
      </section>
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("bookingDocs"))}</h4>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("bookingInstructionSent", df("bookingInstructionSent"))}
        </div>
        ${buildDocFlowTextInput("tenDigitWarehouseNo", df("tenDigitWarehouseNo"))}
        <div class="doc-flow-grid">
          ${buildDocFlowTextInput("bookPackageCount", df("bookPackageCount"), { type: "number", step: "1" })}
          ${buildDocFlowTextInput("bookVolume", df("bookVolume"))}
          ${buildDocFlowTextInput("bookGrossWeight", df("bookGrossWeight"))}
        </div>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("invoicePrepared", df("invoice"))}
          ${buildDocFlowCheckbox("packingListPrepared", df("packingList"))}
          ${buildDocFlowCheckbox("cooDraftPrepared", df("cooDraft"))}
          ${buildDocFlowCheckbox("insurancePolicyPrepared", df("insurancePolicy"))}
          ${buildDocFlowCheckbox("batchCertificatePrepared", df("batchCertificate"))}
        </div>
      </section>
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("financeAndCustomerConfirm"))}</h4>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("productScheduleRegistered", df("productScheduleRegistered"))}
        </div>
        <div class="doc-flow-checklist doc-flow-reveal" data-doc-flow-reveal="finance-ack"${needsFinanceAck ? "" : " hidden"}>
          ${buildDocFlowCheckbox("financeWarningAcknowledged", df("financeWarningAcknowledged"))}
        </div>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("formalLabelAndCoaSent", df("formalLabelAndCoaSent"))}
        </div>
      </section>
    `;
  }

  function buildDocFlowStepThreeHtml() {
    const gateAConfirmed = isDocFlowChecked("customerLabelCoaConfirmed");

    return `
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("preConfirm"))}</h4>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("customerLabelCoaConfirmed", df("customerLabelCoaConfirmed"))}
        </div>
      </section>
      <fieldset class="doc-flow-section" data-doc-flow-page3-rest${gateAConfirmed ? "" : " disabled"}>
        <h4 class="doc-flow-section__title">${escapeHtml(df("step3Section"))}</h4>
        <div class="doc-flow-grid">
          <label class="doc-flow-radio">
            <input type="radio" name="doc-flow-label-routing" data-doc-flow-field="labelRouting" value="originalFactory"${getDocFlowField("labelRouting") === "originalFactory" ? " checked" : ""}>
            <span>${escapeHtml(df("originalFactory"))}</span>
          </label>
          <label class="doc-flow-radio">
            <input type="radio" name="doc-flow-label-routing" data-doc-flow-field="labelRouting" value="nonOriginalFactory"${getDocFlowField("labelRouting") === "nonOriginalFactory" ? " checked" : ""}>
            <span>${escapeHtml(df("nonOriginalFactory"))}</span>
          </label>
        </div>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("factoryTruckDispatched", df("factoryTruckDispatched"))}
        </div>
        <div class="doc-flow-grid">
          ${buildDocFlowTextInput("driverNamePlate", df("driverNamePlate"))}
          ${buildDocFlowTextInput("driverPhone", df("driverPhone"))}
        </div>
        ${buildDocFlowFileField("factoryDispatchPhoto", df("factoryDispatchPhoto"))}
        <div class="doc-flow-grid">
          ${buildDocFlowTextInput("actualPackageCount", df("actualPackageCount"), { type: "number", step: "1" })}
          ${buildDocFlowTextInput("actualVolume", df("actualVolume"))}
          ${buildDocFlowTextInput("actualWeight", df("actualWeight"))}
        </div>
        ${buildDocFlowFileField("warehouseEntryPhoto", df("warehouseEntryPhoto"))}
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("warehouseLabelVerified", df("warehouseLabelVerified"))}
        </div>
      </fieldset>
    `;
  }

  function buildDocFlowStepFourHtml() {
    return `
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("customsHazchemDocs"))}</h4>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("customsDocsSentToForwarder", df("customsDocsSentToForwarder"))}
          ${buildDocFlowCheckbox("declarationElementsStamped", df("declarationElementsStamped"))}
          ${buildDocFlowCheckbox("hazchemOriginalsForwarded", df("hazchemOriginalsForwarded"))}
        </div>
        ${buildDocFlowSelect("vesselTracking", df("vesselTracking"), [
          ["normal", df("normalDeparture")],
          ["abnormal", df("abnormalDeparture")]
        ], { defaultValue: "normal" })}
      </section>
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("blConfirm"))}</h4>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("blDraftReceivedAndReviewed", df("blDraftReceivedAndReviewed"))}
          ${buildDocFlowCheckbox("customerConfirmedBlDraft", df("customerConfirmedBlDraft"))}
          ${buildDocFlowCheckbox("officialBlReceived", df("officialBlReceived"))}
          ${buildDocFlowCheckbox("blScanSentToCustomer", df("blScanSentToCustomer"))}
        </div>
      </section>
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("dispatchAudit"))}</h4>
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("bankDocsSentByDhl", df("bankDocsSentByDhl"))}
          ${buildDocFlowCheckbox("ciPlLabelSigned", df("ciPlLabelSigned"))}
          ${buildDocFlowCheckbox("labelCustomsInfoAccurate", df("labelCustomsInfoAccurate"))}
        </div>
      </section>
      <section class="doc-flow-section">
        <h4 class="doc-flow-section__title">${escapeHtml(df("closeout"))}</h4>
        ${buildDocFlowTextInput("dhlNo", df("dhlNo"))}
        <div class="doc-flow-checklist">
          ${buildDocFlowCheckbox("dhlNoNotifiedCustomer", df("dhlNoNotifiedCustomer"))}
        </div>
        <button class="doc-flow__button doc-flow__button--danger" type="button" data-doc-flow-archive${getDocFlowGateStatus(4).ok ? "" : " disabled"}>${escapeHtml(df("archiveCloseout"))}</button>
      </section>
    `;
  }

  function buildDocFlowFooterHtml() {
    const gateStatus = getDocFlowGateStatus(docFlowCurrentStep);
    const isFinalStep = docFlowCurrentStep >= 4;
    return `
      <div class="doc-flow-footer">
        <button class="doc-flow__button" type="button" data-doc-flow-prev${docFlowCurrentStep <= 1 ? " disabled" : ""}>${escapeHtml(df("prev"))}</button>
        <button class="doc-flow__button" type="button" data-doc-flow-exit>${escapeHtml(df("saveExit"))}</button>
        <button class="doc-flow__button doc-flow__button--primary" type="button" data-doc-flow-next${isFinalStep || !gateStatus.ok ? " disabled" : ""} title="${escapeHtml(gateStatus.message)}">${escapeHtml(isFinalStep ? df("finalStep") : df("next"))}</button>
      </div>
    `;
  }

  function buildDocFlowTextInput(key, label, options = {}) {
    const type = options.type || "text";
    const step = options.step ? ` step="${escapeHtml(options.step)}"` : "";
    const required = options.required ? " required" : "";
    return `
      <label class="doc-flow-field">
        <span>${escapeHtml(label)}</span>
        <input type="${escapeHtml(type)}" data-doc-flow-field="${escapeHtml(key)}" value="${escapeHtml(getDocFlowField(key))}"${step}${required}>
      </label>
    `;
  }

  function buildDocFlowTextarea(key, label, options = {}) {
    const required = options.required ? " required" : "";
    return `
      <label class="doc-flow-field">
        <span>${escapeHtml(label)}</span>
        <textarea data-doc-flow-field="${escapeHtml(key)}"${required}>${escapeHtml(getDocFlowField(key))}</textarea>
      </label>
    `;
  }

  function buildDocFlowCheckbox(key, label, options = {}) {
    const title = options.title ? ` title="${escapeHtml(options.title)}"` : "";
    return `
      <label class="doc-flow-check"${title}>
        <input type="checkbox" data-doc-flow-field="${escapeHtml(key)}"${isDocFlowChecked(key) ? " checked" : ""}>
        <span>${escapeHtml(label)}</span>
      </label>
    `;
  }

  function buildDocFlowSelect(key, label, options, config = {}) {
    const value = getDocFlowField(key) || config.defaultValue || "";
    return `
      <label class="doc-flow-field">
        <span>${escapeHtml(label)}</span>
        <select data-doc-flow-field="${escapeHtml(key)}">
          ${options.map(([optionValue, optionLabel]) => {
            return `<option value="${escapeHtml(optionValue)}"${value === optionValue ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`;
          }).join("")}
        </select>
      </label>
    `;
  }

  function buildDocFlowFileField(slot, label) {
    return `
      <div class="doc-flow-file">
        <label class="doc-flow-field">
          <span>${escapeHtml(label)}</span>
          <input type="file" accept="image/*" data-doc-flow-file="${escapeHtml(slot)}">
        </label>
        <div class="doc-flow-file__preview" data-doc-flow-file-preview="${escapeHtml(slot)}">
          ${buildDocFlowFilePreviewHtml(slot)}
        </div>
      </div>
    `;
  }

  function buildDocFlowFilePreviewHtml(slot) {
    const fileRecord = docFlowFiles?.[slot];
    const objectUrl = docFlowObjectUrls[slot];

    if (!fileRecord || !objectUrl) {
      return `
        <div></div>
        <div class="doc-flow-file__meta">${escapeHtml(df("fileEmpty"))}</div>
      `;
    }

    return `
      <img src="${escapeHtml(objectUrl)}" alt="${escapeHtml(fileRecord.name || df("imagePreview"))}">
      <div class="doc-flow-file__meta">
        <strong>${escapeHtml(fileRecord.name || df("uploadedImage"))}</strong><br>
        ${escapeHtml(formatDocFlowFileSize(fileRecord.size || 0))} · ${escapeHtml(formatDocFlowTimestamp(fileRecord.updatedAt))}
      </div>
    `;
  }

  function updateDocFlowQuickReferenceDrawer() {
    const drawer = shadowRoot?.querySelector("[data-doc-flow-quick-ref]");
    const body = shadowRoot?.querySelector("[data-doc-flow-quick-ref-body]");
    const toggleButtons = shadowRoot?.querySelectorAll("[data-doc-flow-quick-ref-toggle]");

    if (!drawer || !body) {
      return;
    }

    drawer.classList.toggle("is-open", isDocFlowQuickReferenceOpen);
    toggleButtons?.forEach((button) => {
      button.setAttribute("aria-expanded", String(isDocFlowQuickReferenceOpen));
    });

    body.innerHTML = buildDocFlowQuickReferenceHtml();
  }

  function buildDocFlowQuickReferenceHtml() {
    if (!docFlowOrder) {
      return `<p class="doc-flow-quick-ref__empty">${escapeHtml(df("quickRefEmpty"))}</p>`;
    }

    const fields = getDocFlowFields();
    const checks = getDocFlowChecks();
    const isHazardous = checks.hazardousChemicals === true;
    const hasVesselException = fields.vesselTracking === "abnormal";
    const specialRequirements = normalizeDocFlowReferenceValue(fields.specialRequirements);
    const financeStatus = checks.financeWarningAcknowledged === true ? df("financeNotified") : df("financeNotApplicable");
    const dhlNo = normalizeDocFlowReferenceValue(fields.dhlNo);

    return `
      <div class="doc-flow-quick-ref__critical">
        <span class="doc-flow-quick-ref__critical-label">${escapeHtml(df("specialRequirements"))}</span>
        ${escapeHtml(specialRequirements || df("specialRequirementsEmpty"))}
      </div>
      <section class="doc-flow-quick-ref__group">
        <h4 class="doc-flow-quick-ref__group-title">${escapeHtml(df("groupContract"))}</h4>
        ${buildDocFlowQuickRefItem(df("salesContractNo"), docFlowOrder.scNo, { copy: true })}
        ${buildDocFlowQuickRefItem(df("customerPoNo"), fields.customerPoNo, { copy: true })}
        ${buildDocFlowQuickRefItem(df("customerName"), docFlowOrder.customerName || fields.customerName)}
        ${buildDocFlowQuickRefItem(df("contractPayment"), compactDocFlowParts([fields.incoterms, fields.paymentTimeText || (checks.paymentTimeLocked ? df("paymentTimeLocked") : "")]))}
      </section>
      <section class="doc-flow-quick-ref__group">
        <h4 class="doc-flow-quick-ref__group-title">${escapeHtml(df("groupLogistics"))}</h4>
        ${buildDocFlowQuickRefItem(df("tenDigitWarehouseNo"), fields.tenDigitWarehouseNo, { copy: true })}
        ${buildDocFlowQuickRefItem(df("warehouseCutoff"), compactDocFlowParts([fields.warehouseEntryTime, fields.documentCutoffTime]))}
        ${buildDocFlowQuickRefItem("ETD / ETA", compactDocFlowParts([fields.forwarderEtd, fields.eta]), {
          warning: hasVesselException,
          prefix: hasVesselException ? "⚠️ " : ""
        })}
        ${buildDocFlowQuickRefItem(df("forwarderPhone"), fields.forwarderPhone, { copy: true })}
        ${buildDocFlowQuickRefItem(df("driverPhone"), fields.driverPhone, { copy: true })}
      </section>
      <section class="doc-flow-quick-ref__group">
        <h4 class="doc-flow-quick-ref__group-title">${escapeHtml(df("groupCargo"))}</h4>
        ${buildDocFlowQuickRefItem(df("officialEnglishName"), fields.officialEnglishProductName, { copy: true })}
        ${isHazardous ? buildDocFlowQuickRefItem(df("dangerousCasNo"), fields.dangerousCasNo, {
          copy: true,
          danger: true,
          pulsing: true
        }) : ""}
        ${buildDocFlowQuickRefItem(df("productionBatchDate"), fields.coaBatchDate)}
        ${buildDocFlowSnapshotHtml(fields)}
      </section>
      <section class="doc-flow-quick-ref__group">
        <h4 class="doc-flow-quick-ref__group-title">${escapeHtml(df("groupFinance"))}</h4>
        ${buildDocFlowQuickRefItem(df("freightUsd"), fields.freightUsd)}
        ${buildDocFlowQuickRefItem(df("freightRmb"), fields.freightRmb)}
        ${buildDocFlowQuickRefItem(df("financeStatus"), financeStatus)}
        ${dhlNo ? buildDocFlowQuickRefItem(df("dhlNo"), dhlNo, { copy: true }) : ""}
      </section>
    `;
  }

  function buildDocFlowQuickRefItem(label, value, options = {}) {
    const normalizedValue = normalizeDocFlowReferenceValue(value);
    const displayValue = normalizedValue || df("notFilled");
    const copyAttribute = options.copy && normalizedValue
      ? ` data-doc-flow-quick-ref-copy="${escapeHtml(normalizedValue)}"`
      : "";
    const copyButton = options.copy
      ? `<button class="doc-flow-quick-ref__copy" type="button"${copyAttribute}${normalizedValue ? "" : " disabled"} aria-label="${escapeHtml(df("copy", { label }))}">📋</button>`
      : "<span></span>";
    const itemClass = options.warning ? " doc-flow-quick-ref__item is-warning" : " doc-flow-quick-ref__item";
    const valueClass = [
      "doc-flow-quick-ref__item-value",
      normalizedValue ? "" : "is-muted",
      options.danger ? "is-danger" : "",
      options.pulsing ? "is-pulsing" : ""
    ].filter(Boolean).join(" ");

    return `
      <div class="${itemClass.trim()}">
        <span class="doc-flow-quick-ref__item-label">${escapeHtml(label)}</span>
        <span class="${valueClass}" title="${escapeHtml(displayValue)}">${escapeHtml(options.prefix || "")}${escapeHtml(displayValue)}</span>
        ${copyButton}
      </div>
    `;
  }

  function buildDocFlowSnapshotHtml(fields) {
    const bookData = compactDocFlowParts([
      fields.bookPackageCount ? `${df("packageCountShort")} ${fields.bookPackageCount}` : "",
      fields.bookVolume ? `${df("volumeShort")} ${fields.bookVolume}` : "",
      fields.bookGrossWeight ? `${df("grossWeightShort")} ${fields.bookGrossWeight}` : ""
    ]);
    const actualData = compactDocFlowParts([
      fields.actualPackageCount ? `${df("packageCountShort")} ${fields.actualPackageCount}` : "",
      fields.actualVolume ? `${df("volumeShort")} ${fields.actualVolume}` : "",
      fields.actualWeight ? `${df("grossWeightShort")} ${fields.actualWeight}` : ""
    ]);

    return `
      <div class="doc-flow-quick-ref__snapshot">
        <div class="doc-flow-quick-ref__snapshot-cell">
          <span class="doc-flow-quick-ref__snapshot-label">${escapeHtml(df("bookData"))}</span>
          <span class="doc-flow-quick-ref__snapshot-value">${escapeHtml(bookData || df("notFilled"))}</span>
        </div>
        <div class="doc-flow-quick-ref__snapshot-cell">
          <span class="doc-flow-quick-ref__snapshot-label">${escapeHtml(df("actualWarehouseData"))}</span>
          <span class="doc-flow-quick-ref__snapshot-value">${escapeHtml(actualData || df("notFilled"))}</span>
        </div>
      </div>
    `;
  }

  function compactDocFlowParts(parts) {
    return (parts || [])
      .map((part) => normalizeDocFlowReferenceValue(part))
      .filter(Boolean)
      .join(" / ");
  }

  function normalizeDocFlowReferenceValue(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  async function copyDocFlowQuickReferenceValue(value) {
    const text = normalizeDocFlowReferenceValue(value);
    if (!text) {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      showDocFlowQuickReferenceToast(df("copied"));
    } catch (error) {
      showDocFlowQuickReferenceToast(df("copyFailed"));
    }
  }

  function showDocFlowQuickReferenceToast(message) {
    const toast = shadowRoot?.querySelector("[data-doc-flow-quick-ref-toast]");
    if (!toast) {
      return;
    }

    if (docFlowQuickRefToastTimer) {
      window.clearTimeout(docFlowQuickRefToastTimer);
    }

    toast.textContent = message;
    toast.classList.add("is-visible");
    docFlowQuickRefToastTimer = window.setTimeout(() => {
      toast.classList.remove("is-visible");
      docFlowQuickRefToastTimer = null;
    }, 1100);
  }

  function handleDocFlowClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    const quickReferenceToggle = target.closest("[data-doc-flow-quick-ref-toggle]");
    if (quickReferenceToggle) {
      setDocFlowQuickReferenceOpen(!isDocFlowQuickReferenceOpen);
      return;
    }

    const quickReferenceCopyButton = target.closest("[data-doc-flow-quick-ref-copy]");
    if (quickReferenceCopyButton) {
      copyDocFlowQuickReferenceValue(quickReferenceCopyButton.dataset.docFlowQuickRefCopy);
      return;
    }

    const newButton = target.closest("[data-doc-flow-new]");
    if (newButton) {
      showDocFlowNewOrderModal();
      return;
    }

    const modalCloseButton = target.closest("[data-doc-flow-modal-close]");
    if (modalCloseButton) {
      closeDocFlowModal();
      return;
    }

    const financeOkButton = target.closest("[data-doc-flow-finance-ok]");
    if (financeOkButton) {
      closeDocFlowModal();
      return;
    }

    const openButton = target.closest("[data-doc-flow-open]");
    if (openButton) {
      hydrateDocFlowOrder(openButton.dataset.docFlowOpen, 1);
      return;
    }

    const deleteButton = target.closest("[data-doc-flow-delete]");
    if (deleteButton) {
      deleteDocFlowDashboardOrder(deleteButton.dataset.docFlowDelete);
      return;
    }

    const stepButton = target.closest("[data-doc-flow-step]");
    if (stepButton && !stepButton.disabled) {
      navigateDocFlowStep(Number(stepButton.dataset.docFlowStep));
      return;
    }

    if (target.closest("[data-doc-flow-prev]")) {
      navigateDocFlowStep(docFlowCurrentStep - 1);
      return;
    }

    if (target.closest("[data-doc-flow-next]")) {
      advanceDocFlowStep();
      return;
    }

    if (target.closest("[data-doc-flow-exit]")) {
      exitDocFlowToDashboard();
      return;
    }

    if (target.closest("[data-doc-flow-archive]")) {
      archiveDocFlowOrder();
    }
  }

  function handleDocFlowInput(event) {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) {
      return;
    }

    if (!control.matches("[data-doc-flow-field]") || control.type === "checkbox" || control.type === "radio" || control.type === "file") {
      return;
    }

    updateDocFlowOrderFromControl(control);
    queueDocFlowOrderSave();
    updateDocFlowReactiveBlocks();
    updateDocFlowQuickReferenceDrawer();
  }

  function handleDocFlowChange(event) {
    const control = event.target;
    if (!(control instanceof HTMLInputElement || control instanceof HTMLTextAreaElement || control instanceof HTMLSelectElement)) {
      return;
    }

    if (control.matches("[data-doc-flow-file]")) {
      handleDocFlowFileSelection(control);
      return;
    }

    if (!control.matches("[data-doc-flow-field]")) {
      return;
    }

    if (control.type === "radio" && !control.checked) {
      return;
    }

    updateDocFlowOrderFromControl(control);

    if (control.dataset.docFlowField === "productScheduleRegistered") {
      if (control.checked) {
        showDocFlowFinanceWarningModal();
      } else {
        setDocFlowCheck("financeWarningAcknowledged", false);
      }
    }

    queueDocFlowOrderSave();
    updateDocFlowReactiveBlocks();
    updateDocFlowQuickReferenceDrawer();
  }

  function handleDocFlowSubmit(event) {
    const form = event.target instanceof Element ? event.target.closest("[data-doc-flow-new-form]") : null;
    if (!form) {
      return;
    }

    event.preventDefault();
    createDocFlowOrderFromModal(form);
  }

  function showDocFlowNewOrderModal() {
    const modal = shadowRoot?.querySelector("[data-doc-flow-modal]");
    if (!modal) {
      return;
    }

    modal.innerHTML = `
      <form class="doc-flow-modal__panel" data-doc-flow-new-form>
        <h3 class="doc-flow-modal__title">${escapeHtml(df("newFlowTitle"))}</h3>
        <p class="doc-flow-modal__text">${escapeHtml(df("newFlowText"))}</p>
        <label class="doc-flow-field">
          <span>SC NO.</span>
          <input type="text" autocomplete="off" data-doc-flow-new-sc-no required>
        </label>
        <p class="doc-flow-status" data-doc-flow-modal-status></p>
        <div class="doc-flow-modal__actions">
          <button class="doc-flow__button" type="button" data-doc-flow-modal-close>${escapeHtml(df("cancel"))}</button>
          <button class="doc-flow__button doc-flow__button--primary" type="submit">${escapeHtml(df("create"))}</button>
        </div>
      </form>
    `;
    modal.hidden = false;
    window.setTimeout(() => modal.querySelector("[data-doc-flow-new-sc-no]")?.focus(), 0);
  }

  function showDocFlowFinanceWarningModal() {
    const modal = shadowRoot?.querySelector("[data-doc-flow-modal]");
    if (!modal) {
      return;
    }

    modal.innerHTML = `
      <div class="doc-flow-modal__panel" role="dialog" aria-modal="true">
        <h3 class="doc-flow-modal__title">${escapeHtml(df("financeWarningTitle"))}</h3>
        <p class="doc-flow-modal__text">${escapeHtml(df("financeWarningText"))}</p>
        <div class="doc-flow-modal__actions">
          <button class="doc-flow__button doc-flow__button--primary" type="button" data-doc-flow-finance-ok>${escapeHtml(df("acknowledged"))}</button>
        </div>
      </div>
    `;
    modal.hidden = false;
  }

  function closeDocFlowModal() {
    const modal = shadowRoot?.querySelector("[data-doc-flow-modal]");
    if (!modal) {
      return;
    }

    modal.hidden = true;
    modal.innerHTML = "";
  }

  async function createDocFlowOrderFromModal(form) {
    const input = form.querySelector("[data-doc-flow-new-sc-no]");
    const submitButton = form.querySelector('button[type="submit"]');
    const scNo = sanitizeDocFlowScNo(input?.value);

    if (!scNo) {
      setDocFlowModalStatus(df("invalidScNo"), "error");
      input?.focus();
      return;
    }

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const order = await docFlowStorage.createOrder(scNo);
      closeDocFlowModal();
      await hydrateDocFlowOrder(order.scNo, order.currentStep || 1);
    } catch (error) {
      setDocFlowModalStatus(error.message || df("createFailed"), "error");
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  }

  function setDocFlowModalStatus(message, type = "info") {
    const status = shadowRoot?.querySelector("[data-doc-flow-modal-status]");
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-success", type === "success");
  }

  function updateDocFlowOrderFromControl(control) {
    if (!docFlowOrder) {
      return;
    }

    const key = control.dataset.docFlowField;
    if (!key) {
      return;
    }

    const payload = ensureDocFlowPayload(docFlowOrder);
    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      payload.checks[key] = control.checked;
    } else {
      payload.fields[key] = control.value;
    }

    syncDocFlowOrderSummary();
    docFlowOrder.updatedAt = new Date().toISOString();
  }

  function syncDocFlowOrderSummary() {
    if (!docFlowOrder) {
      return;
    }

    const fields = getDocFlowFields();
    docFlowOrder.customerName = String(fields.customerName || "").trim();
    docFlowOrder.destinationPort = String(fields.destinationPort || "").trim();
    docFlowOrder.etd = String(fields.forwarderEtd || "").trim();
  }

  function setDocFlowCheck(key, value) {
    if (!docFlowOrder) {
      return;
    }

    ensureDocFlowPayload(docFlowOrder).checks[key] = value === true;
    const control = shadowRoot?.querySelector(`[data-doc-flow-field="${escapeCssIdentifier(key)}"]`);
    if (control instanceof HTMLInputElement && control.type === "checkbox") {
      control.checked = value === true;
    }
    updateDocFlowQuickReferenceDrawer();
  }

  function queueDocFlowOrderSave() {
    if (!docFlowOrder) {
      return docFlowSaveQueue;
    }

    const snapshot = cloneDocFlowOrderForSave(docFlowOrder);
    docFlowSaveQueue = docFlowSaveQueue
      .catch(() => {})
      .then(() => docFlowStorage.saveOrder(snapshot))
      .catch((error) => {
        showDocFlowStatus(error.message || df("saveFailed"), "error");
      });

    return docFlowSaveQueue;
  }

  function saveDocFlowOrderNow() {
    queueDocFlowOrderSave();
    return docFlowSaveQueue.catch(() => {});
  }

  async function handleDocFlowFileSelection(input) {
    const [file] = input.files || [];
    input.value = "";

    if (!file || !docFlowOrder) {
      return;
    }

    const slot = input.dataset.docFlowFile;
    if (!DOC_FLOW_FILE_SLOTS.includes(slot)) {
      return;
    }

    const fileRecord = {
      blob: file,
      name: file.name,
      type: file.type,
      size: file.size,
      updatedAt: new Date().toISOString()
    };
    docFlowFiles = {
      ...docFlowFiles,
      scNo: docFlowOrder.scNo,
      [slot]: fileRecord
    };
    setDocFlowObjectUrl(slot, file);
    renderDocFlowFilePreview(slot);
    updateDocFlowQuickReferenceDrawer();

    ensureDocFlowPayload(docFlowOrder).files[slot] = {
      name: fileRecord.name,
      type: fileRecord.type,
      size: fileRecord.size,
      updatedAt: fileRecord.updatedAt
    };
    docFlowOrder.updatedAt = fileRecord.updatedAt;
    queueDocFlowOrderSave();

    docFlowStorage.saveFile(docFlowOrder.scNo, slot, file)
      .then((record) => {
        if (record?.scNo === docFlowOrder?.scNo) {
          docFlowFiles = record;
          renderDocFlowFilePreview(slot);
          updateDocFlowQuickReferenceDrawer();
        }
      })
      .catch((error) => {
        showDocFlowStatus(error.message || df("imageSaveFailed"), "error");
      });
  }

  function renderDocFlowFilePreview(slot) {
    const preview = shadowRoot?.querySelector(`[data-doc-flow-file-preview="${escapeCssIdentifier(slot)}"]`);
    if (!preview) {
      return;
    }

    preview.innerHTML = buildDocFlowFilePreviewHtml(slot);
  }

  function updateDocFlowReactiveBlocks() {
    if (!docFlowOrder) {
      return;
    }

    const root = getDocFlowRoot();
    if (!root) {
      return;
    }

    setDocFlowHidden(root.querySelector('[data-doc-flow-reveal="official-po"]'), !isDocFlowChecked("officialPoReceived"));
    setDocFlowHidden(root.querySelector('[data-doc-flow-reveal="factory-coa"]'), !getDocFlowField("expectedFactoryDispatchDate"));
    setDocFlowHidden(root.querySelector('[data-doc-flow-reveal="hazchem"]'), !isDocFlowChecked("hazardousChemicals"));
    setDocFlowHidden(root.querySelector('[data-doc-flow-reveal="finance-ack"]'), !isDocFlowChecked("productScheduleRegistered"));
    setDocFlowHidden(root.querySelector("[data-doc-flow-critical-banner]"), getDocFlowField("vesselTracking") !== "abnormal");

    const pageThreeControls = root.querySelector("[data-doc-flow-page3-rest]");
    if (pageThreeControls instanceof HTMLFieldSetElement) {
      pageThreeControls.disabled = !isDocFlowChecked("customerLabelCoaConfirmed");
    }

    const nextButton = root.querySelector("[data-doc-flow-next]");
    if (nextButton instanceof HTMLButtonElement) {
      const gateStatus = getDocFlowGateStatus(docFlowCurrentStep);
      nextButton.disabled = docFlowCurrentStep >= 4 || !gateStatus.ok;
      nextButton.title = gateStatus.message;
    }

    const archiveButton = root.querySelector("[data-doc-flow-archive]");
    if (archiveButton instanceof HTMLButtonElement) {
      archiveButton.disabled = !getDocFlowGateStatus(4).ok;
    }
  }

  function setDocFlowHidden(element, shouldHide) {
    if (element) {
      element.hidden = shouldHide;
    }
  }

  function getDocFlowGateStatus(step) {
    if (step === 1) {
      const ok = isDocFlowChecked("officialPoReceived");
      return {
        ok,
        message: ok ? df("canNext") : df("step1Gate")
      };
    }

    if (step === 2) {
      const financeOk = !isDocFlowChecked("productScheduleRegistered") || isDocFlowChecked("financeWarningAcknowledged");
      const ok = isDocFlowChecked("formalLabelAndCoaSent") && financeOk;
      return {
        ok,
        message: ok ? df("canNext") : df("step2Gate")
      };
    }

    if (step === 3) {
      const ok = isDocFlowChecked("customerLabelCoaConfirmed") && isDocFlowChecked("warehouseLabelVerified");
      return {
        ok,
        message: ok ? df("canNext") : df("step3Gate")
      };
    }

    const ok = Boolean(getDocFlowField("dhlNo").trim()) && isDocFlowChecked("dhlNoNotifiedCustomer");
    return {
      ok,
      message: ok ? df("canArchive") : df("step4Gate")
    };
  }

  async function navigateDocFlowStep(step) {
    if (!docFlowOrder) {
      return;
    }

    const targetStep = clampDocFlowStep(step);
    const maxAccessibleStep = Math.max(clampDocFlowStep(docFlowOrder.currentStep), docFlowCurrentStep);
    if (targetStep > maxAccessibleStep) {
      return;
    }

    await saveDocFlowOrderNow();
    hydrateDocFlowOrder(docFlowOrder.scNo, targetStep);
  }

  async function advanceDocFlowStep() {
    if (!docFlowOrder || docFlowCurrentStep >= 4) {
      return;
    }

    const gateStatus = getDocFlowGateStatus(docFlowCurrentStep);
    if (!gateStatus.ok) {
      showDocFlowStatus(gateStatus.message, "error");
      return;
    }

    const nextStep = clampDocFlowStep(docFlowCurrentStep + 1);
    docFlowOrder.currentStep = Math.max(clampDocFlowStep(docFlowOrder.currentStep), nextStep);
    docFlowOrder.updatedAt = new Date().toISOString();
    await saveDocFlowOrderNow();
    hydrateDocFlowOrder(docFlowOrder.scNo, nextStep);
  }

  async function exitDocFlowToDashboard() {
    await saveDocFlowOrderNow();
    await clearDocFlowUiState();
    docFlowOrder = null;
    docFlowFiles = {};
    renderDocFlowDashboard({ loading: true });
    updateDocFlowQuickReferenceDrawer();
    refreshDocFlowDashboardOrders();
  }

  async function deleteDocFlowDashboardOrder(scNo) {
    const normalizedScNo = sanitizeDocFlowScNo(scNo);
    if (!normalizedScNo) {
      return;
    }

    const shouldDelete = window.confirm(df("deleteConfirm", { scNo: normalizedScNo }));
    if (!shouldDelete) {
      return;
    }

    showDocFlowStatus(df("deletingOrder", { scNo: normalizedScNo }));

    try {
      await docFlowStorage.deleteOrder(normalizedScNo);
      if (docFlowOrder?.scNo === normalizedScNo) {
        docFlowOrder = null;
        docFlowFiles = {};
        clearDocFlowFileObjectUrls();
        await clearDocFlowUiState();
      }
      docFlowOrdersList = docFlowOrdersList.filter((order) => order.scNo !== normalizedScNo);
      renderDocFlowDashboard();
      showDocFlowStatus(df("deletedOrder", { scNo: normalizedScNo }), "success");
      refreshDocFlowDashboardOrders();
    } catch (error) {
      showDocFlowStatus(error.message || df("deleteFailed"), "error");
    }
  }

  async function archiveDocFlowOrder() {
    if (!docFlowOrder) {
      return;
    }

    const gateStatus = getDocFlowGateStatus(4);
    if (!gateStatus.ok) {
      showDocFlowStatus(gateStatus.message, "error");
      return;
    }

    await saveDocFlowOrderNow();

    try {
      await docFlowStorage.archiveOrder(docFlowOrder.scNo);
      await clearDocFlowUiState();
      docFlowOrder = null;
      docFlowFiles = {};
      renderDocFlowDashboard({ loading: true });
      updateDocFlowQuickReferenceDrawer();
      refreshDocFlowDashboardOrders();
    } catch (error) {
      showDocFlowStatus(error.message || df("archiveFailed"), "error");
    }
  }

  function showDocFlowStatus(message, type = "info") {
    const status = shadowRoot?.querySelector("[data-doc-flow-status]");
    if (!status) {
      return;
    }

    status.textContent = message;
    status.classList.toggle("is-error", type === "error");
    status.classList.toggle("is-success", type === "success");
  }

  function setDocFlowFiles(filesRecord) {
    clearDocFlowFileObjectUrls();
    docFlowFiles = filesRecord || { scNo: docFlowOrder?.scNo || "" };

    DOC_FLOW_FILE_SLOTS.forEach((slot) => {
      const fileRecord = docFlowFiles?.[slot];
      if (fileRecord?.blob instanceof Blob) {
        setDocFlowObjectUrl(slot, fileRecord.blob);
      }
    });
  }

  function setDocFlowObjectUrl(slot, blob) {
    if (docFlowObjectUrls[slot]) {
      URL.revokeObjectURL(docFlowObjectUrls[slot]);
    }
    docFlowObjectUrls[slot] = URL.createObjectURL(blob);
  }

  function clearDocFlowFileObjectUrls() {
    Object.values(docFlowObjectUrls).forEach((objectUrl) => URL.revokeObjectURL(objectUrl));
    docFlowObjectUrls = {};
  }

  function getDocFlowFields() {
    return docFlowOrder ? ensureDocFlowPayload(docFlowOrder).fields : {};
  }

  function getDocFlowChecks() {
    return docFlowOrder ? ensureDocFlowPayload(docFlowOrder).checks : {};
  }

  function getDocFlowField(key) {
    const value = getDocFlowFields()[key];
    return typeof value === "string" ? value : String(value || "");
  }

  function isDocFlowChecked(key) {
    return getDocFlowChecks()[key] === true;
  }

  function ensureDocFlowPayload(order) {
    if (!order.payload || typeof order.payload !== "object") {
      order.payload = {};
    }
    if (!order.payload.fields || typeof order.payload.fields !== "object") {
      order.payload.fields = {};
    }
    if (!order.payload.checks || typeof order.payload.checks !== "object") {
      order.payload.checks = {};
    }
    if (!order.payload.files || typeof order.payload.files !== "object") {
      order.payload.files = {};
    }
    return order.payload;
  }

  function cloneDocFlowOrderForSave(order) {
    return normalizeDocFlowOrder(JSON.parse(JSON.stringify(order)));
  }

  function createBlankDocFlowOrder(scNo) {
    const now = new Date().toISOString();
    return {
      scNo: sanitizeDocFlowScNo(scNo),
      customerName: "",
      destinationPort: "",
      etd: "",
      currentStep: 1,
      archived: false,
      createdAt: now,
      updatedAt: now,
      payload: {
        fields: {},
        checks: {},
        files: {}
      }
    };
  }

  function normalizeDocFlowOrder(order) {
    const normalizedOrder = {
      ...createBlankDocFlowOrder(order?.scNo || ""),
      ...order
    };
    const payload = ensureDocFlowPayload(normalizedOrder);
    const fields = payload.fields;

    normalizedOrder.scNo = sanitizeDocFlowScNo(normalizedOrder.scNo);
    normalizedOrder.customerName = String(normalizedOrder.customerName || fields.customerName || "").trim();
    normalizedOrder.destinationPort = String(normalizedOrder.destinationPort || fields.destinationPort || "").trim();
    normalizedOrder.etd = String(normalizedOrder.etd || fields.forwarderEtd || "").trim();
    normalizedOrder.currentStep = clampDocFlowStep(normalizedOrder.currentStep);
    normalizedOrder.archived = normalizedOrder.archived === true;
    normalizedOrder.createdAt = normalizedOrder.createdAt || new Date().toISOString();
    normalizedOrder.updatedAt = normalizedOrder.updatedAt || normalizedOrder.createdAt;
    return normalizedOrder;
  }

  function sanitizeDocFlowScNo(value) {
    return String(value || "").trim().replace(/\s+/g, " ").slice(0, 80);
  }

  function clampDocFlowStep(step) {
    const numericStep = Number(step);
    if (!Number.isFinite(numericStep)) {
      return 1;
    }
    return Math.min(4, Math.max(1, Math.round(numericStep)));
  }

  function formatDocFlowTimestamp(value) {
    if (!value) {
      return df("justNow");
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString(currentLanguage === "en" ? "en-US" : "zh-CN", {
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  function formatDocFlowFileSize(bytes) {
    const numericBytes = Number(bytes) || 0;
    if (numericBytes < 1024) {
      return `${numericBytes} B`;
    }
    if (numericBytes < 1024 * 1024) {
      return `${Math.round(numericBytes / 1024)} KB`;
    }
    return `${(numericBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function escapeCssIdentifier(value) {
    if (window.CSS?.escape) {
      return window.CSS.escape(String(value));
    }

    return String(value).replace(/["\\]/g, "\\$&");
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

  async function initializeAutoFillPanel() {
    renderAutoFillPanel();
    const provider = window.CrmGeminiExtractionProvider;
    if (!provider?.getConfig) {
      return;
    }

    try {
      const config = await provider.getConfig();
      const apiKeyInput = shadowRoot.querySelector("[data-auto-fill-api-key]");
      const modelInput = shadowRoot.querySelector("[data-auto-fill-model]");
      const modeSelect = shadowRoot.querySelector("[data-auto-fill-mode]");
      if (apiKeyInput) {
        apiKeyInput.value = config.apiKey || "";
      }
      if (modelInput) {
        modelInput.value = config.model || "gemini-2.5-flash";
      }
      if (modeSelect) {
        modeSelect.value = config.mode || "gemini_pdf_direct";
      }
    } catch (error) {
      setAutoFillStatus(error.message || "Gemini settings could not be loaded.", "error");
    }
  }

  function handleAutoFillClick(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    if (target.closest("[data-auto-fill-load-pdf]")) {
      shadowRoot.querySelector(".automation-pdf-input")?.click();
      return;
    }
    if (target.closest("[data-auto-fill-validate]")) {
      validateAutoFillFields();
      return;
    }
    if (target.closest("[data-auto-fill-fill]")) {
      fillAutoFillFields();
      return;
    }
    if (target.closest("[data-auto-fill-save-mapping]")) {
      saveAutoFillMappings();
      return;
    }
    if (target.closest("[data-auto-fill-save-config]")) {
      saveAutoFillConfig();
    }
  }

  function handleAutoFillChange(event) {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) {
      return;
    }

    if (target.matches(".automation-pdf-input")) {
      const [file] = target.files || [];
      if (file) {
        extractAutoFillPdf(file);
      }
      target.value = "";
      return;
    }

    const key = target.dataset.autoFillInclude || target.dataset.autoFillValue;
    if (!key || !autoFillState.fields[key]) {
      return;
    }

    if (target.dataset.autoFillInclude) {
      autoFillState.fields[key].include = target.checked === true;
    } else {
      autoFillState.fields[key].value = target.value;
      validateAutoFillFields({ silent: true });
    }
    renderAutoFillPanel();
  }

  async function extractAutoFillPdf(file) {
    if (!isPdf(file)) {
      setAutoFillStatus(t("autoFillNoPdf"), "error");
      return;
    }

    autoFillState.rawResponsePreview = "";
    autoFillState.parsedResponsePreview = "";
    renderAutoFillPanel();
    setAutoFillStatus(t("autoFillExtracting"));
    try {
      await loadDocumentFile(file);
      const provider = window.CrmGeminiExtractionProvider;
      if (!provider?.extractFromPdfFile) {
        throw new Error("Gemini extraction provider is not loaded.");
      }

      const extraction = await provider.extractFromPdfFile(file);
      const fields = buildAutoFillFields(extraction);
      autoFillState = {
        extraction,
        fields,
        validations: {},
        matches: [],
        status: t("autoFillExtracted", { count: Object.keys(fields).length }),
        rawResponsePreview: formatAutoFillDebugPayload(extraction.rawResponse),
        parsedResponsePreview: formatAutoFillDebugPayload({
          documentType: extraction.documentType,
          crmFields: extraction.crmFields,
          tradeFields: extraction.tradeFields,
          lineItems: extraction.lineItems,
          warnings: extraction.warnings
        })
      };
      validateAutoFillFields({ silent: true });
      renderAutoFillPanel();
      setAutoFillStatus(autoFillState.status, "success");
    } catch (error) {
      autoFillState.rawResponsePreview = formatAutoFillDebugPayload({
        error: error.message || String(error),
        responseText: error.responseText || "",
        rawResponse: error.rawResponse || null
      });
      autoFillState.parsedResponsePreview = "";
      renderAutoFillPanel();
      setAutoFillStatus(error.message || t("crmAutofillFailed"), "error");
    }
  }

  function buildAutoFillFields(extraction) {
    const fields = {};
    const addField = (key, field, source, crmKey = key) => {
      const value = normalizeText(field?.value ?? "");
      if (!value) {
        return;
      }
      const existing = fields[crmKey];
      const confidence = normalizeAutoFillConfidence(field?.confidence);
      if (existing && existing.confidence > confidence) {
        return;
      }
      fields[crmKey] = {
        key: crmKey,
        sourceKey: key,
        source,
        value,
        pageNo: field?.pageNo ?? null,
        evidence: field?.evidence || "",
        confidence,
        include: confidence >= 0.6
      };
    };

    Object.entries(extraction?.crmFields || {}).forEach(([key, field]) => {
      addField(key, field, "crmFields", key);
    });
    Object.entries(extraction?.tradeFields || {}).forEach(([key, field]) => {
      addField(key, field, "tradeFields", key);
    });
    return fields;
  }

  function validateAutoFillFields(options = {}) {
    const validator = window.CrmAutomationValidator;
    if (!validator?.validateField) {
      setAutoFillStatus("Automation validator is not loaded.", "error");
      return {};
    }

    const validations = {};
    Object.entries(autoFillState.fields).forEach(([key, field]) => {
      const validation = validator.validateField(key, field);
      validations[key] = validation;
      field.validation = validation;
    });
    autoFillState.validations = validations;

    const ready = Object.values(validations).filter((validation) => validation.valid && !validation.reviewRequired).length;
    const review = Object.values(validations).filter((validation) => validation.reviewRequired || !validation.valid).length;
    autoFillState.status = t("autoFillValidated", { ready, review });
    if (!options.silent) {
      setAutoFillStatus(autoFillState.status, review ? "info" : "success");
    }
    renderAutoFillPanel();
    return validations;
  }

  async function fillAutoFillFields() {
    const adapter = window.CrmDomAdapter;
    const audit = window.CrmAutomationAudit;
    if (!adapter?.matchFields || !adapter?.fillFields) {
      setAutoFillStatus("CRM DOM adapter is not loaded.", "error");
      return;
    }

    const validations = Object.keys(autoFillState.validations).length ? autoFillState.validations : validateAutoFillFields({ silent: true });
    const checkedFields = Object.fromEntries(Object.entries(autoFillState.fields).filter(([key, field]) => {
      const validation = validations[key];
      return field.include && validation?.valid && !validation.reviewRequired;
    }).map(([key, field]) => [key, {
      ...field,
      value: field.value,
      confidence: field.confidence
    }]));

    if (!Object.keys(checkedFields).length) {
      setAutoFillStatus(t("autoFillNoFields"), "error");
      return;
    }

    try {
      const mappings = audit?.getMappings ? await audit.getMappings() : {};
      const matches = adapter.matchFields({ fields: checkedFields }, mappings);
      const fillableMatches = matches.filter((match) => match.element);
      const fillStatus = adapter.fillFields(fillableMatches);
      autoFillState.matches = matches;

      const filled = fillStatus.filter((status) => status.status === "filled").length;
      const skipped = Object.keys(checkedFields).length - filled;
      const unmatched = matches.filter((match) => !match.element).length;
      const message = t("autoFillFilled", { filled, skipped, unmatched });

      if (audit?.saveLog) {
        await audit.saveLog({
          documentType: autoFillState.extraction?.documentType || "",
          extractedFields: checkedFields,
          validationResults: validations,
          fillStatus,
          warnings: autoFillState.extraction?.warnings || []
        });
      }

      renderAutoFillPanel();
      setAutoFillStatus(message, filled > 0 ? "success" : "error");
    } catch (error) {
      setAutoFillStatus(error.message || t("crmAutofillFailed"), "error");
    }
  }

  async function saveAutoFillMappings() {
    const audit = window.CrmAutomationAudit;
    if (!audit?.saveMappings) {
      setAutoFillStatus("Automation audit store is not loaded.", "error");
      return;
    }

    const mappings = audit.getMappings ? { ...(await audit.getMappings()) } : {};
    autoFillState.matches.forEach((match) => {
      if (match.key && match.selector) {
        mappings[match.key] = match.selector;
      }
    });

    try {
      await audit.saveMappings(mappings);
      setAutoFillStatus(t("autoFillMappingSaved", { count: Object.keys(mappings).length }), "success");
    } catch (error) {
      setAutoFillStatus(error.message || "Field mappings could not be saved.", "error");
    }
  }

  async function saveAutoFillConfig() {
    const provider = window.CrmGeminiExtractionProvider;
    if (!provider?.saveConfig) {
      setAutoFillStatus("Gemini extraction provider is not loaded.", "error");
      return;
    }

    try {
      await provider.saveConfig({
        apiKey: shadowRoot.querySelector("[data-auto-fill-api-key]")?.value || "",
        model: shadowRoot.querySelector("[data-auto-fill-model]")?.value || "gemini-2.5-flash",
        mode: shadowRoot.querySelector("[data-auto-fill-mode]")?.value || "gemini_pdf_direct"
      });
      setAutoFillStatus(t("autoFillConfigSaved"), "success");
    } catch (error) {
      setAutoFillStatus(error.message || "Gemini settings could not be saved.", "error");
    }
  }

  function renderAutoFillPanel() {
    if (!shadowRoot) {
      return;
    }

    const status = shadowRoot.querySelector("[data-auto-fill-status]");
    if (status) {
      status.textContent = autoFillState.status || t("autoFillEmpty");
    }

    const rawResponse = shadowRoot.querySelector("[data-auto-fill-raw-response]");
    if (rawResponse) {
      rawResponse.textContent = buildAutoFillRawResponseText();
    }

    const review = shadowRoot.querySelector("[data-auto-fill-review]");
    if (!review) {
      return;
    }

    const fields = Object.values(autoFillState.fields);
    if (!fields.length) {
      review.innerHTML = `<p class="automation-review__empty">${escapeHtml(t("autoFillEmpty"))}</p>`;
      return;
    }

    review.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>${escapeHtml(t("autoFillInclude"))}</th>
            <th>${escapeHtml(t("autoFillField"))}</th>
            <th>${escapeHtml(t("autoFillValue"))}</th>
            <th>${escapeHtml(t("autoFillConfidence"))}</th>
            <th>${escapeHtml(t("autoFillRisk"))}</th>
            <th>${escapeHtml(t("autoFillValidation"))}</th>
          </tr>
        </thead>
        <tbody>
          ${fields.map((field) => renderAutoFillRow(field)).join("")}
        </tbody>
      </table>
    `;
  }

  function renderAutoFillRow(field) {
    const validation = field.validation || autoFillState.validations[field.key] || {};
    const risk = validation.riskLevel || "low";
    const validationText = validation.valid && !validation.reviewRequired
      ? t("autoFillReady")
      : `${t("autoFillReview")}${validation.issues?.length ? `: ${validation.issues.join(", ")}` : ""}`;
    return `
      <tr>
        <td><input type="checkbox" data-auto-fill-include="${escapeHtml(field.key)}"${field.include ? " checked" : ""}></td>
        <td>${escapeHtml(field.key)}</td>
        <td><input class="quick-links__input" type="text" value="${escapeHtml(field.value)}" data-auto-fill-value="${escapeHtml(field.key)}"></td>
        <td>${escapeHtml(formatPercent(field.confidence))}</td>
        <td>${escapeHtml(translateAutoFillRisk(risk))}</td>
        <td>${escapeHtml(validationText)}</td>
      </tr>
    `;
  }

  function setAutoFillStatus(message, type = "info") {
    autoFillState.status = message;
    const status = shadowRoot?.querySelector("[data-auto-fill-status]");
    if (!status) {
      return;
    }
    status.className = `status${type === "success" ? " status--success" : type === "error" ? " status--error" : ""}`;
    status.textContent = message;
  }

  function buildAutoFillRawResponseText() {
    const sections = [];
    if (autoFillState.rawResponsePreview) {
      sections.push(`RAW GEMINI RESPONSE\n${autoFillState.rawResponsePreview}`);
    }
    if (autoFillState.parsedResponsePreview) {
      sections.push(`\nPARSED EXTRACTION\n${autoFillState.parsedResponsePreview}`);
    }
    return sections.join("\n\n").trim() || t("autoFillRawResponseEmpty");
  }

  function formatAutoFillDebugPayload(payload) {
    if (payload == null || payload === "") {
      return "";
    }
    if (typeof payload === "string") {
      return payload;
    }
    try {
      return JSON.stringify(payload, null, 2);
    } catch (error) {
      return String(payload);
    }
  }

  function translateAutoFillRisk(risk) {
    if (risk === "high") {
      return t("autoFillHigh");
    }
    if (risk === "medium") {
      return t("autoFillMedium");
    }
    return t("autoFillLow");
  }

  function normalizeAutoFillConfidence(value) {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : 0;
  }

  function formatPercent(value) {
    const number = Number(value);
    return Number.isFinite(number) ? `${Math.round(number * 100)}%` : "0%";
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

    scheduleCrmHorizontalScrollbarUpdate();

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
    scheduleCrmHorizontalScrollbarUpdate();
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
      <div class="preview-window pdf-preview-window" contenteditable="false">
        <iframe class="pdf-preview" src="${fileUrl}" title="${escapeHtml(t("pdfPreviewTitle"))}" data-pdf-preview-url="${fileUrl}"></iframe>
      </div>
      <div class="preview-resize-handle" contenteditable="false" role="separator" aria-label="${escapeHtml(t("resizePreview"))}" aria-orientation="horizontal" tabindex="0"></div>
      <p class="status">${escapeHtml(t("pdfLoaded"))}</p>
      <p class="status" data-pdf-extract-status>${escapeHtml(t("pdfExtracting"))}</p>
      <section class="pdf-text-extract" contenteditable="true" data-pdf-extract-text data-placeholder="${escapeHtml(t("typeNotes"))}" aria-label="${escapeHtml(t("typeNotes"))}"></section>
      <p>${escapeHtml(t("typeNotes"))}</p>
    `;
    applyStoredPreviewHeight();
    bindPreviewResize();
    extractAndRenderPdfText(file, fileUrl);
  }

  async function extractAndRenderPdfText(file, fileUrl) {
    const editor = shadowRoot?.querySelector(".editor");
    const status = editor?.querySelector("[data-pdf-extract-status]");
    const textContainer = editor?.querySelector("[data-pdf-extract-text]");

    if (!editor || !status || !textContainer) {
      return;
    }

    try {
      const extractedText = await extractTextFromPdfFile(file);
      if (selectedFile !== file || editor.querySelector("[data-pdf-preview-url]")?.dataset.pdfPreviewUrl !== fileUrl) {
        return;
      }

      if (!extractedText) {
        status.textContent = t("pdfExtractNoText");
        status.classList.add("status--error");
        return;
      }

      textContainer.textContent = extractedText;
      status.textContent = t("pdfExtracted");
      status.classList.add("status--success");
    } catch (error) {
      if (selectedFile !== file) {
        return;
      }

      status.textContent = t("pdfExtractFailed", { message: error.message || "unknown error" });
      status.classList.add("status--error");
    }
  }

  async function extractTextFromPdfFile(file) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const streamText = await extractTextFromPdfStreams(bytes);
    return normalizePdfExtractedText(streamText);
  }

  async function extractTextFromPdfStreams(pdfBytes) {
    const streams = findPdfStreams(pdfBytes);
    const textParts = [];

    for (const stream of streams) {
      if (isLikelyPdfImageStream(stream.dictionary)) {
        continue;
      }

      let decodedBytes = null;
      try {
        decodedBytes = await decodePdfStreamBytes(stream.bytes, stream.dictionary);
      } catch (error) {
        decodedBytes = null;
      }
      if (!decodedBytes) {
        continue;
      }

      const streamSource = bytesToBinaryString(decodedBytes);
      if (!isLikelyPdfTextContentStream(streamSource)) {
        continue;
      }

      const streamText = extractTextFromPdfContentStream(streamSource);
      if (streamText) {
        textParts.push(streamText);
      }
    }

    return textParts.join("\n");
  }

  function findPdfStreams(pdfBytes) {
    const pdfSource = bytesToBinaryString(pdfBytes);
    const streams = [];
    let searchIndex = 0;

    while (searchIndex < pdfSource.length) {
      const streamIndex = pdfSource.indexOf("stream", searchIndex);
      if (streamIndex < 0) {
        break;
      }

      let dataStart = streamIndex + "stream".length;
      if (pdfBytes[dataStart] === 13 && pdfBytes[dataStart + 1] === 10) {
        dataStart += 2;
      } else if (pdfBytes[dataStart] === 10 || pdfBytes[dataStart] === 13) {
        dataStart += 1;
      }

      const endStreamIndex = pdfSource.indexOf("endstream", dataStart);
      if (endStreamIndex < 0) {
        break;
      }

      const dictionary = getPdfStreamDictionary(pdfSource, streamIndex);
      const dataEnd = trimPdfStreamEnd(pdfBytes, dataStart, endStreamIndex);
      streams.push({
        dictionary,
        bytes: pdfBytes.slice(dataStart, dataEnd)
      });
      searchIndex = endStreamIndex + "endstream".length;
    }

    return streams;
  }

  function getPdfStreamDictionary(pdfSource, streamIndex) {
    const dictionaryStart = pdfSource.lastIndexOf("<<", streamIndex);
    const dictionaryEnd = pdfSource.lastIndexOf(">>", streamIndex);
    if (dictionaryStart < 0 || dictionaryEnd < dictionaryStart) {
      return "";
    }

    return pdfSource.slice(dictionaryStart, dictionaryEnd + 2);
  }

  function trimPdfStreamEnd(pdfBytes, dataStart, endStreamIndex) {
    let dataEnd = endStreamIndex;
    while (dataEnd > dataStart && (pdfBytes[dataEnd - 1] === 10 || pdfBytes[dataEnd - 1] === 13)) {
      dataEnd -= 1;
    }
    return dataEnd;
  }

  function isLikelyPdfImageStream(dictionary) {
    return /\/Subtype\s*\/Image\b/i.test(dictionary) || /\/ImageMask\s+true\b/i.test(dictionary);
  }

  async function decodePdfStreamBytes(bytes, dictionary) {
    const filters = getPdfStreamFilters(dictionary);
    let decodedBytes = bytes;

    for (const filter of filters) {
      if (/^FlateDecode$/i.test(filter) || /^Fl$/i.test(filter)) {
        decodedBytes = await inflatePdfBytes(decodedBytes);
      } else if (/^ASCIIHexDecode$/i.test(filter) || /^AHx$/i.test(filter)) {
        decodedBytes = decodeAsciiHexPdfBytes(decodedBytes);
      } else if (/^ASCII85Decode$/i.test(filter) || /^A85$/i.test(filter)) {
        decodedBytes = decodeAscii85PdfBytes(decodedBytes);
      } else {
        return null;
      }
    }

    return decodedBytes;
  }

  function getPdfStreamFilters(dictionary) {
    const filterMatch = String(dictionary || "").match(/\/Filter\s*(\[[^\]]+\]|\/[A-Za-z0-9]+)/i);
    if (!filterMatch) {
      return [];
    }

    return Array.from(filterMatch[1].matchAll(/\/([A-Za-z0-9]+)/g)).map((match) => match[1]);
  }

  async function inflatePdfBytes(bytes) {
    if (typeof DecompressionStream !== "function") {
      throw new Error("PDF Flate streams are not supported in this browser");
    }

    const formats = ["deflate", "deflate-raw"];
    for (const format of formats) {
      try {
        const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(format));
        return new Uint8Array(await new Response(stream).arrayBuffer());
      } catch (error) {
        // Some PDFs use zlib-wrapped deflate while others use raw deflate.
      }
    }

    throw new Error("Unable to decompress PDF stream");
  }

  function decodeAsciiHexPdfBytes(bytes) {
    const hex = bytesToBinaryString(bytes).replace(/>.*/s, "").replace(/[^0-9a-f]/gi, "");
    const normalizedHex = hex.length % 2 === 0 ? hex : `${hex}0`;
    const output = new Uint8Array(normalizedHex.length / 2);

    for (let index = 0; index < normalizedHex.length; index += 2) {
      output[index / 2] = parseInt(normalizedHex.slice(index, index + 2), 16);
    }

    return output;
  }

  function decodeAscii85PdfBytes(bytes) {
    const source = bytesToBinaryString(bytes).replace(/^<~/, "").replace(/~>[\s\S]*$/, "");
    const output = [];
    let group = [];

    for (const character of source) {
      if (/\s/.test(character)) {
        continue;
      }

      if (character === "z" && group.length === 0) {
        output.push(0, 0, 0, 0);
        continue;
      }

      const code = character.charCodeAt(0);
      if (code < 33 || code > 117) {
        continue;
      }

      group.push(code - 33);
      if (group.length === 5) {
        appendAscii85Group(output, group, 4);
        group = [];
      }
    }

    if (group.length > 0) {
      const expectedBytes = group.length - 1;
      while (group.length < 5) {
        group.push(84);
      }
      appendAscii85Group(output, group, expectedBytes);
    }

    return new Uint8Array(output);
  }

  function appendAscii85Group(output, group, byteCount) {
    let value = 0;
    group.forEach((digit) => {
      value = (value * 85) + digit;
    });

    const bytes = [
      (value >>> 24) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 8) & 0xff,
      value & 0xff
    ];
    output.push(...bytes.slice(0, byteCount));
  }

  function extractTextFromPdfContentStream(source) {
    const textObjects = source.match(/\bBT\b[\s\S]*?\bET\b/g) || [];
    return filterReadablePdfTextLines(
      textObjects.map(extractTextFromPdfTextObject).filter(Boolean).join("\n")
    );
  }

  function isLikelyPdfTextContentStream(source) {
    return /\bBT\b[\s\S]*?\bET\b/.test(source) && /\b(?:Tj|TJ|Tf|Td|TD|Tm|T\*)\b/.test(source);
  }

  function extractTextFromPdfTextObject(source) {
    const parts = [];
    let index = 0;

    while (index < source.length) {
      const character = source[index];

      if (character === "(") {
        const literal = readPdfLiteralString(source, index);
        if (literal.value) {
          parts.push(literal.value);
        }
        index = literal.nextIndex;
        continue;
      }

      if (character === "<" && source[index + 1] !== "<") {
        const hexEnd = source.indexOf(">", index + 1);
        if (hexEnd > index) {
          const decoded = decodePdfHexString(source.slice(index + 1, hexEnd));
          if (decoded) {
            parts.push(decoded);
          }
          index = hexEnd + 1;
          continue;
        }
      }

      if (source.startsWith("T*", index) || source.startsWith("Td", index) || source.startsWith("TD", index)) {
        parts.push("\n");
        index += 2;
        continue;
      }

      index += 1;
    }

    return normalizePdfExtractedText(parts.join("\n"));
  }

  function readPdfLiteralString(source, startIndex) {
    let value = "";
    let depth = 1;
    let index = startIndex + 1;

    while (index < source.length && depth > 0) {
      const character = source[index];

      if (character === "\\") {
        const escaped = readPdfEscapedCharacter(source, index);
        value += escaped.value;
        index = escaped.nextIndex;
        continue;
      }

      if (character === "(") {
        depth += 1;
        value += character;
        index += 1;
        continue;
      }

      if (character === ")") {
        depth -= 1;
        if (depth > 0) {
          value += character;
        }
        index += 1;
        continue;
      }

      value += character;
      index += 1;
    }

    return {
      value: decodePdfBinaryString(value),
      nextIndex: index
    };
  }

  function readPdfEscapedCharacter(source, slashIndex) {
    const nextCharacter = source[slashIndex + 1];
    if (!nextCharacter) {
      return { value: "", nextIndex: slashIndex + 1 };
    }

    const escapes = {
      n: "\n",
      r: "\r",
      t: "\t",
      b: "\b",
      f: "\f",
      "(": "(",
      ")": ")",
      "\\": "\\"
    };

    if (Object.prototype.hasOwnProperty.call(escapes, nextCharacter)) {
      return { value: escapes[nextCharacter], nextIndex: slashIndex + 2 };
    }

    if (nextCharacter === "\r" || nextCharacter === "\n") {
      let nextIndex = slashIndex + 2;
      if (nextCharacter === "\r" && source[nextIndex] === "\n") {
        nextIndex += 1;
      }
      return { value: "", nextIndex };
    }

    const octalMatch = source.slice(slashIndex + 1, slashIndex + 4).match(/^[0-7]{1,3}/);
    if (octalMatch) {
      return {
        value: String.fromCharCode(parseInt(octalMatch[0], 8)),
        nextIndex: slashIndex + 1 + octalMatch[0].length
      };
    }

    return { value: nextCharacter, nextIndex: slashIndex + 2 };
  }

  function decodePdfHexString(hexValue) {
    const hex = String(hexValue || "").replace(/[^0-9a-f]/gi, "");
    if (!hex) {
      return "";
    }

    const normalizedHex = hex.length % 2 === 0 ? hex : `${hex}0`;
    const bytes = new Uint8Array(normalizedHex.length / 2);
    for (let index = 0; index < normalizedHex.length; index += 2) {
      bytes[index / 2] = parseInt(normalizedHex.slice(index, index + 2), 16);
    }

    return decodePdfStringBytes(bytes);
  }

  function decodePdfBinaryString(value) {
    const bytes = new Uint8Array(value.length);
    for (let index = 0; index < value.length; index += 1) {
      bytes[index] = value.charCodeAt(index) & 0xff;
    }
    return decodePdfStringBytes(bytes);
  }

  function decodePdfStringBytes(bytes) {
    if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
      return decodeUtf16Be(bytes.slice(2));
    }

    if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
      return new TextDecoder("utf-16le").decode(bytes.slice(2));
    }

    const hasUtf16BePattern = bytes.length >= 4 && bytes.length % 2 === 0 && bytes.slice(0, 12).some((byte, index) => index % 2 === 0 && byte === 0);
    if (hasUtf16BePattern) {
      return decodeUtf16Be(bytes);
    }

    try {
      return new TextDecoder("windows-1252").decode(bytes);
    } catch (error) {
      return bytesToBinaryString(bytes);
    }
  }

  function decodeUtf16Be(bytes) {
    let text = "";
    for (let index = 0; index + 1 < bytes.length; index += 2) {
      text += String.fromCharCode((bytes[index] << 8) | bytes[index + 1]);
    }
    return text;
  }

  function filterReadablePdfTextLines(text) {
    return normalizePdfExtractedText(text)
      .split("\n")
      .map((line) => line.trim())
      .filter(isReadablePdfTextLine)
      .join("\n");
  }

  function isReadablePdfTextLine(line) {
    const text = normalizeText(line);
    if (text.length < 2 || /%PDF|endobj|xref|trailer|\/Filter|\/FlateDecode/i.test(text)) {
      return false;
    }

    const meaningfulCharacters = text.match(/[A-Za-z0-9\u4e00-\u9fa5]/g) || [];
    if (meaningfulCharacters.length < Math.min(2, text.length)) {
      return false;
    }

    const suspiciousCharacters = text.match(/[^A-Za-z0-9\u4e00-\u9fa5\s.,:;#()/\\&+%$@'"!?=_\-*[\]]/g) || [];
    const suspiciousRatio = suspiciousCharacters.length / Math.max(text.length, 1);
    if (suspiciousRatio > 0.08) {
      return false;
    }

    const readableCharacters = text.match(/[A-Za-z0-9\u4e00-\u9fa5\s.,:;#()/\\&+%$@'"!?=_\-*[\]]/g) || [];
    return readableCharacters.length / Math.max(text.length, 1) >= 0.82;
  }

  function normalizePdfExtractedText(text) {
    return String(text || "")
      .replace(/\u0000/g, "")
      .replace(/[\u0001-\u0008\u000b\u000e-\u001f\u007f]+/g, " ")
      .replace(/[ \t\f\v]+/g, " ")
      .replace(/\s+\n/g, "\n")
      .replace(/\n\s+/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function bytesToBinaryString(bytes) {
    const chunkSize = 0x8000;
    let text = "";
    for (let index = 0; index < bytes.length; index += chunkSize) {
      text += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }
    return text;
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
    const keys = calculationType === "purchase" ? PURCHASE_CALCULATED_HEADER_KEYS : FINANCIAL_CALCULATED_HEADER_KEYS;
    return keys.map((key) => t(key));
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
    const netProfitColumn = headers.findIndex((header) => isTranslatedCalculatedHeader(header, "netProfit"));
    const totalProfitColumn = headers.findIndex((header) => isTranslatedCalculatedHeader(header, "totalProfit"));
    const exchangeRatioColumn = headers.findIndex((header) => isTranslatedCalculatedHeader(header, "exchangeTaxRatio"));
    const taxRebateColumn = headers.reduce((foundIndex, header, columnIndex) => {
      return isTranslatedCalculatedHeader(header, "taxRebateAmount") && columnIndex > 27 ? columnIndex : foundIndex;
    }, -1);

    if ([netProfitColumn, taxRebateColumn, totalProfitColumn, exchangeRatioColumn].every((columnIndex) => columnIndex >= 0)) {
      return [netProfitColumn, taxRebateColumn, totalProfitColumn, exchangeRatioColumn];
    }

    return null;
  }

  function isTranslatedCalculatedHeader(normalizedHeaderValue, key) {
    return ["zh", "en"].some((language) => {
      const label = TRANSLATIONS[language]?.[key];
      return label && normalizedHeaderValue === normalizeHeader(label);
    });
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
      { key: "signDate", crmLabel: "签订日期", labels: ["签订日期", "合同日期", "日期", "Purchase Order Date", "Order Date", "PO Date", "PODate", "SC Date", "Date"], type: "date" },
      { key: "customerOrderNo", crmLabel: "客户订单号", labels: ["客户订单号", "客户单号", "订单号", "Purchase Order Number", "Purchase Order No", "Purchase Order", "PO Number", "PONumber", "PO No", "P.O. No", "P/O No", "PO #", "Order No"], type: "poNo" },
      { key: "quoteNo", crmLabel: "报价单号", labels: ["报价单号", "报价号", "Quotation Number", "Quotation No", "Quote No"] },
      { key: "purchaseSaleMode", crmLabel: "购销方式", labels: ["购销方式", "采购销售方式", "Purchase/Sales Mode"], required: true },
      { key: "customer", crmLabel: "客户", labels: ["客户", "买方", "Bill To", "Sold To", "Invoice To", "Buyer", "Customer", "Consignee", "Importer"], required: true },
      { key: "country", crmLabel: "国别地区", labels: ["国别地区", "国家地区", "目的国", "客户国家", "Country"], required: true },
      { key: "contact", crmLabel: "联系人", labels: ["联系人", "Contact", "Attn", "Attention"] },
      { key: "currency", crmLabel: "币种", labels: ["币种", "货币", "Currency", "Curr."], type: "currency", required: true },
      { key: "exchangeRate", crmLabel: "汇率", labels: ["汇率", "Exchange Rate", "Ex. Rate"], type: "number", required: true },
      { key: "contractAmount", crmLabel: "合同总金额", labels: ["合同总金额", "合同金额", "总金额", "Grand Total", "Total Amount", "Order Value", "Net Value", "Contract Amount"], type: "money", required: true },
      { key: "usdAmount", crmLabel: "美元总金额", labels: ["美元总金额", "USD Amount", "Total USD"], type: "money", required: true },
      { key: "paymentMethod", crmLabel: "付款方法", labels: ["付款方法", "付款方式", "Payment Terms", "Payment Method", "Terms of Payment"], required: true },
      { key: "deliveryTerm", crmLabel: "交货期限", labels: ["交货期限", "交货期", "Delivery Schedule", "Delivery Date", "Delivery Time", "Delivery Term", "Shipment Time"] },
      { key: "transportMode", crmLabel: "运输方式", labels: ["运输方式", "Transport", "Transportation", "Shipment By", "Mode of Transport", "Ship Via"], type: "transport", required: true },
      { key: "loadingPort", crmLabel: "装运港", labels: ["装运港", "起运港", "Port of Loading", "Loading Port", "Port of Shipment", "POL"] },
      { key: "destinationPort", crmLabel: "目的港", labels: ["目的港", "卸货港", "Dest. Port", "Dest Port", "Port of Destination", "Destination Port", "POD", "Port of Discharge", "Discharge Port"], required: true },
      { key: "loadingCountry", crmLabel: "装运港国家(地区)", labels: ["装运港国家", "起运国", "Country of Loading"] },
      { key: "destinationCountry", crmLabel: "目的港国家(地区)", labels: ["目的港国家", "目的国", "Destination Country"] },
      { key: "destination", crmLabel: "目的地", labels: ["目的地", "Place of Delivery", "Final Destination", "Destination"] },
      { key: "tradeTerm", crmLabel: "成交方式", labels: ["成交方式", "贸易术语", "Trade Term", "Inco Terms", "Incoterms", "Price Term"], type: "tradeTerm", required: true },
      { key: "overfillRate", crmLabel: "溢装率", labels: ["溢装率", "溢短装", "More or Less", "Tolerance"], type: "percent", required: true },
      { key: "shortfallRate", crmLabel: "短装率", labels: ["短装率", "Shortfall Rate", "Tolerance"], type: "percent", required: true },
      { key: "shippingMark", crmLabel: "唛头", labels: ["唛头", "Shipping Mark", "Marks"] },
      { key: "remark", crmLabel: "备注", labels: ["备注", "Remark", "Remarks", "Notes"] },
      { key: "productName", crmLabel: "商品", labels: ["商品", "商品名称", "产品名称", "品名", "Description of Goods", "Goods Description", "Material Description", "Item Description", "Product", "Product Name", "Description"], required: true },
      { key: "casNo", crmLabel: "CAS NO", labels: ["CAS NO", "CAS No.", "CAS", "CAS号"] },
      { key: "customsScNo", crmLabel: "报关SC NO", labels: ["报关SC NO", "报关SC号", "Sales Contract Number", "Sales Contract No.", "SC NO"] },
      { key: "quantity", crmLabel: "数量", labels: ["数量", "合同数量", "Quantity Ordered", "Ordered Qty", "Quantity", "Qty"], type: "number", required: true },
      { key: "unit", crmLabel: "单位", labels: ["单位", "UOM", "Unit"], type: "unit", required: true },
      { key: "unitPrice", crmLabel: "单价", labels: ["单价", "销售单价", "Unit Price", "Price/Unit", "Unit Rate", "Rate", "Price"], type: "money", required: true },
      { key: "productAmount", crmLabel: "商品金额", labels: ["商品金额", "销售金额", "Line Amount", "Line Total", "Net Amount"], type: "money", required: true }
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
    const labels = [...definition.labels].sort((first, second) => second.length - first.length);

    for (const label of labels) {
      const escapedLabel = escapeRegExp(label);
      const patterns = [
        new RegExp(`(?:^|[\\n|;,，；])\\s*${escapedLabel}\\s*(?:[:：]|\\|)\\s*([^\\n|;,，；]{1,120})`, "i"),
        new RegExp(`(?:^|[\\n|;,，；])\\s*${escapedLabel}\\s*(?:[:：]|\\|)?\\s*\\n\\s*([^\\n|;,，；]{1,120})`, "i"),
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
    const normalizedValue = normalizeText(value);
    if (/^[\u4e00-\u9fa5A-Za-z /().#-]{1,32}[：:]$/.test(normalizedValue)) {
      return true;
    }

    return getKnownCrmLabelAliases().some((label) => {
      return new RegExp(`^${escapeRegExp(label)}\\s*(?:[:：]|\\|)`, "i").test(normalizedValue);
    });
  }

  function getKnownCrmLabelAliases() {
    return getCrmFieldDefinitions().flatMap((definition) => {
      return [definition.crmLabel, ...definition.labels];
    }).filter(Boolean);
  }

  function normalizeExtractedFieldValue(value, definition) {
    const cleaned = cleanExtractedValue(value);

    if (definition.type === "date") {
      const dateMatch = cleaned.match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
      if (dateMatch) {
        return `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`;
      }

      const dayFirstDateMatch = cleaned.match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dayFirstDateMatch) {
        return `${dayFirstDateMatch[3]}-${dayFirstDateMatch[2].padStart(2, "0")}-${dayFirstDateMatch[1].padStart(2, "0")}`;
      }
    }

    if (definition.type === "money" || definition.type === "number") {
      const numericMatch = cleaned.match(/[-+]?\d[\d,]*(?:\.\d+)?/);
      return numericMatch ? numericMatch[0].replace(/,/g, "") : "";
    }

    if (definition.type === "percent") {
      const percentMatch = cleaned.match(/[-+]?\d+(?:\.\d+)?/);
      return percentMatch ? `${percentMatch[0]}%` : "";
    }

    if (definition.type === "currency") {
      const currencyMatch = cleaned.match(/\b(USD|EUR|CNY|RMB|JPY|GBP|INR)\b/i);
      return currencyMatch ? currencyMatch[1].toUpperCase().replace("RMB", "CNY") : cleaned;
    }

    if (definition.type === "unit") {
      const unitMatch = cleaned.match(/\b(KGS?|KILOGRAMS?|MT|MTS|TONS?|PCS?|PIECES?)\b/i);
      if (!unitMatch) {
        return cleaned;
      }

      const normalizedUnit = unitMatch[1].toUpperCase();
      if (/^KG/.test(normalizedUnit) || normalizedUnit === "KILOGRAM" || normalizedUnit === "KILOGRAMS") {
        return "KGS";
      }
      if (/^MT|^TON/.test(normalizedUnit)) {
        return "MTS";
      }
      if (/^PC|^PIECE/.test(normalizedUnit)) {
        return "PCS";
      }
      return normalizedUnit;
    }

    if (definition.type === "poNo") {
      const poMatch = cleaned.match(/[A-Z0-9][A-Z0-9/._-]{2,60}/i);
      return poMatch ? poMatch[0] : cleaned;
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
    if (fields.customer && (isOwnCompanyName(fields.customer.value) || looksLikeAnotherLabel(fields.customer.value))) {
      delete fields.customer;
    }

    if (!fields.customer) {
      const customerCandidate = extractCustomerCandidateFromText(text);
      if (customerCandidate) {
        fields.customer = { label: "客户", value: customerCandidate };
      }
    }

    if (!fields.customerOrderNo) {
      const customerOrderNo = extractFirstMatchingText(text, [
        /(?:Purchase\s*Order\s*(?:Number|No\.?|#)|P\.?\s*O\.?\s*(?:Number|No\.?|#)|P\/O\s*(?:Number|No\.?|#)|PO\s*#|Order\s*No\.?)\s*[:：#|\-]?\s*([A-Z0-9][A-Z0-9/._-]{2,60})/i
      ]);
      if (customerOrderNo) {
        fields.customerOrderNo = { label: "客户订单号", value: customerOrderNo };
      }
    }

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
      const amount = extractFirstMatchingText(text, [
        /(?:Grand\s+Total|Total\s+Amount|Order\s+Value|Total\s+Value|Net\s+Value|Contract\s+Amount)\D{0,80}(?:USD|US\$|\$)?\s*([\d,]+(?:\.\d{1,4})?)/i,
        /(?:USD|US\$|\$)\s*([\d,]+(?:\.\d{1,4})?)\s*(?:Grand\s+Total|Total\s+Amount|Order\s+Value|Total\s+Value|Net\s+Value)?/i
      ]);
      if (amount) {
        fields.contractAmount = { label: "合同总金额", value: amount.replace(/,/g, "") };
        fields.usdAmount = fields.usdAmount || { label: "美元总金额", value: fields.contractAmount.value };
        fields.productAmount = fields.productAmount || { label: "商品金额", value: fields.contractAmount.value };
      }
    }

    if (!fields.signDate) {
      const dateMatch = text.match(/(?:^|[^\d])(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})(?:日)?(?:[^\d]|$)/)
        || text.match(/(?:^|[^\d])(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})(?:[^\d]|$)/);
      if (dateMatch && dateMatch[1].length === 4) {
        fields.signDate = {
          label: "签订日期",
          value: `${dateMatch[1]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[3].padStart(2, "0")}`
        };
      } else if (dateMatch) {
        fields.signDate = {
          label: "签订日期",
          value: `${dateMatch[3]}-${dateMatch[2].padStart(2, "0")}-${dateMatch[1].padStart(2, "0")}`
        };
      }
    }

    if (!fields.country && /\b(?:Punjab|Mohali|Chandigarh|Nhava\s+Sheva|Nava\s+Sheva)\b/i.test(text)) {
      fields.country = { label: "国别地区", value: "印度" };
    }

    if (!fields.destinationCountry && /\b(?:Punjab|Mohali|Chandigarh|Nhava\s+Sheva|Nava\s+Sheva)\b/i.test(text)) {
      fields.destinationCountry = { label: "目的港国家(地区)", value: "India" };
    }

    if (!fields.transportMode && /\b(?:Sea\s+Port|Port\s+Of\s+Loading|Dest\.?\s+Port|BOL)\b/i.test(text)) {
      fields.transportMode = { label: "运输方式", value: "By Sea" };
    }

    if (!fields.customsScNo) {
      const salesContract = extractFirstMatchingText(text, [
        /(?:Sales\s+Contract\s+Number|Sales\s+Contract\s+No\.?)\s*[:：|]\s*((?:YS|DC|YSDC)-[A-Z0-9]{2,8}\d{8})/i
      ]);
      if (salesContract) {
        fields.customsScNo = { label: "报关SC NO", value: salesContract };
      }
    }

    if (!fields.quantity) {
      const quantityMatch = text.match(/\b([\d,]+(?:\.\d+)?)\s*(KGS?|KG|KILOGRAMS?|MT|MTS|TONS?|PCS?|PIECES?|千克)\b/i);
      if (quantityMatch) {
        fields.quantity = { label: "数量", value: quantityMatch[1].replace(/,/g, "") };
        fields.unit = fields.unit || { label: "单位", value: normalizeUnitValue(quantityMatch[2]) };
      }
    }

    if (!fields.productName) {
      const productName = extractFirstMatchingText(text, [
        /(?:Description\s+of\s+Goods|Goods\s+Description|Material\s+Description|Item\s+Description|Product\s+Name)\s*(?:[:：|])?\s*\n\s*([^\n]{2,120})/i,
        /\b\d+(?:\.\d+)?\s*(?:KGS?|KG|千克)\s+(.{2,80}?)(?:\s+(?:YS|DC|YSDC)-|\s+H\d|\s+\d{2}[./-]\d{2}|$)/i,
        /Material\s+Description[^\n]*\n\s*([^\n]{2,80})/i
      ]);
      if (productName && !/\b(?:prompt|june|shipment|confirmation)\b/i.test(productName)) {
        fields.productName = { label: "商品", value: productName };
      }
    }

    if (!fields.unitPrice) {
      const unitPrice = extractFirstMatchingText(text, [
        /(?:Unit\s*Price|Price\s*\/\s*Unit|Unit\s*Rate)\D{0,40}(?:USD|US\$|\$)?\s*([\d,]+(?:\.\d{1,6})?)/i,
        /\b[\d,]+(?:\.\d+)?\s*(?:KGS?|KG|MT|MTS|TONS?|PCS?)\b[^\n]{0,80}?(?:USD|US\$|\$)?\s*([\d,]+(?:\.\d{1,6})?)\s*(?:\/\s*(?:KG|KGS|MT|MTS|PC|PCS))?/i
      ]);
      if (unitPrice) {
        fields.unitPrice = { label: "单价", value: unitPrice.replace(/,/g, "") };
      }
    }

    if (!fields.unitPrice && fields.quantity?.value && fields.productAmount?.value) {
      const quantity = parseDecimalInput(fields.quantity.value);
      const amount = parseDecimalInput(fields.productAmount.value);
      if (quantity > 0 && amount > 0) {
        fields.unitPrice = { label: "单价", value: formatPlainNumber(amount / quantity, 6) };
      }
    }

    if (!fields.productAmount && fields.quantity?.value && fields.unitPrice?.value) {
      const quantity = parseDecimalInput(fields.quantity.value);
      const unitPrice = parseDecimalInput(fields.unitPrice.value);
      if (quantity > 0 && unitPrice > 0) {
        const amount = quantity * unitPrice;
        fields.productAmount = { label: "商品金额", value: formatPlainNumber(amount, 2) };
        fields.contractAmount = fields.contractAmount || { label: "合同总金额", value: fields.productAmount.value };
        fields.usdAmount = fields.usdAmount || { label: "美元总金额", value: fields.productAmount.value };
      }
    }
  }

  function extractCustomerCandidateFromText(text) {
    const lines = text.split("\n").map(cleanCompanyCandidate).filter(Boolean);
    const customerLabelPattern = /^(?:客户|买方|Bill\s*To|Sold\s*To|Invoice\s*To|Buyer|Customer|Consignee|Importer)\b\s*[:：|\-]?\s*(.*)$/i;

    for (let index = 0; index < lines.length; index += 1) {
      const match = lines[index].match(customerLabelPattern);
      if (!match) {
        continue;
      }

      const sameLineValue = cleanCompanyCandidate(match[1]);
      if (isLikelyCustomerCompanyName(sameLineValue)) {
        return sameLineValue;
      }

      const nearbyValue = lines.slice(index + 1, index + 4).find(isLikelyCustomerCompanyName);
      if (nearbyValue) {
        return nearbyValue;
      }
    }

    return lines.find(isLikelyCustomerCompanyName) || "";
  }

  function cleanCompanyCandidate(value) {
    return cleanExtractedValue(value)
      .replace(/^(?:M\/s\.?|To)\s+/i, "")
      .replace(/\s{2,}.+$/, "")
      .trim();
  }

  function isLikelyCustomerCompanyName(value) {
    const line = cleanCompanyCandidate(value);
    return line.length >= 5
      && line.length <= 120
      && !looksLikeAnotherLabel(line)
      && !isOwnCompanyName(line)
      && /\b(?:Limited|LTD|Private Limited|PVT LTD|LLP|LLC|INC|CORP|CO\.? LTD|Company|Pharma|Laboratories|Labs|Industries)\b/i.test(line);
  }

  function isOwnCompanyName(value) {
    return /(?:YIN\s*SU|YINSU|YIN\s*SU\s*DRAGON|DRAGON\s*CHEM|HANGZHOU\s+YINSU|杭州音速|音速|CHINAEXP|YSDC)/i.test(String(value || ""));
  }

  function normalizeUnitValue(value) {
    const normalizedUnit = String(value || "").trim().toUpperCase();
    if (/^(KG|KGS|KILOGRAM|KILOGRAMS|千克)$/.test(normalizedUnit)) {
      return "KGS";
    }
    if (/^(MT|MTS|TON|TONS)$/.test(normalizedUnit)) {
      return "MTS";
    }
    if (/^(PC|PCS|PIECE|PIECES)$/.test(normalizedUnit)) {
      return "PCS";
    }
    return normalizedUnit;
  }

  function formatPlainNumber(value, maximumFractionDigits = 4) {
    if (!Number.isFinite(value)) {
      return "";
    }

    return Number(value.toFixed(maximumFractionDigits)).toString();
  }

  function applyGeneratedApprovalNo(text, fields) {
    const companyPrefix = inferApprovalCompanyPrefix(text);
    const customCode = inferApprovalCustomCode(text, fields);
    const dateCode = inferApprovalDateCode(text, fields);

    if (!companyPrefix || !customCode || !dateCode) {
      return;
    }

    // Always prefer the deterministic CRM rule over loosely extracted OCR text.
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
      /(?:审批单号|合同审批单号)\s*[:：|]\s*(?:YS|DC|YSDC)-([A-Z0-9]{2,8})\d{8}/i,
      /(?:Sales\s+Contract\s+Number|Sales\s+Contract\s+No\.?)\s*[:：|]\s*(?:YS|DC|YSDC)-([A-Z0-9]{2,8})\d{8}/i
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
    const contractDateCode = extractFirstMatchingText(text, [
      /(?:Sales\s+Contract\s+Number|Sales\s+Contract\s+No\.?)\s*[:：|]\s*(?:YS|DC|YSDC)-[A-Z0-9]{2,8}(\d{8})/i
    ]);
    if (contractDateCode) {
      return contractDateCode;
    }

    const dateValue = fields.signDate?.value || extractFirstMatchingText(text, [
      /(?:签订日期|合同日期|date)\s*[:：|]\s*(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2})/i,
      /(?:PO\s*Date|PODate|SC\s*Date)\D{0,20}(\d{1,2}[-/.]\d{1,2}[-/.]\d{4})/i,
      /(\d{4}[-/.年]\d{1,2}[-/.月]\d{1,2})/
    ]);
    const dateMatch = String(dateValue || "").match(/(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/)
      || String(dateValue || "").match(/(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);

    if (!dateMatch) {
      return "";
    }

    if (dateMatch[1].length === 4) {
      return `${dateMatch[1]}${dateMatch[2].padStart(2, "0")}${dateMatch[3].padStart(2, "0")}`;
    }

    return `${dateMatch[3]}${dateMatch[2].padStart(2, "0")}${dateMatch[1].padStart(2, "0")}`;
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
    const currentResult = await fillCrmFieldsInDocument(fields);
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

  async function fillCrmFieldsInDocument(fields) {
    let filled = 0;
    let skipped = 0;

    for (const [key, field] of Object.entries(fields)) {
      if (PRODUCT_FIELD_KEYS.has(key)) {
        continue;
      }

      if (await setCrmFieldValue(field.label, field.value, { ...field, key })) {
        filled += 1;
      } else {
        skipped += 1;
      }
    }

    const productResult = await fillProductSection(fields);
    filled += productResult.filled;
    skipped += productResult.skipped;

    return { filled, skipped };
  }

  async function setCrmFieldValue(label, value, field = {}) {
    const labelElement = findCrmLabelElement(label);
    if (!labelElement) {
      return false;
    }

    if (field.key === "customer") {
      return selectCustomerFromDialog(value, labelElement);
    }

    const containers = getLikelyFieldContainers(labelElement);
    for (const container of containers) {
      if (field.key === "signDate" && setDateFieldInContainer(container, value, labelElement)) {
        return true;
      }

      if (setCustomSelectInContainer(container, value, labelElement) || setNativeFieldInContainer(container, value, labelElement)) {
        return true;
      }
    }

    return false;
  }

  async function fillProductSection(fields) {
    const productName = fields.productName?.value || "";
    const quantity = fields.quantity?.value || "";
    const unit = fields.unit?.value || "";
    const unitPrice = fields.unitPrice?.value || "";
    const productAmount = fields.productAmount?.value || fields.contractAmount?.value || "";
    let filled = 0;
    let skipped = 0;

    const productHeading = findCrmLabelElement("商品信息");
    if (productHeading) {
      productHeading.scrollIntoView({ block: "center", inline: "nearest" });
      await delay(250);
    }

    if (productName) {
      const selectedProduct = await selectProductFromDialog(productName);
      if (selectedProduct) {
        filled += 1;
      } else {
        skipped += 1;
      }
    }

    await delay(250);
    const productTable = findProductInfoTable();
    if (!productTable) {
      return { filled, skipped: skipped + countPresentValues([quantity, unit, unitPrice, productAmount]) };
    }

    const tableFillers = [
      ["数量", quantity],
      ["单位", unit],
      ["单价", unitPrice],
      ["金额", productAmount]
    ];

    for (const [header, value] of tableFillers) {
      if (!value) {
        continue;
      }

      if (await setGridCellValueByHeader(productTable, header, value)) {
        filled += 1;
      } else {
        skipped += 1;
      }
    }

    return { filled, skipped };
  }

  async function selectCustomerFromDialog(customerName, labelElement) {
    if (!customerName) {
      return false;
    }

    const containers = getLikelyFieldContainers(labelElement);
    const customerPicker = containers.flatMap((container) => {
      return getFieldControlsNearLabel(container, labelElement, "[role='combobox'],.el-select,.ant-select,.ivu-select,[class*='select'],input:not([type='hidden'])");
    }).find((element) => !isDisabled(element));

    if (!customerPicker) {
      return false;
    }

    clickCrmElement(customerPicker);

    const dialog = await waitForElement(() => findDialogByText("客户"), {
      timeout: CRM_MODAL_TIMEOUT,
      description: "客户选择弹窗"
    }).catch(() => null);

    if (!dialog) {
      return false;
    }

    const merchantNameInput = findDialogFieldInput(dialog, "客商名称") || findCustomerSearchInput(dialog);
    if (!merchantNameInput) {
      return false;
    }

    setInputValue(merchantNameInput, customerName);
    const queryButton = findEnabledButtonByText(dialog, ["查询"]);
    if (queryButton) {
      clickCrmElement(queryButton);
    }

    await delay(700);

    const bestRow = findBestDialogResultRow(dialog, customerName);
    if (!bestRow) {
      return false;
    }

    const checkbox = bestRow.querySelector("input[type='checkbox'], .el-checkbox, .ant-checkbox, [role='checkbox']");
    clickCrmElement(checkbox || bestRow);

    await delay(150);

    const confirmButton = findEnabledButtonByText(dialog, ["确定"]);
    if (!confirmButton) {
      return false;
    }

    clickCrmElement(confirmButton);
    await delay(700);
    return true;
  }

  async function selectProductFromDialog(productName) {
    const selectProductButton = findClickableByText(document.body, ["选择产品"], {
      selectors: "button,a,[role='button'],.el-button,.ant-btn,.ivu-btn,span,div"
    });

    if (!selectProductButton) {
      return false;
    }

    clickCrmElement(selectProductButton);

    const dialog = await waitForElement(() => findDialogByText("选择产品"), {
      timeout: CRM_MODAL_TIMEOUT,
      description: "选择产品弹窗"
    }).catch(() => null);

    if (!dialog) {
      return false;
    }

    const searchInput = findProductSearchInput(dialog);
    if (!searchInput) {
      return false;
    }

    setInputValue(searchInput, productName);
    const queryButton = findEnabledButtonByText(dialog, ["查询"]);
    if (queryButton) {
      clickCrmElement(queryButton);
    }

    await delay(700);

    const bestRow = findBestDialogResultRow(dialog, productName);
    if (!bestRow) {
      return false;
    }

    const checkbox = bestRow.querySelector("input[type='checkbox'], .el-checkbox, .ant-checkbox, [role='checkbox']");
    clickCrmElement(checkbox || bestRow);

    await delay(150);

    const confirmButton = findEnabledButtonByText(dialog, ["确定"]);
    if (!confirmButton) {
      return false;
    }

    clickCrmElement(confirmButton);
    await delay(700);
    return true;
  }

  function findDialogByText(text) {
    const modalSelectors = [
      ".el-dialog",
      ".ant-modal",
      ".ivu-modal",
      ".modal",
      "[role='dialog']",
      "[aria-modal='true']"
    ].join(",");

    const modalCandidates = Array.from(document.body.querySelectorAll(modalSelectors)).filter((element) => {
      return !isExtensionElement(element)
        && isVisible(element)
        && normalizeText(element.textContent).includes(text);
    });

    if (modalCandidates.length > 0) {
      modalCandidates.sort((first, second) => getElementArea(first) - getElementArea(second));
      return modalCandidates[0];
    }

    const candidates = Array.from(document.body.querySelectorAll("div[class]")).filter((element) => {
      if (isExtensionElement(element) || !isVisible(element)) {
        return false;
      }

      const rect = element.getBoundingClientRect();
      const dialogText = normalizeText(element.textContent);
      return rect.width >= 500
        && rect.height >= 250
        && dialogText.includes(text)
        && (dialogText.includes("查询") || dialogText.includes("确定"));
    });

    candidates.sort((first, second) => getElementArea(first) - getElementArea(second));
    return candidates[0] || null;
  }

  function findProductSearchInput(dialog) {
    const inputs = Array.from(dialog.querySelectorAll("input:not([type='hidden']), textarea"))
      .filter((input) => !input.disabled && isVisible(input));

    return inputs.find((input) => {
      const placeholder = normalizeText(input.getAttribute("placeholder"));
      return /中文品名|英文品名|规格型号|品名/i.test(placeholder);
    }) || inputs[0] || null;
  }

  function findCustomerSearchInput(dialog) {
    const inputs = Array.from(dialog.querySelectorAll("input:not([type='hidden']), textarea"))
      .filter((input) => !input.disabled && isVisible(input));

    return inputs.find((input) => {
      const placeholder = normalizeText(input.getAttribute("placeholder"));
      return /客商名称|客户名称|名称/i.test(placeholder);
    }) || inputs[1] || inputs[0] || null;
  }

  function findDialogFieldInput(dialog, label) {
    const labelElement = findLabelInRoot(dialog, label);
    if (!labelElement) {
      return null;
    }

    return getFieldControlsNearLabel(dialog, labelElement, "input:not([type='hidden']), textarea")
      .find((input) => !input.disabled) || null;
  }

  function findLabelInRoot(root, label) {
    const targetLabel = normalizeCrmLabelText(label);
    const candidates = Array.from(root.querySelectorAll("label,span,div,td,th"))
      .map((element) => {
        if (!isVisible(element)) {
          return null;
        }

        const text = normalizeCrmLabelText(element.textContent);
        if (text === targetLabel) {
          return { element, score: 0 };
        }

        const allowsSmallSuffix = text.endsWith(targetLabel) && text.length <= targetLabel.length + 4;
        return allowsSmallSuffix ? { element, score: text.length - targetLabel.length } : null;
      })
      .filter(Boolean);

    candidates.sort((first, second) => first.score - second.score);
    return candidates[0]?.element || null;
  }

  function findBestDialogResultRow(dialog, searchText) {
    const query = normalizeProductSearchText(searchText);
    const rows = Array.from(dialog.querySelectorAll("tbody tr, .el-table__body tr, [role='row']"))
      .filter((row) => isVisible(row) && normalizeText(row.textContent));

    const scoredRows = rows.map((row) => {
      const rowText = normalizeProductSearchText(row.textContent);
      return {
        row,
        score: calculateProductMatchScore(query, rowText)
      };
    }).filter((item) => item.score > 0);

    scoredRows.sort((first, second) => second.score - first.score);
    return scoredRows[0]?.row || rows[0] || null;
  }

  function calculateProductMatchScore(query, rowText) {
    if (!query || !rowText) {
      return 0;
    }

    if (rowText.includes(query)) {
      return 100 + query.length;
    }

    const tokens = query.split(/\s+/).filter((token) => token.length >= 2);
    return tokens.reduce((score, token) => rowText.includes(token) ? score + token.length : score, 0);
  }

  function normalizeProductSearchText(value) {
    return normalizeText(value).toLowerCase().replace(/[()（）,，.;；:：'"]/g, " ");
  }

  function findProductInfoTable() {
    const heading = findCrmLabelElement("商品信息");
    if (!heading) {
      return null;
    }

    const candidates = Array.from(document.body.querySelectorAll("table")).filter((table) => {
      if (!isVisible(table)) {
        return false;
      }

      const tableTop = table.getBoundingClientRect().top;
      const headingTop = heading.getBoundingClientRect().top;
      const text = normalizeText(table.textContent);
      return tableTop >= headingTop && text.includes("产品编号") && text.includes("数量") && text.includes("单价");
    });

    candidates.sort((first, second) => first.getBoundingClientRect().top - second.getBoundingClientRect().top);
    return candidates[0] || null;
  }

  async function setGridCellValueByHeader(table, headerText, value) {
    const columnIndex = await findTableColumnIndexWithHorizontalScroll(table, headerText);
    const dataRow = findFirstEditableTableRow(table);
    if (columnIndex < 0 || !dataRow) {
      return false;
    }

    const cell = dataRow.cells[columnIndex];
    if (!cell) {
      return false;
    }

    cell.scrollIntoView({ block: "center", inline: "center" });
    await delay(120);

    const existingInput = cell.querySelector("input:not([type='hidden']), textarea");
    if (existingInput) {
      setInputValue(existingInput, value);
      return true;
    }

    clickCrmElement(cell);
    cell.dispatchEvent(new MouseEvent("dblclick", { bubbles: true, cancelable: true, view: window }));
    await delay(150);

    const activeInput = cell.querySelector("input:not([type='hidden']), textarea") || document.activeElement;
    if (activeInput instanceof HTMLInputElement || activeInput instanceof HTMLTextAreaElement) {
      setInputValue(activeInput, value);
      return true;
    }

    return false;
  }

  async function findTableColumnIndexWithHorizontalScroll(table, headerText) {
    let columnIndex = findTableColumnIndex(table, headerText);
    if (columnIndex >= 0) {
      return columnIndex;
    }

    const scrollContainers = findHorizontalScrollContainers(table);
    for (const container of scrollContainers) {
      const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
      const steps = [0, 0.35, 0.7, 1];
      for (const step of steps) {
        container.scrollLeft = Math.round(maxScrollLeft * step);
        await delay(120);
        columnIndex = findTableColumnIndex(table, headerText);
        if (columnIndex >= 0) {
          return columnIndex;
        }
      }
    }

    return -1;
  }

  function findHorizontalScrollContainers(element) {
    const containers = [];
    let current = element;
    while (current && current !== document.body) {
      if (current.scrollWidth > current.clientWidth + 4) {
        containers.push(current);
      }
      current = current.parentElement;
    }

    return containers;
  }

  function findTableColumnIndex(table, headerText) {
    const rows = Array.from(table.rows);
    const headerRow = rows.find((row) => normalizeText(row.textContent).includes(headerText));
    if (!headerRow) {
      return -1;
    }

    return Array.from(headerRow.cells).findIndex((cell) => {
      return normalizeText(cell.textContent).replace(/\*/g, "").includes(headerText);
    });
  }

  function findFirstEditableTableRow(table) {
    return Array.from(table.rows).find((row) => {
      const text = normalizeText(row.textContent);
      return text && !text.includes("产品编号") && (row.querySelector("input,textarea") || text.includes("G"));
    }) || null;
  }

  function countPresentValues(values) {
    return values.filter((value) => Boolean(value)).length;
  }

  function delay(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function findCrmLabelElement(label) {
    const targetLabel = normalizeCrmLabelText(label);
    const candidates = Array.from(document.body.querySelectorAll("label,span,div,td,th"))
      .map((element) => {
        if (isExtensionElement(element) || !isVisible(element)) {
          return null;
        }

        const text = normalizeCrmLabelText(element.textContent);
        if (!text) {
          return null;
        }

        if (text === targetLabel) {
          return { element, score: 0 };
        }

        const allowsSmallSuffix = text.endsWith(targetLabel) && text.length <= targetLabel.length + 4;
        return allowsSmallSuffix ? { element, score: text.length - targetLabel.length } : null;
      })
      .filter(Boolean);

    candidates.sort((first, second) => first.score - second.score);
    return candidates[0]?.element || null;
  }

  function normalizeCrmLabelText(value) {
    return normalizeText(value)
      .replace(/\*/g, "")
      .replace(/[：:]+$/g, "")
      .trim();
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
    const controls = getFieldControlsNearLabel(container, labelElement, "input:not([type='hidden']), textarea")
      .filter((control) => !control.disabled);

    const control = controls.find((item) => item.type !== "checkbox" && item.type !== "radio");
    if (!control) {
      return false;
    }

    setInputValue(control, value);
    return true;
  }

  function setDateFieldInContainer(container, value, labelElement) {
    const dateParts = parseCrmDateValue(value);
    if (!dateParts) {
      return false;
    }

    const input = getFieldControlsNearLabel(container, labelElement, "input:not([type='hidden'])")
      .find((control) => !control.disabled);

    if (!input) {
      return false;
    }

    setInputValue(input, dateParts.iso);
    if (normalizeText(input.value) === dateParts.iso) {
      return true;
    }

    clickCrmElement(input);
    return selectDateFromOpenPicker(dateParts) || false;
  }

  function parseCrmDateValue(value) {
    const normalizedValue = String(value || "").trim();
    const isoMatch = normalizedValue.match(/^(\d{4})[-/.年](\d{1,2})[-/.月](\d{1,2})/);
    if (isoMatch) {
      return {
        year: Number(isoMatch[1]),
        month: Number(isoMatch[2]),
        day: Number(isoMatch[3]),
        iso: `${isoMatch[1]}-${isoMatch[2].padStart(2, "0")}-${isoMatch[3].padStart(2, "0")}`
      };
    }

    const dayFirstMatch = normalizedValue.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
    if (dayFirstMatch) {
      return {
        year: Number(dayFirstMatch[3]),
        month: Number(dayFirstMatch[2]),
        day: Number(dayFirstMatch[1]),
        iso: `${dayFirstMatch[3]}-${dayFirstMatch[2].padStart(2, "0")}-${dayFirstMatch[1].padStart(2, "0")}`
      };
    }

    return null;
  }

  function selectDateFromOpenPicker(dateParts) {
    const picker = findVisibleDatePicker();
    if (!picker) {
      return false;
    }

    setDatePickerSelectValue(picker, String(dateParts.year));
    setDatePickerSelectValue(picker, String(dateParts.month));

    const dayButton = findDatePickerDayButton(picker, dateParts.day);
    if (!dayButton) {
      return false;
    }

    clickCrmElement(dayButton);
    return true;
  }

  function findVisibleDatePicker() {
    const pickerSelectors = [
      ".el-picker-panel",
      ".ant-picker-dropdown",
      ".ivu-date-picker",
      ".mx-datepicker-popup",
      "[class*='date-picker']",
      "[class*='datepicker']",
      "[class*='calendar']"
    ].join(",");

    return Array.from(document.body.querySelectorAll(pickerSelectors))
      .filter((element) => !isExtensionElement(element) && isVisible(element))
      .sort((first, second) => getElementArea(first) - getElementArea(second))[0] || null;
  }

  function setDatePickerSelectValue(picker, value) {
    const normalizedValue = normalizeComparableText(value);
    const select = Array.from(picker.querySelectorAll("select")).find((control) => {
      return Array.from(control.options).some((option) => normalizeComparableText(option.textContent).includes(normalizedValue) || normalizeComparableText(option.value) === normalizedValue);
    });

    if (select && setSelectValue(select, value)) {
      return true;
    }

    return false;
  }

  function findDatePickerDayButton(picker, day) {
    const dayText = String(day);
    const candidates = Array.from(picker.querySelectorAll("td,button,span,div")).filter((element) => {
      if (!isVisible(element) || isDisabled(element)) {
        return false;
      }

      const text = normalizeText(element.textContent);
      if (text !== dayText) {
        return false;
      }

      const className = String(element.className || "");
      return !/prev|next|old|new|disabled/i.test(className);
    });

    candidates.sort((first, second) => getElementArea(first) - getElementArea(second));
    return candidates[0] || null;
  }

  function setCustomSelectInContainer(container, value, labelElement) {
    const select = getFieldControlsNearLabel(container, labelElement, "select")
      .find((control) => !control.disabled);
    if (select) {
      return setSelectValue(select, value);
    }

    const clickable = getFieldControlsNearLabel(container, labelElement, "[role='combobox'],.el-select,.ant-select,.ivu-select,[class*='select']")
      .find((element) => !isDisabled(element));

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

  function getFieldControlsNearLabel(container, labelElement, selectors) {
    const labelRect = labelElement.getBoundingClientRect();
    const labelCenterY = labelRect.top + (labelRect.height / 2);

    return Array.from(container.querySelectorAll(selectors))
      .filter((control) => {
        if (control === labelElement || control.contains(labelElement) || isExtensionElement(control) || !isVisible(control)) {
          return false;
        }

        const rect = control.getBoundingClientRect();
        const centerY = rect.top + (rect.height / 2);
        const isSameVisualRow = Math.abs(centerY - labelCenterY) <= Math.max(36, labelRect.height * 1.8);
        const isToRightOfLabel = rect.left >= labelRect.left + Math.min(labelRect.width * 0.5, 48);
        return isSameVisualRow && isToRightOfLabel;
      })
      .sort((first, second) => {
        const firstRect = first.getBoundingClientRect();
        const secondRect = second.getBoundingClientRect();
        const firstScore = Math.abs((firstRect.top + firstRect.height / 2) - labelCenterY) + Math.max(0, firstRect.left - labelRect.right);
        const secondScore = Math.abs((secondRect.top + secondRect.height / 2) - labelCenterY) + Math.max(0, secondRect.left - labelRect.right);
        return firstScore - secondScore;
      });
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

    window.addEventListener("message", async (event) => {
      if (event.source !== window.parent || event.data?.type !== FRAME_AUTOFILL_REQUEST) {
        return;
      }

      const { requestId, fields } = event.data;
      try {
        const result = await fillCrmFieldsInDocument(fields || {});
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
