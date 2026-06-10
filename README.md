# CRM Embedded Workbench

Version: `0.6.0`

Manifest V3 Chrome extension for `https://crm.chinaexp365.com/cloud/*`. It injects a right-side Shadow DOM workbench into the CRM page for document upload, CRM field extraction, financial calculators, quick links, and the Documentation Flow Matrix.

## Release Notes

### 0.6.0

Minor release from `0.5.3`. This version adds the TradeOps Automation Hub, including local PDF/Word intake, scanned-PDF OCR, structured field extraction, validation, CRM field mapping, selected-field autofill, and local audit logs. The bump is minor rather than patch because the extension now includes new workflow screens, new IndexedDB storage, new vendored OCR/PDF runtimes, and new automation modules.

## Install

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select this project folder.
5. Reload the CRM page after every extension reload.

There is no build step. The extension runs plain browser JavaScript from `src/` and bundled vendor files from `vendor/`.

## Current Modules

- Document/image/spreadsheet upload and preview.
- Editable document notes area.
- CRM extraction and autofill helpers.
- RMB purchase contract price calculator.
- Export tax rebate profit calculator.
- Quick links with Chrome bookmark import.
- Bilingual UI toggle: Chinese and English.
- Documentation Flow Matrix (`单证流水推进矩阵`).
- Quick Reference Drawer (`关键信息面板`) for high-frequency Doc Flow fields.
- TradeOps Automation Hub for local PDF/Word intake, scanned-PDF OCR, field extraction, human review, validation, CRM field mapping, selected-field autofill, and IndexedDB audit logs.

## TradeOps Automation Hub

The Automation Hub adds a review-first workflow inside the existing Shadow DOM sidebar:

```text
PDF/Word upload / scanned-PDF OCR / extracted text / manual notes
  -> structured field extraction
  -> human review table
  -> validation warnings
  -> selected-field CRM autofill
  -> local audit log
```

Document processing, OCR, and local extraction are local-only. DOCX text is extracted with Mammoth, text-based PDFs use the existing embedded-text extractor, and scanned PDFs are rendered locally with PDF.js before OCR with vendored Tesseract.js assets from `vendor/tesseract/`. Extraction then uses browser JavaScript regex/rule matching from the editable document text already shown in the workbench.

An optional OpenAI-compatible vision extraction provider exists for layout-sensitive PO/SC PDFs, but it is disabled by default. It requires explicit endpoint/model/API key configuration and an explicit confidentiality confirmation before any document image or OCR text can be sent outside the browser. If vision is not configured, the default extraction mode remains local rule extraction.

Input scope:

- Supported end-to-end: `.pdf`, `.docx`, `.jpg`, `.jpeg`, `.png`.
- Text-based PDFs use embedded text first.
- Scanned PDFs OCR the first 5 pages locally by default.
- Legacy `.doc` files are not reliably parseable in browser JavaScript; save them as `.docx` or PDF first.

Safety model:

- The extension never submits final CRM forms automatically.
- High-risk fields such as amount, currency, quantity, unit price, HS code, consignee, container number, ETD, ETA, and insurance values are visually marked for review.
- Low-confidence extracted fields are highlighted for review.
- Blocking validation issues disable CRM fill until the user edits the data or explicitly confirms manual review.
- Failed high-risk values are not pre-checked for CRM fill.
- Only checked fields in the review table are sent to CRM fill.
- The review table shows extraction method, page, evidence, confidence, risk, validation status, and any AI/rule conflict.

CRM mapping:

- `Scan CRM fields` lists visible CRM inputs, textareas, selects, contenteditable fields, and common framework select controls.
- Users can map canonical trade fields to scanned CRM field candidates.
- `Save mapping` stores selectors and label hints locally for reuse.

## Documentation Flow Matrix

The Doc Flow Matrix tracks documentation work by `SC NO.` across four pages:

1. Contract setup and requirement lock.
2. Inquiry, booking, and initial documents.
3. Label control, dispatch, and warehouse check.
4. Customs, BL confirmation, and dispatch closeout.

The dashboard lists active orders and supports opening or deleting orders. Workflow navigation uses completed-step breadcrumbs plus bottom navigation. Step 1 only requires official customer PO confirmation; `客户特殊需求备注` remains optional but is still highlighted in the Quick Reference Drawer.

