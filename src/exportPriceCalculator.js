(function initializeExportPriceCalculator(globalScope) {
  "use strict";

  const COMMISSION_PROFIT_FACTOR = 1.03;
  const INSURANCE_MARKUP = 1.1;
  const INSURANCE_PREMIUM_RATE = 0.0006;
  const DENOMINATOR_INSURANCE_FACTOR = 0.9993202;
  const ANNUAL_INTEREST_RATE = 0.035;
  const INSURANCE_BASELINE_FACTOR = 1.25;

  const FIELD_NAMES = [
    "factoryUnitPrice",
    "totalQuantity",
    "totalLogisticsFreight",
    "exchangeRate",
    "financingDays"
  ];

  const DEFAULT_MESSAGES = {
    invalidFactoryUnitPrice: "Enter a valid factory unit price.",
    invalidTotalQuantity: "Enter a valid total order quantity.",
    invalidTotalLogisticsFreight: "Enter valid total logistics freight.",
    invalidExchangeRate: "Enter a valid exchange rate.",
    invalidFinancingDays: "Enter valid D/A payment term days.",
    factoryUnitPricePositive: "Factory unit price must be greater than 0.",
    totalQuantityPositive: "Total order quantity must be greater than 0.",
    exchangeRatePositive: "Exchange rate must be greater than 0.",
    nonNegativeInputs: "Logistics freight and D/A payment term days cannot be negative.",
    usdPrefix: "USD"
  };

  const INVALID_MESSAGE_BY_FIELD = {
    factoryUnitPrice: "invalidFactoryUnitPrice",
    totalQuantity: "invalidTotalQuantity",
    totalLogisticsFreight: "invalidTotalLogisticsFreight",
    exchangeRate: "invalidExchangeRate",
    financingDays: "invalidFinancingDays"
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
    const freightPerUnit = values.totalLogisticsFreight / values.totalQuantity;
    const interestPerUnit = (values.factoryUnitPrice * ANNUAL_INTEREST_RATE) / 360 * values.financingDays;
    const denominatorCorrectionFactor = values.exchangeRate * DENOMINATOR_INSURANCE_FACTOR;
    const floorPrice = ((values.factoryUnitPrice + freightPerUnit + interestPerUnit) * COMMISSION_PROFIT_FACTOR)
      / denominatorCorrectionFactor;

    const freightPerUnitCeiling = ceilToDecimalPlaces(freightPerUnit, 2);
    const interestPerUnitCeiling = ceilToDecimalPlaces(interestPerUnit, 2);
    const estimatedInsurancePerUnitCeiling = ceilToDecimalPlaces(
      values.factoryUnitPrice * INSURANCE_BASELINE_FACTOR * INSURANCE_MARKUP * INSURANCE_PREMIUM_RATE,
      2
    );
    const intermediateUsdPrice = ((values.factoryUnitPrice + freightPerUnitCeiling + interestPerUnitCeiling)
      / values.exchangeRate) + estimatedInsurancePerUnitCeiling;
    const ceilingPrice = ceilToDecimalPlaces(intermediateUsdPrice * COMMISSION_PROFIT_FACTOR, 2);

    return {
      floorPrice,
      ceilingPrice,
      breakdown: {
        freightPerUnit,
        interestPerUnit,
        denominatorCorrectionFactor,
        freightPerUnitCeiling,
        interestPerUnitCeiling,
        estimatedInsurancePerUnitCeiling,
        intermediateUsdPrice
      }
    };
  }

  function validateValues(values) {
    const invalidField = FIELD_NAMES.find((fieldName) => !Number.isFinite(values[fieldName]));
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

    return "";
  }

  function readValues(root) {
    return FIELD_NAMES.reduce((values, fieldName) => {
      const input = root.querySelector(`[data-export-price-input="${fieldName}"]`);
      values[fieldName] = parseDecimalInput(input?.value);
      return values;
    }, {});
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
      if (!(event.target instanceof HTMLInputElement) || !event.target.matches("[data-export-price-input]")) {
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
      delete root.__crmExportPriceCalculator;
    }

    form?.addEventListener("submit", handleSubmit);
    root.addEventListener("input", handleInput);

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
