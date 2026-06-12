# lets-trade

**lets-trade** is a Manifest V3 Chrome extension, distributed as **CRM Embedded Workbench**, for `https://crm.chinaexp365.com/cloud/*`. It adds a browser-native, Shadow DOM-isolated trade-operations workbench to the CRM, using plain JavaScript, Chrome extension APIs, IndexedDB, bundled document parsers, and optional Gemini PDF extraction to manage import/export documentation, calculator workflows, review-first CRM autofill, quick links, and document flow tracking.

> **Scope note**
>
> This repository does **not** contain an algorithmic brokerage or exchange-trading engine. It does not connect to securities, crypto, FX, futures, or brokerage venues; it does not place orders; and it does not provide market execution, portfolio management, or investment strategy automation. In this project, "trade" refers to commercial import/export operations and CRM workflow support.

Version: `0.6.2.2`

## Disclaimer

This software is provided for operational workflow assistance only. It may calculate commercial quotation values, exchange-rate-derived estimates, tax-rebate review figures, and CRM field suggestions, but those outputs are not financial, investment, legal, tax, accounting, customs, or compliance advice.

Use this project at your own risk. You are responsible for independently verifying all extracted document values, calculations, exchange rates, tax assumptions, customer data, CRM updates, and downstream business decisions before relying on them. The maintainers and contributors disclaim liability for trading losses, commercial losses, data errors, missed filings, incorrect submissions, regulatory exposure, or any other damages arising from use of this software.

## Core Capabilities

| Area | Capability |
| --- | --- |
| CRM integration | Injects a right-side workbench into `https://crm.chinaexp365.com/cloud/*` as an isolated Shadow DOM UI. |
| Document handling | Uploads, previews, edits, and exports working copies of PDFs, DOCX files, images, spreadsheets, CSV files, and document notes. |
| AI-assisted extraction | Optionally sends PDFs to Gemini for structured CRM and trade-document field extraction after the user provides an API key. |
| Review-first autofill | Validates extracted fields, marks high-risk values, lets users select exactly which fields to fill, and never submits final CRM forms automatically. |
| Documentation workflow | Tracks order progress by `SC NO.` across a four-step Documentation Flow Matrix backed by IndexedDB. |
| Trade calculators | Includes RMB purchase contract pricing, export tax rebate profit review, and CIF D/A quotation calculations. |
| Quick links | Supports custom quick links and Chrome bookmark folder import through the extension background worker. |
| Bilingual UI | Provides Chinese and English UI modes without reloading the host CRM page. |

## Supported Domain

| Category | Supported |
| --- | --- |
| Host application | ChinaExp365 CRM pages matching `https://crm.chinaexp365.com/cloud/*`. |
| Runtime | Google Chrome or a Chromium browser with Manifest V3 extension support. |
| Build system | None. The extension runs directly from checked-in JavaScript, CSS, and bundled browser libraries. |
| Exchange-traded assets | Not supported. The extension does not trade stocks, crypto, FX, futures, options, or other financial instruments. |
| Trading venues | Not supported. There are no broker, exchange, OMS, EMS, FIX, or exchange API connectors. |
| Exchange-rate data | USD/CNY helper rates are fetched from public exchange-rate APIs when needed by calculator workflows. Users should verify against official rates before use. |

## Architecture Overview

```text
ChinaExp365 CRM page
  -> Manifest V3 content script
  -> Shadow DOM workbench
  -> document preview, extraction, validation, calculators, quick links
  -> selected-field CRM autofill
  -> Chrome storage + IndexedDB audit/workflow records
```

The extension favors explicit user control over automation:

- **No automatic CRM submission**: selected fields can be filled, but final form submission remains manual.
- **High-risk field review**: amounts, currencies, quantities, unit prices, HS codes, consignee names, port fields, ETD/ETA, and similar fields are validated and surfaced for review.
- **Local-first storage**: workflow state and audit records stay in browser storage unless the user configures an external AI provider.
- **Shadow DOM isolation**: workbench styling is isolated from the host CRM page.
- **No build-time dependency chain**: runtime dependencies are vendored in `vendor/`.

## Prerequisites

- Google Chrome, Microsoft Edge, or another Chromium browser with Manifest V3 support.
- Access to `https://crm.chinaexp365.com/cloud/*`.
- Local copy of this repository.
- Node.js is optional, but recommended for syntax checks with `node --check`.
- Optional: a Gemini API key for PDF Direct extraction.

## Installation

This extension is loaded directly as an unpacked Chrome extension. There is no compile, bundle, or package-install step.

1. Clone or download the repository.

   ```bash
   git clone <your-repository-url> lets-trade
   cd lets-trade
   ```

