(function initializeCrmAutomationSchema(global) {
  "use strict";

  const DOCUMENT_TYPES = Object.freeze({
    commercial_invoice: "commercial_invoice",
    packing_list: "packing_list",
    bill_of_lading: "bill_of_lading",
    insurance_policy: "insurance_policy",
    certificate_of_origin: "certificate_of_origin",
    purchase_order: "purchase_order",
    sales_contract: "sales_contract",
    other: "other"
  });

  const CANONICAL_FIELDS = Object.freeze([
    "scNo",
    "customerPoNo",
    "customerName",
    "supplierName",
    "invoiceNo",
    "invoiceDate",
    "incoterms",
    "paymentTerm",
    "currency",
    "totalAmount",
    "productName",
    "officialEnglishName",
    "hsCode",
    "casNo",
    "quantity",
    "unit",
    "unitPrice",
    "productAmount",
    "grossWeight",
    "netWeight",
    "volume",
    "packageCount",
    "portOfLoading",
    "portOfDischarge",
    "destinationPort",
    "etd",
    "eta",
    "warehouseEntryTime",
    "documentCutoffTime",
    "vessel",
    "voyage",
    "containerNo",
    "blNo",
    "consignee",
    "notifyParty",
    "insurancePolicyNo",
    "insuredAmount",
    "dhlNo"
  ]);

  const DEFAULT_REQUIRED_CRM_VALUES = Object.freeze({
    purchaseSaleMode: "以销定购",
    overfillRate: "5%",
    shortfallRate: "5%"
  });

  const FIELD_LABELS = Object.freeze({
    zh: Object.freeze({
      scNo: "销售合同号",
      customerPoNo: "客户订单号",
      customerName: "客户名称",
      supplierName: "供应商名称",
      invoiceNo: "发票号",
      invoiceDate: "发票日期",
      incoterms: "成交方式",
      paymentTerm: "付款方式",
      currency: "币种",
      totalAmount: "总金额",
      productName: "品名",
      officialEnglishName: "官方英文品名",
      hsCode: "海关编码",
      casNo: "CAS NO.",
      quantity: "数量",
      unit: "单位",
      unitPrice: "单价",
      productAmount: "商品金额",
      grossWeight: "毛重",
      netWeight: "净重",
      volume: "体积",
      packageCount: "件数",
      portOfLoading: "起运港",
      portOfDischarge: "卸货港",
      destinationPort: "目的港",
      etd: "ETD",
      eta: "ETA",
      warehouseEntryTime: "进仓时间",
      documentCutoffTime: "截单时间",
      vessel: "船名",
      voyage: "航次",
      containerNo: "箱号",
      blNo: "提单号",
      consignee: "收货人",
      notifyParty: "通知人",
      insurancePolicyNo: "保单号",
      insuredAmount: "保险金额",
      dhlNo: "DHL 单号"
    }),
    en: Object.freeze({
      scNo: "SC No",
      customerPoNo: "Customer PO No",
      customerName: "Customer",
      supplierName: "Supplier",
      invoiceNo: "Invoice No",
      invoiceDate: "Invoice Date",
      incoterms: "Incoterms",
      paymentTerm: "Payment Term",
      currency: "Currency",
      totalAmount: "Total Amount",
      productName: "Product",
      officialEnglishName: "Official English Name",
      hsCode: "HS Code",
      casNo: "CAS No",
      quantity: "Quantity",
      unit: "Unit",
      unitPrice: "Unit Price",
      productAmount: "Product Amount",
      grossWeight: "Gross Weight",
      netWeight: "Net Weight",
      volume: "Volume",
      packageCount: "Package Count",
      portOfLoading: "Port of Loading",
      portOfDischarge: "Port of Discharge",
      destinationPort: "Destination Port",
      etd: "ETD",
      eta: "ETA",
      warehouseEntryTime: "Warehouse Entry Time",
      documentCutoffTime: "Document Cut-off",
      vessel: "Vessel",
      voyage: "Voyage",
      containerNo: "Container No",
      blNo: "B/L No",
      consignee: "Consignee",
      notifyParty: "Notify Party",
      insurancePolicyNo: "Insurance Policy No",
      insuredAmount: "Insured Amount",
      dhlNo: "DHL No"
    })
  });

  const CRM_FIELD_GROUPS = Object.freeze({
    contract: Object.freeze([
      "scNo",
      "customerPoNo",
      "customerName",
      "supplierName",
      "incoterms",
      "paymentTerm",
      "currency",
      "totalAmount"
    ]),
    product: Object.freeze([
      "productName",
      "officialEnglishName",
      "hsCode",
      "casNo",
      "quantity",
      "unit",
      "unitPrice",
      "productAmount"
    ]),
    logistics: Object.freeze([
      "grossWeight",
      "netWeight",
      "volume",
      "packageCount",
      "portOfLoading",
      "portOfDischarge",
      "destinationPort",
      "etd",
      "eta",
      "warehouseEntryTime",
      "documentCutoffTime"
    ]),
    shipment: Object.freeze([
      "vessel",
      "voyage",
      "containerNo",
      "blNo",
      "consignee",
      "notifyParty"
    ]),
    insurance: Object.freeze([
      "insurancePolicyNo",
      "insuredAmount"
    ]),
    dispatch: Object.freeze([
      "dhlNo"
    ])
  });

  const RISK_LEVELS = Object.freeze({
    high: Object.freeze([
      "totalAmount",
      "currency",
      "quantity",
      "unitPrice",
      "hsCode",
      "consignee",
      "containerNo",
      "etd",
      "eta",
      "insurancePolicyNo",
      "insuredAmount"
    ]),
    medium: Object.freeze([
      "scNo",
      "customerPoNo",
      "invoiceNo",
      "invoiceDate",
      "incoterms",
      "paymentTerm",
      "productName",
      "grossWeight",
      "netWeight",
      "portOfLoading",
      "portOfDischarge",
      "destinationPort",
      "blNo"
    ]),
    low: Object.freeze([
      "supplierName",
      "officialEnglishName",
      "volume",
      "packageCount",
      "warehouseEntryTime",
      "documentCutoffTime",
      "vessel",
      "voyage",
      "notifyParty",
      "dhlNo"
    ])
  });

  const VALIDATION_RULES = Object.freeze([
    Object.freeze({
      id: "gross_weight_not_less_than_net_weight",
      fields: Object.freeze(["grossWeight", "netWeight"]),
      severity: "blocking",
      description: "grossWeight >= netWeight"
    }),
    Object.freeze({
      id: "total_amount_matches_line_items",
      fields: Object.freeze(["totalAmount", "productAmount"]),
      severity: "warning",
      description: "totalAmount approximately equals sum(line item amounts), if line items are available"
    }),
    Object.freeze({
      id: "quantity_positive",
      fields: Object.freeze(["quantity"]),
      severity: "blocking",
      description: "quantity > 0"
    }),
    Object.freeze({
      id: "unit_price_non_negative",
      fields: Object.freeze(["unitPrice"]),
      severity: "blocking",
      description: "unitPrice >= 0"
    }),
    Object.freeze({
      id: "etd_not_after_eta",
      fields: Object.freeze(["etd", "eta"]),
      severity: "blocking",
      description: "ETD <= ETA if both dates parse"
    }),
    Object.freeze({
      id: "container_number_format",
      fields: Object.freeze(["containerNo"]),
      severity: "blocking",
      description: "containerNo format check if present"
    }),
    Object.freeze({
      id: "insurance_before_departure",
      fields: Object.freeze(["insurancePolicyNo", "insuredAmount", "etd"]),
      severity: "warning",
      description: "insurance should exist before ETD if shipment status is near departure"
    })
  ]);

  const DEFAULT_CRM_FIELD_MAPPING = Object.freeze(CANONICAL_FIELDS.reduce((mapping, fieldKey) => {
    const zhLabel = FIELD_LABELS.zh[fieldKey] || fieldKey;
    const enLabel = FIELD_LABELS.en[fieldKey] || fieldKey;
    mapping[fieldKey] = Object.freeze({
      selectors: Object.freeze([]),
      labelHints: Object.freeze([zhLabel, enLabel, fieldKey]),
      crmFieldName: "",
      lastSelectorUsed: "",
      updatedAt: ""
    });
    return mapping;
  }, {}));

  global.CrmAutomationSchema = Object.freeze({
    DOCUMENT_TYPES,
    CANONICAL_FIELDS,
    DEFAULT_REQUIRED_CRM_VALUES,
    FIELD_LABELS,
    CRM_FIELD_GROUPS,
    RISK_LEVELS,
    VALIDATION_RULES,
    DEFAULT_CRM_FIELD_MAPPING
  });
})(typeof window !== "undefined" ? window : globalThis);