Step 4 `交单寄件审核` currently includes:

- `全套结汇资料送交银行并由 DHL 寄出`
- `客户的CI/PL/标签为签字版`
- `标签，报关单等资料的信息准确无误`

## Storage Model

The extension UI is a view/controller. It should not keep heavy records in `chrome.storage.local`.

- `chrome.storage.local`: active lightweight UI state only, such as active order and current step.
- `IndexedDB` database `DocFlowMatrixDB`: Doc Flow order records and uploaded image blobs.
- `IndexedDB` database `TradeOpsAutomationDB`: Automation extraction runs, autofill runs, and CRM field mappings.
- `SC NO.` is the primary workflow key.

This separation is important because uploaded photos and long records can become too large for Chrome extension storage.

## Source Layout

- `manifest.json`: MV3 extension manifest.
- `src/content.js`: main Shadow DOM workbench, Doc Flow Matrix, UI event handling, CRM automation helpers.
- `src/background.js`: bookmark folder/link access for quick-link import.
- `src/financialCalculator.js`: financial calculation helpers.
- `src/customerCodeMap.js`: customer code mappings.
- `src/automationSchema.js`: canonical trade fields, document types, labels, risk levels, validation rule metadata, and default CRM mapping hints.
- `src/documentImagePreprocessor.js`: browser-side PDF page image conversion and preprocessing hooks for OCR/vision workflows.
- `src/visionExtractionProvider.js`: disabled-by-default OpenAI-compatible vision extraction provider with strict JSON/evidence normalization.
- `src/automationExtractor.js`: local deterministic field extraction from editable document text.
- `src/automationValidator.js`: review-first validation for extracted trade fields.
- `src/crmDomAdapter.js`: CRM DOM scanning and selected-field filling.
- `src/automationAudit.js`: local IndexedDB audit log and field mapping storage.
- `src/automationOcr.js`: local OCR wrapper around vendored Tesseract.js and PDF.js assets.
- `src/extractionSchema.md`: field extraction reference.
- `docs/automation-manual-test.md`: manual QA checklist for regression and Automation Hub workflows.
- `docs/sample-commercial-invoice.txt`: fake invoice text for local extraction testing.
- `docs/sample-po-sc-55-5237-expected.json`: expected values for the PO/SC 55-5237 extraction regression.
- `docs/test-po-sc-55-5237.md`: manual regression checklist for scanned PO/SC extraction failures.
- `vendor/mammoth.browser.min.js`: DOCX preview support.
- `vendor/xlsx.full.min.js`: spreadsheet parsing support.
- `vendor/tesseract/`: local OCR runtime, worker, WASM core, and English/Simplified Chinese traineddata.
- `vendor/pdfjs/`: local PDF page renderer used for scanned-PDF OCR.

## Development Notes

- Reload the unpacked extension after editing extension files.
- Then reload the CRM tab so the new content script is injected.
- If Chrome shows `Extension context invalidated` immediately after reload, clear the old error and retest with the refreshed CRM tab.
- Keep CRM host styles isolated by adding UI inside the workbench Shadow DOM only.
- Keep new features scoped; avoid changing existing calculators or extraction mappings unless the task explicitly requires it.

## QA Checklist

- Run `node --check src/content.js`.
- Run `node --check src/automationSchema.js`.
- Run `node --check src/documentImagePreprocessor.js`.
- Run `node --check src/visionExtractionProvider.js`.
- Run `node --check src/automationExtractor.js`.
- Run `node --check src/automationValidator.js`.
- Run `node --check src/crmDomAdapter.js`.
- Run `node --check src/automationAudit.js`.
- Run `node --check src/automationOcr.js`.
- Confirm `manifest.json` parses and reports the expected version.
- Reload the unpacked extension.
- Reload the CRM tab.
- Check both Chinese and English UI modes.
- Check Doc Flow dashboard, order creation/opening, Step 1-4 navigation, Quick Reference Drawer, and copy toast.
- Verify dashboard action buttons remain inside the workbench at the current sidebar width.
- Check the Automation Hub with `docs/sample-commercial-invoice.txt`: extract, edit, validate, scan CRM fields, map at least three fields, fill selected fields, confirm no CRM submit happens, and reload to confirm mappings persist.
- Run the full manual checklist in `docs/automation-manual-test.md` before release.