2. Open Chrome extensions.

   ```text
   chrome://extensions
   ```

3. Enable **Developer mode**.

4. Click **Load unpacked**.

5. Select the repository root folder:

   ```text
   lets-trade/
   ```

6. Open or reload the CRM page:

   ```text
   https://crm.chinaexp365.com/cloud/
   ```

7. Confirm that the right-side workbench appears after the CRM page finishes loading.

After editing extension files, reload the unpacked extension from `chrome://extensions`, then refresh the CRM tab so the updated content script is injected.

## Configuration

### Chrome Permissions

The extension requests the following permissions in `manifest.json`:

| Permission | Purpose |
| --- | --- |
| `storage` | Saves lightweight UI state, Gemini configuration, CRM mappings, and workflow state. |
| `bookmarks` | Imports quick links from Chrome bookmark folders. |
| `https://generativelanguage.googleapis.com/*` | Sends PDFs to Gemini only when configured by the user. |
| `https://api.frankfurter.app/*` | Fetches USD/CNY exchange-rate helper data for calculator workflows. |
| `https://open.er-api.com/*` | Fetches latest USD/CNY exchange-rate helper data when monthly data is unavailable. |

### Gemini PDF Extraction

Gemini extraction is optional. If no API key is saved, the Automation Hub falls back to rule-only extraction behavior.

Configure Gemini inside the workbench:

1. Open the CRM page with the extension loaded.
2. Go to **Auto Fill / Gemini Settings**.
3. Enter an API key and model.
4. Save settings.
5. Load a PDF through the Automation Hub.

The saved configuration is stored in Chrome extension storage under `crmWorkbenchGeminiExtractionConfig`.

Example configuration shape:

```json
{
  "apiKey": "YOUR_GEMINI_API_KEY",
  "model": "gemini-2.5-flash",
  "mode": "gemini_pdf_direct",
  "temperature": 0,
  "maxOutputTokens": 16384
}
```

Do not commit real API keys, customer documents, CRM exports, or production screenshots to this repository.

### Optional OpenAI-Compatible Vision Provider

The repository also contains `src/visionExtractionProvider.js`, an OpenAI-compatible vision extraction provider for layout-sensitive trade documents. It is disabled unless explicitly configured by code and requires endpoint, model, API key, and external-send confirmation before any document image or OCR text is sent outside the browser.

Example configuration shape:

```json
{
  "enabled": true,
  "provider": "openai_compatible",
  "confirmExternalSend": true,
  "endpoint": "https://api.example.com/v1/chat/completions",
  "model": "vision-model-name",
  "apiKey": "YOUR_PROVIDER_API_KEY",
  "sendImages": true,
  "sendOcrText": true
}
```

## Workflow

### TradeOps Automation Hub

```text
PDF or document text
  -> Gemini PDF Direct extraction or rule-only extraction
  -> structured CRM and trade-document fields
  -> review table
  -> validation warnings and blocking checks
  -> selected-field CRM autofill
  -> local audit trail
```

Safety behavior:

- The extension never submits the final CRM form.
- Only checked fields in the review table are filled.
- Failed high-risk values are not preselected for fill.
- Blocking validation issues must be corrected or intentionally reviewed before filling.
- Raw Gemini responses are available for inspection in the Automation Hub.

### Documentation Flow Matrix

The Documentation Flow Matrix tracks order documentation by `SC NO.` across four workflow pages:

1. Contract setup and requirement lock.
2. Inquiry, booking, and initial documents.
3. Label control, dispatch, and warehouse check.
4. Customs, BL confirmation, and dispatch closeout.

Records are stored locally in IndexedDB. Uploaded workflow images are kept out of `chrome.storage.local` to avoid extension storage limits.

### Calculators

| Calculator | Purpose |
| --- | --- |
| RMB purchase contract price calculator | Calculates purchase-side contract amounts from USD price, weight, exchange rate, commission, miscellaneous fees, and tax rebate rate. |
| Export tax rebate profit calculator | Processes spreadsheet rows and appends profit, rebate, total profit, and tax/exchange ratio outputs. |
| CIF D/A quotation calculator | Calculates floor and ceiling quote prices with factory tax status, refund rate, logistics freight, financing days, Bank & DHL lump sum, and client rebate/commission. |

Calculator outputs should be treated as decision-support estimates and independently verified before use.

## Storage Model

| Storage | Data |
| --- | --- |
| `chrome.storage.local` | Gemini settings, active lightweight UI state, selected workflow state, and CRM field mappings. |
| `localStorage` | Language preference, quick links, removed default quick links, layout preferences, and optional provider settings. |
| `IndexedDB / DocFlowMatrixDB` | Documentation Flow Matrix order records and uploaded image blobs. |
| `IndexedDB / TradeOpsAutomationDB` | Extraction runs, autofill runs, audit records, and CRM mapping storage. |

