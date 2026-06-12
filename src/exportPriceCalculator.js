(function initializeExportPriceCalculator(globalScope) {
  "use strict";

  const HIDDEN_COMPANY_PROFIT_RATE = 0.02;
  const INSURANCE_MARKUP = 1.1;
  const INSURANCE_PREMIUM_RATE = 0.0006;
  const DENOMINATOR_INSURANCE_FACTOR = 0.9993202;
  const ANNUAL_INTEREST_RATE = 0.035;
  const INSURANCE_BASELINE_FACTOR = 1.25;
  const TAX_STATUS_TAX_INCLUSIVE_REFUND = "tax_inclusive_refund";
  const TAX_STATUS_TAX_EXCLUSIVE_NO_REFUND = "tax_exclusive_no_refund";

  const NUMERIC_FIELD_NAMES = [
    "factoryUnitPrice",
    "totalQuantity",
    "totalLogisticsFreight",
    "exchangeRate",
    "financingDays",
    "taxRefundRate",
    "bankLumpSumUsd",
    "clientRebateCommissionRate"
  ];

  const DEFAULT_MESSAGES = {
    invalidFactoryUnitPrice: "Enter a valid factory unit price.",
    invalidTotalQuantity: "Enter a valid total order quantity.",
    invalidTotalLogisticsFreight: "Enter valid total logistics freight.",
    invalidExchangeRate: "Enter a valid exchange rate.",
    invalidFinancingDays: "Enter valid D/A payment term days.",
    invalidTaxRefundRate: "Enter a valid tax refund rate.",
    invalidBankLumpSumUsd: "Enter a valid Bank & DHL lump sum.",
    invalidClientRebateCommissionRate: "Enter a valid client rebate/commission rate.",
    factoryUnitPricePositive: "Factory unit price must be greater than 0.",
    totalQuantityPositive: "Total order quantity must be greater than 0.",
    exchangeRatePositive: "Exchange rate must be greater than 0.",
    nonNegativeInputs: "Logistics freight and D/A payment term days cannot be negative.",
    taxRefundRateNonNegative: "Tax refund rate cannot be negative.",
    bankLumpSumUsdNonNegative: "Bank & DHL lump sum cannot be negative.",
    clientRebateCommissionRateNonNegative: "Client rebate/commission rate cannot be negative.",
    usdPrefix: "USD"
  };

  const INVALID_MESSAGE_BY_FIELD = {
    factoryUnitPrice: "invalidFactoryUnitPrice",
    totalQuantity: "invalidTotalQuantity",
    totalLogisticsFreight: "invalidTotalLogisticsFreight",
    exchangeRate: "invalidExchangeRate",
    financingDays: "invalidFinancingDays",
    taxRefundRate: "invalidTaxRefundRate",
    bankLumpSumUsd: "invalidBankLumpSumUsd",
    clientRebateCommissionRate: "invalidClientRebateCommissionRate"
  };

  function parseDecimalInput(value) {
    if (typeof value === "number") {
      return Number.isFinite(value) ? value : Number.NaN;
    }

    const normalizedValue = String(value || "")
      .trim()
      .replace(/,/g, "")
      .replace(/[￥¥$]/g, "");

    if (!normalizedValue) {
      return Number.NaN;
    }

    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : Number.NaN;
  }

  function ceilToDecimalPlaces(value, decimalPlaces) {
    const multiplier = 10 ** decimalPlaces;
    return Math.ceil(value * multiplier) / multiplier;
  }

  function calculateExportPrices(values) {
    const isTaxInclusiveRefund = values.taxStatus !== TAX_STATUS_TAX_EXCLUSIVE_NO_REFUND;
    const taxRefundRate = values.taxRefundRate / 100;
    const actualCost = isTaxInclusiveRefund
      ? values.factoryUnitPrice * (1 - taxRefundRate / 1.13)
      : values.factoryUnitPrice;
    const actualCostCeiling = isTaxInclusiveRefund
      ? values.factoryUnitPrice * (1 - (taxRefundRate * 0.95) / 1.13)
      : values.factoryUnitPrice;
    const clientRebateCommissionRate = values.clientRebateCommissionRate / 100;
    const commissionProfitFactor = 1 + HIDDEN_COMPANY_PROFIT_RATE + clientRebateCommissionRate;
    const freightPerUnit = values.totalLogisticsFreight / values.totalQuantity;
    const bankDhlPerUnitUsd = values.bankLumpSumUsd / values.totalQuantity;
    const interestPerUnit = (values.factoryUnitPrice * ANNUAL_INTEREST_RATE) / 360 * values.financingDays;
    const denominatorCorrectionFactor = values.exchangeRate * DENOMINATOR_INSURANCE_FACTOR;
    const basePriceUsd = ((actualCost + freightPerUnit + interestPerUnit) * commissionProfitFactor)
      / denominatorCorrectionFactor;
    const floorPrice = basePriceUsd + (bankDhlPerUnitUsd * commissionProfitFactor / DENOMINATOR_INSURANCE_FACTOR);

    const freightPerUnitCeiling = ceilToDecimalPlaces(freightPerUnit, 2);
    const bankDhlCeiling = ceilToDecimalPlaces(bankDhlPerUnitUsd, 2);
    const interestPerUnitCeiling = ceilToDecimalPlaces(interestPerUnit, 2);
    const estimatedInsurancePerUnitCeiling = ceilToDecimalPlaces(
      actualCostCeiling * INSURANCE_BASELINE_FACTOR * INSURANCE_MARKUP * INSURANCE_PREMIUM_RATE,
      2
    );
    const intermediateUsdPrice = ((actualCostCeiling + freightPerUnitCeiling + interestPerUnitCeiling)
      / values.exchangeRate) + estimatedInsurancePerUnitCeiling + bankDhlCeiling;
    const ceilingPrice = ceilToDecimalPlaces(intermediateUsdPrice * commissionProfitFactor, 2);

    return {
      floorPrice,
      ceilingPrice,
      breakdown: {
        actualCost,
        actualCostCeiling,
        freightPerUnit,
        bankDhlPerUnitUsd,
        basePriceUsd,
        interestPerUnit,
        denominatorCorrectionFactor,
        freightPerUnitCeiling,
        bankDhlCeiling,
        interestPerUnitCeiling,
        estimatedInsurancePerUnitCeiling,
        intermediateUsdPrice
      }
    };
  }

  function validateValues(values) {
    const requiredNumericFields = values.taxStatus === TAX_STATUS_TAX_EXCLUSIVE_NO_REFUND
      ? NUMERIC_FIELD_NAMES.filter((fieldName) => fieldName !== "taxRefundRate")
      : NUMERIC_FIELD_NAMES;
    const invalidField = requiredNumericFields.find((fieldName) => !Number.isFinite(values[fieldName]));
    if (invalidField) {
      return INVALID_MESSAGE_BY_FIELD[invalidField];
    }

    if (values.factoryUnitPrice <= 0) {
      return "factoryUnitPricePositive";
    }

    if (values.totalQuantity <= 0) {
      return "totalQuantityPositive";
    }

    if (values.exchangeRate <= 0) {
      return "exchangeRatePositive";
    }

    if (values.totalLogisticsFreight < 0 || values.financingDays < 0) {
      return "nonNegativeInputs";
    }

    if (values.taxStatus !== TAX_STATUS_TAX_EXCLUSIVE_NO_REFUND && values.taxRefundRate < 0) {
      return "taxRefundRateNonNegative";
    }

    if (values.bankLumpSumUsd < 0) {
      return "bankLumpSumUsdNonNegative";
    }

    if (values.clientRebateCommissionRate < 0) {
      return "clientRebateCommissionRateNonNegative";
    }

    return "";
  }

  function readValues(root) {
    const values = NUMERIC_FIELD_NAMES.reduce((nextValues, fieldName) => {
      const input = root.querySelector(`[data-export-price-input="${fieldName}"]`);
      nextValues[fieldName] = parseDecimalInput(input?.value);
      return nextValues;
    }, {});
    const taxStatusInput = root.querySelector('[data-export-price-input="taxStatus"]');
    values.taxStatus = taxStatusInput?.value === TAX_STATUS_TAX_EXCLUSIVE_NO_REFUND
      ? TAX_STATUS_TAX_EXCLUSIVE_NO_REFUND
      : TAX_STATUS_TAX_INCLUSIVE_REFUND;
    return values;
  }

  function createController(root, options = {}) {
    const form = root.querySelector("[data-export-price-form]");
    const floorOutput = root.querySelector('[data-export-price-output="floorPrice"]');
    const ceilingOutput = root.querySelector('[data-export-price-output="ceilingPrice"]');
    const errorOutput = root.querySelector("[data-export-price-error]");
    const state = {
      options,
      errorKey: "",
      result: null
    };

    function getMessages() {
      const suppliedMessages = typeof state.options.getMessages === "function"
        ? state.options.getMessages()
        : state.options.messages;
      return { ...DEFAULT_MESSAGES, ...(suppliedMessages || {}) };
    }

    function renderError(errorKey) {
      const messages = getMessages();
      state.errorKey = errorKey;
      state.result = null;

      if (floorOutput) {
        floorOutput.textContent = "--";
      }
      if (ceilingOutput) {
        ceilingOutput.textContent = "--";
      }
      if (errorOutput) {
        errorOutput.textContent = messages[errorKey] || DEFAULT_MESSAGES[errorKey] || errorKey;
        errorOutput.classList.add("is-visible");
      }
    }

    function renderResult(result) {
      const messages = getMessages();
      state.errorKey = "";
      state.result = result;

      if (floorOutput) {
        floorOutput.textContent = `${messages.usdPrefix} ${result.floorPrice.toFixed(4)}`;
      }
      if (ceilingOutput) {
        ceilingOutput.textContent = `${messages.usdPrefix} ${result.ceilingPrice.toFixed(2)}`;
      }
      if (errorOutput) {
        errorOutput.textContent = "";
        errorOutput.classList.remove("is-visible");
      }
    }

    function clearOutputs() {
      state.errorKey = "";
      state.result = null;

      if (floorOutput) {
        floorOutput.textContent = "--";
      }
      if (ceilingOutput) {
        ceilingOutput.textContent = "--";
      }
      if (errorOutput) {
        errorOutput.textContent = "";
        errorOutput.classList.remove("is-visible");
      }
    }

    function handleSubmit(event) {
      event.preventDefault();

      const values = readValues(root);
      const validationError = validateValues(values);
      if (validationError) {
        renderError(validationError);
        return;
      }

      renderResult(calculateExportPrices(values));
    }

    function handleInput(event) {
      if (!(event.target instanceof HTMLElement) || !event.target.matches("[data-export-price-input]")) {
        return;
      }

      clearOutputs();
    }

    function updateOptions(nextOptions = {}) {
      state.options = { ...state.options, ...nextOptions };

      if (state.errorKey) {
        renderError(state.errorKey);
      } else if (state.result) {
        renderResult(state.result);
      }
    }

    function destroy() {
      form?.removeEventListener("submit", handleSubmit);
      root.removeEventListener("input", handleInput);
      root.removeEventListener("change", handleInput);
      delete root.__crmExportPriceCalculator;
    }

    form?.addEventListener("submit", handleSubmit);
    root.addEventListener("input", handleInput);
    root.addEventListener("change", handleInput);

    return {
      updateOptions,
      destroy
    };
  }

  function mount(root, options = {}) {
    if (!root) {
      return null;
    }

    if (root.__crmExportPriceCalculator) {
      root.__crmExportPriceCalculator.updateOptions(options);
      return root.__crmExportPriceCalculator;
    }

    root.__crmExportPriceCalculator = createController(root, options);
    return root.__crmExportPriceCalculator;
  }

  globalScope.CrmExportPriceCalculator = Object.freeze({
    mount,
    calculate: calculateExportPrices
  });
})(globalThis);
