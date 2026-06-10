# CRM Embedded Workbench

Version: `0.6.1`

A Manifest V3 Chrome extension for `https://crm.chinaexp365.com/cloud/*`.

The extension injects a right-side Shadow DOM workbench into the CRM page. It helps with document upload and preview, CRM field extraction, selected-field autofill, trade calculators, quick links, and the Documentation Flow Matrix.

## Highlights

- Right-side CRM workbench isolated in Shadow DOM.
- Upload and preview support for documents, PDFs, images, and spreadsheets.
- Editable document notes and extracted text area.
- CRM field extraction and selected-field autofill helpers.
- TradeOps Automation Hub with review-first validation and local audit logs.
- RMB purchase contract price calculator.
- Export tax rebate profit calculator.
- Quick links with Chrome bookmark import.
- Documentation Flow Matrix for tracking order document progress by `SC NO.`.
- Chinese and English UI toggle.

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select this project folder.
5. Reload the CRM page after every extension reload.

There is no build step. The extension runs plain browser JavaScript from `src/` and bundled browser libraries from `vendor/`.

## Release Notes

### 0.6.1

Minor release from `0.5.3`.

This release adds the TradeOps Automation Hub, including Gemini PDF extraction, structured field extraction, validation, CRM field mapping, selected-field autofill, raw Gemini response preview, and local audit logs.

The version bump is minor because the extension now includes new workflow screens, new IndexedDB storage, Gemini integration, and new automation modules.

## TradeOps Automation Hub

The Automation Hub is a review-first workflow inside the existing sidebar.

```text
PDF / Word / scanned PDF / image / manual notes
  -> text extraction or OCR
  -> structured field extraction
  -> human review table
  -> validation warnings
  -> selected-field CRM autofill
  -> local audit log
```

Supported input:

- `.pdf`
- `.docx`
- `.jpg`
- `.jpeg`
- `.png`

Extraction behavior:

- Text-based PDFs use embedded text first.
- Scanned PDFs render pages locally with PDF.js and OCR the first 5 pages by default.
- DOCX text is extracted locally with Mammoth.
- OCR uses vendored Tesseract.js assets from `vendor/tesseract/`.
- Legacy `.doc` files are not reliably parseable in browser JavaScript. Save them as `.docx` or PDF first.

Safety behavior:

- The extension never submits final CRM forms automatically.
- Only checked fields in the review table are filled into CRM.
- Low-confidence fields and high-risk fields are visually marked for review.
- Blocking validation issues disable CRM fill until the user edits the data or explicitly confirms manual review.
- Failed high-risk values are not pre-checked for fill.

High-risk examples include amount, currency, quantity, unit price, HS code, consignee, container number, ETD, ETA, and insurance values.

## Vision Extraction

An optional OpenAI-compatible vision extraction provider exists for layout-sensitive PO/SC PDFs.

It is disabled by default. To use it, the user must configure an endpoint, model, and API key, then explicitly confirm confidentiality before any document image or OCR text can be sent outside the browser.

If vision extraction is not configured, the default extraction mode remains local rule extraction.

## CRM Mapping

The Automation Hub can scan visible CRM inputs, textareas, selects, contenteditable fields, and common framework select controls.

Users can map canonical trade fields to CRM field candidates. Saved mappings are stored locally and reused in later sessions.

## Documentation Flow Matrix

The Doc Flow Matrix tracks documentation work by `SC NO.` across four workflow pages:

1. Contract setup and requirement lock.
2. Inquiry, booking, and initial documents.
3. Label control, dispatch, and warehouse check.
4. Customs, BL confirmation, and dispatch closeout.

The dashboard lists active orders and supports opening or deleting orders. Workflow navigation uses completed-step breadcrumbs plus bottom navigation.

Step 1 only requires official customer PO confirmation. `客户特殊需求备注` remains optional, but it is still highlighted in the Quick Reference Drawer.

Step 4 `交单寄件审核` includes:

