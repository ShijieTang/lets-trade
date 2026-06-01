(function exposeFinancialCalculator(globalScope) {
  function safeParseFloat(value) {
    if (value === "" || value === null || value === undefined) {
      return 0;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : 0;
    }

    const normalizedValue = String(value)
      .trim()
      .replace(/,/g, "")
      .replace(/[￥¥$]/g, "");
    const parsedValue = Number.parseFloat(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : 0;
  }

  function roundToTwo(value) {
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  }

  function calculateFinancials(rowArray) {
    const row = Array.isArray(rowArray) ? rowArray : [];

    // Read the fixed A-AX source columns by their 0-based indexes.
    const K = safeParseFloat(row[10]);
    const T = safeParseFloat(row[19]);
    const AA = safeParseFloat(row[26]);
    const AB = safeParseFloat(row[27]);
    const AH = safeParseFloat(row[33]);
    const AJ = safeParseFloat(row[35]);
    const AL = safeParseFloat(row[37]);
    const AN = safeParseFloat(row[39]);
    const AO = safeParseFloat(row[40]);
    const AQ = safeParseFloat(row[42]);
    const AR = safeParseFloat(row[43]);
    const AT = safeParseFloat(row[45]);
    const AU = safeParseFloat(row[46]);
    const AV = safeParseFloat(row[47]);
    const AX = safeParseFloat(row[49]);
    const AY = safeParseFloat(row[50]);

    // AY: net profit before the government tax rebate is received.
    const netProfit = (K * T)
      - AA
      - AB
      - AJ
      - AL
      - AN
      - AO
      - AQ
      - AR
      - (AT * T)
      - (AU * T)
      - AV
      - AX;

    // AZ duplicates the source tax rebate amount from AB.
    const taxRebateAmount = AB;

    // BA combines net profit and the tax rebate.
    const totalProfit = netProfit + taxRebateAmount;

    // BB: export exchange cost. AY = 1 keeps the original formula; other values include the rebate in the numerator.
    const denominator = K - AH - AT - AU - ((AL + AN + AQ + AV) / T);
    const exchangeToTaxRatio = denominator === 0
      ? 0
      : (AY === 1 ? AA : AA + AB) / denominator;

    return [
      roundToTwo(netProfit),
      roundToTwo(taxRebateAmount),
      roundToTwo(totalProfit),
      roundToTwo(exchangeToTaxRatio)
    ];
  }

  globalScope.safeParseFloat = safeParseFloat;
  globalScope.calculateFinancials = calculateFinancials;
})(globalThis);
