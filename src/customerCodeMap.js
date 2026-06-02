/*
 * Customer name/code reference for CRM approval numbers.
 *
 * Add customer aliases on the left and the short code used in approval numbers
 * on the right. Matching is case-insensitive and ignores extra spaces.
 *
 * Examples:
 *   "SUN PHARMACEUTICAL INDUSTRIES LTD": "KHN",
 *   "SUN PHARMA": "KHN",
 */
(function exposeCustomerCodeMap(globalScope) {
  globalScope.CRM_WORKBENCH_CUSTOMER_CODE_MAP = {
    "SUN PHARMACEUTICAL INDUSTRIES LTD": "KHN",
    "SYNTHIMED LABS PRIVATE LIMITED": "XH"
  };
})(globalThis);