- `全套结汇资料送交银行并由 DHL 寄出`
- `客户的CI/PL/标签为签字版`
- `标签，报关单等资料的信息准确无误`

## Storage

The extension keeps lightweight UI state in Chrome storage and larger workflow records in IndexedDB.

- `chrome.storage.local`: active lightweight UI state, such as active order and current step.
- `IndexedDB / DocFlowMatrixDB`: Doc Flow order records and uploaded image blobs.
- `IndexedDB / TradeOpsAutomationDB`: extraction runs, autofill runs, and CRM field mappings.
- `SC NO.`: primary workflow key.

This separation keeps uploaded photos and long workflow records out of Chrome extension storage limits.

## Source Layout

- `manifest.json`: MV3 extension manifest.
- `src/content.js`: main Shadow DOM workbench, Doc Flow Matrix, UI events, CRM automation helpers.
- `src/background.js`: bookmark folder/link access for quick-link import.
- `src/financialCalculator.js`: financial calculation helpers.
- `src/customerCodeMap.js`: customer code mappings.
- `src/automationSchema.js`: canonical trade fields, document types, risk levels, validation metadata, and default CRM mapping hints.
- `src/documentImagePreprocessor.js`: browser-side PDF page image conversion and preprocessing hooks.
- `src/visionExtractionProvider.js`: disabled-by-default OpenAI-compatible vision extraction provider.
- `src/automationExtractor.js`: local deterministic field extraction from editable document text.
- `src/automationValidator.js`: review-first validation for extracted trade fields.
- `src/crmDomAdapter.js`: CRM DOM scanning and selected-field filling.
- `src/automationAudit.js`: local IndexedDB audit log and field mapping storage.
- `src/automationOcr.js`: local OCR wrapper around vendored Tesseract.js and PDF.js assets.
- `src/extractionSchema.md`: field extraction reference.
- `docs/automation-manual-test.md`: manual QA checklist.
- `docs/sample-commercial-invoice.txt`: fake invoice text for local extraction testing.
- `docs/sample-po-sc-55-5237-expected.json`: expected values for PO/SC 55-5237 extraction regression.
- `docs/test-po-sc-55-5237.md`: manual regression checklist for scanned PO/SC extraction failures.
- `vendor/mammoth.browser.min.js`: DOCX preview support.
- `vendor/xlsx.full.min.js`: spreadsheet parsing support.
- `vendor/pdfjs/`: local PDF page renderer.
- `vendor/tesseract/`: local OCR runtime, worker, WASM core, and English/Simplified Chinese traineddata.

## Development

- Reload the unpacked extension after editing extension files.
- Reload the CRM tab so the new content script is injected.
- If Chrome shows `Extension context invalidated` after reload, clear the old error and retest with a refreshed CRM tab.
- Keep CRM host styles isolated by adding UI inside the workbench Shadow DOM.
- Keep changes scoped. Avoid changing calculators or extraction mappings unless the task requires it.

## QA Checklist

Run syntax checks:

```bash
node --check src/content.js
node --check src/automationSchema.js
node --check src/documentImagePreprocessor.js
node --check src/visionExtractionProvider.js
node --check src/automationExtractor.js
node --check src/automationValidator.js
node --check src/crmDomAdapter.js
node --check src/automationAudit.js
node --check src/automationOcr.js
```

Manual checks:

- Confirm `manifest.json` parses and reports the expected version.
- Reload the unpacked extension.
- Reload the CRM tab.
- Check both Chinese and English UI modes.
- Check Doc Flow dashboard, order creation/opening, Step 1-4 navigation, Quick Reference Drawer, and copy toast.
- Verify dashboard action buttons remain inside the workbench at the current sidebar width.
- Test the Automation Hub with `docs/sample-commercial-invoice.txt`.
- During Automation Hub testing, extract, edit, validate, scan CRM fields, map at least three fields, fill selected fields, confirm no CRM submit happens, and reload to confirm mappings persist.
- Run `docs/automation-manual-test.md` before release.