## Source Layout

```text
manifest.json                         MV3 extension manifest
src/background.js                     bookmark access for quick-link import
src/content.js                        main Shadow DOM workbench and CRM workflow UI
src/exportPriceCalculator.js          CIF D/A quotation calculator logic
src/financialCalculator.js            spreadsheet profit and rebate calculations
src/customerCodeMap.js                customer code reference data
src/geminiExtractionProvider.js       Gemini PDF Direct extraction provider
src/automationExtractor.js            extraction mode orchestration
src/automationValidator.js            review-first validation rules
src/crmDomAdapter.js                  visible CRM field scanning and selected-field filling
src/automationAudit.js                IndexedDB audit log and mapping storage
src/automationSchema.js               canonical field metadata and mapping hints
src/automationOcr.js                  browser-side OCR helpers
src/documentImagePreprocessor.js      PDF page image conversion and preprocessing hooks
src/visionExtractionProvider.js       optional OpenAI-compatible vision provider
src/extractionSchema.md               extraction reference
docs/automation-manual-test.md        manual QA checklist
docs/sample-commercial-invoice.txt    local sample invoice text
vendor/                               bundled browser libraries and runtimes
```

## Development

Keep changes scoped to the workbench surface being modified. Calculator formulas, extraction mappings, validation rules, and CRM selectors should be changed deliberately and tested with relevant document samples.

Recommended development loop:

1. Edit source files under `src/`.
2. Run syntax checks.
3. Reload the unpacked extension in Chrome.
4. Refresh the CRM tab.
5. Re-test the affected workflow in the right-side workbench.

If Chrome reports `Extension context invalidated`, clear the old error, reload the extension, and refresh the CRM page before retesting.

## QA

Run JavaScript syntax checks:

```bash
node --check src/content.js
node --check src/exportPriceCalculator.js
node --check src/financialCalculator.js
node --check src/customerCodeMap.js
node --check src/geminiExtractionProvider.js
node --check src/automationExtractor.js
node --check src/automationValidator.js
node --check src/crmDomAdapter.js
node --check src/automationAudit.js
node --check src/automationSchema.js
node --check src/automationOcr.js
node --check src/documentImagePreprocessor.js
node --check src/visionExtractionProvider.js
```

Validate the manifest:

```bash
node -e "JSON.parse(require('fs').readFileSync('manifest.json', 'utf8')); console.log('manifest.json is valid JSON')"
```

Manual release checks:

- Confirm the extension reports version `0.6.2.2`.
- Reload the unpacked extension and refresh the CRM tab.
- Check Chinese and English UI modes.
- Verify sidebar collapse, resize behavior, and section navigation.
- Upload and preview supported file types.
- Test the Automation Hub with `docs/sample-commercial-invoice.txt`.
- Configure Gemini with a dummy test document before using production documents.
- Confirm validation blocks or flags high-risk values.
- Fill only selected CRM fields and confirm the CRM form is not submitted.
- Confirm CRM mappings persist after reload.
- Verify Documentation Flow Matrix dashboard, order creation, step navigation, and deletion.
- Verify all three calculator workflows.
- Run the checklist in `docs/automation-manual-test.md` before release.

## Release Notes

### `0.6.2.2`

Patch release from `0.6.2`.

- Moved fold/unfold and language controls to the top-left of the workbench.
- Restyled the AI Auto Fill panel to align with the rest of the workbench.
- Reordered workbench sections around upload, auto-fill, document flow, calculators, document editing, links, and action workflows.
- Added CIF D/A quotation controls for factory price tax status, tax refund rate, Bank & DHL lump-sum buffer, and client rebate/commission.
- Updated export quote floor and ceiling calculations for conditional tax refund handling and fixed order-level Bank & DHL cost allocation.

### `0.6.1`

Minor release from `0.5.3`.

- Added the TradeOps Automation Hub.
- Added Gemini PDF extraction, structured field extraction, validation, CRM field mapping, selected-field autofill, raw response preview, and local audit logs.
- Introduced new workflow screens, IndexedDB storage, Gemini integration, and automation modules.

## Security And Data Handling

- Treat all CRM records, purchase orders, invoices, sales contracts, packing lists, and customer documents as confidential.
- Do not use production customer documents with external AI providers unless your organization permits it.
- Review network behavior before enabling AI extraction in a regulated environment.
- Keep API keys out of source control.
- Prefer local samples from `docs/` for testing.
- Audit CRM autofill results before saving or submitting any CRM form.
