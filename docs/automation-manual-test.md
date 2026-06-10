# TradeOps Automation Hub Manual QA

## Load Extension

1. Open `chrome://extensions`.
2. Enable Developer mode.
3. Click `Load unpacked`.
4. Select this project folder.
5. Open `https://crm.chinaexp365.com/cloud/`.
6. Confirm the right-side workbench appears after the CRM page loads.

## Existing Functions Regression

1. Toggle Chinese and English mode. Confirm labels switch and the page does not reload.
2. Resize the sidebar. Confirm the CRM viewport resizes and the horizontal CRM scrollbar remains usable.
3. Collapse and expand the sidebar.
4. Upload document, image, PDF, DOCX, XLSX, XLS, and CSV samples.
5. Confirm image preview, PDF text extraction area, DOCX preview, and table preview still render.
6. Edit document notes in the document area.
7. Run the RMB purchase contract price calculator.
8. Run the export tax rebate profit calculator.
9. Open, add, edit, remove, and import quick links.
10. Open the Documentation Flow Matrix dashboard.
11. Create a new order, open it, delete a test order, and verify records stay in `DocFlowMatrixDB`.
12. Navigate Step 1 through Step 4.
13. Open and close the Quick Reference Drawer.
14. Use the existing CRM upload helper and confirm it still sends the selected file to the CRM attachment modal.

## Automation Happy Path

1. Open `docs/sample-commercial-invoice.txt`.
2. Paste the invoice text into the editable document area.
3. Click `自动化` / `Auto` in the section navigation.
4. Click `从当前文档识别字段` / `Extract fields from current document`.
5. Confirm the review table includes invoice number, invoice date, PO number, SC number, incoterms, payment term, currency, total amount, product, quantity, unit price, gross weight, net weight, volume, HS code, POL, POD, ETD, and ETA.
6. Confirm high-risk fields are visually marked and checked by default.
7. Edit at least one extracted value in the review table.
8. Click `Validate`.
9. Confirm blocking issues and warnings update.
10. Click `Scan CRM fields`.
11. Confirm visible CRM inputs, selects, textareas, and selector candidates appear.
12. Map at least three canonical fields to CRM field candidates.
13. Click `Save mapping`.
14. Select only the fields to fill.
15. Click `Fill selected fields to CRM`.
16. Confirm the visible CRM fields update.
17. Confirm the CRM form is not submitted.
18. Reload the CRM page, scan again, and confirm saved mappings are reused.
19. Confirm extraction and fill audit status updates in the Automation Hub.

## OCR Happy Path

1. Upload a DOCX invoice through the workbench upload area.
2. Click `自动化` / `Auto`.
3. Click `处理当前 PDF/Word 并识别字段` / `Process current PDF/Word and extract fields`.
4. Confirm DOCX text is inserted into the editable document area and the review table is populated.
5. Upload a text-based PDF invoice.
6. Click `Process current PDF/Word and extract fields`.
7. Confirm embedded PDF text is used and the review table is populated.
8. Upload a scanned PDF invoice.
9. Click `Process current PDF/Word and extract fields`.
10. Confirm OCR progress appears, PDF pages are rendered locally, and no external network request is made.
11. Confirm OCR text is inserted into the editable document area.
12. Confirm the review table is populated from OCR text.
13. Edit any OCR mistakes in the review table.
14. Click `Validate`.
15. Fill selected fields only and confirm the CRM form is not submitted.
16. Upload a legacy `.doc` file and confirm the UI asks to save it as `.docx` or PDF first.

## PO/SC 55-5237 Regression

1. Run the workflow in `docs/test-po-sc-55-5237.md`.
2. Compare extracted values with `docs/sample-po-sc-55-5237-expected.json`.
3. Confirm invalid high-risk values such as quantity `5.2026`, amount `10`, and HS code `5500005237` are blocked or left unchecked for CRM filling.
4. To inspect extraction internals, set `localStorage.crmAutomationDebugEnabled = "true"` in the CRM page console, reload, and open the `Extraction Debug` panel.

## Failure And Safety Tests

1. Paste low-confidence unstructured text and extract. Confirm low-confidence rows are yellow and require review.
2. Remove required values such as currency or total amount. Confirm missing required values appear as warnings, not automatic submission.
3. Enter `ETD: 2026-07-10` and `ETA: 2026-07-01`. Confirm validation blocks fill until fixed or manually confirmed.
4. Enter `Gross Weight: 900 KGS` and `Net Weight: 1000 KGS`. Confirm validation blocks fill until fixed or manually confirmed.
5. Enter an invalid container number such as `ABC123`. Confirm validation blocks fill until fixed or manually confirmed.
6. If the CRM form is inside an iframe, scan and fill visible fields there when accessible.
7. Confirm hidden, disabled, and read-only CRM fields are skipped by default.
8. Confirm fill reports list filled, skipped, and error counts.
9. Confirm no document data leaves the browser and no external network call is made by the Automation Hub.

## Required Syntax Checks

Run:

```sh
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

Also confirm `manifest.json` parses, includes `vendor/tesseract/tesseract.min.js`, includes the new automation scripts before `src/content.js`, and exposes `vendor/tesseract/worker.min.js`, `vendor/tesseract/core/*`, `vendor/tesseract/lang/*`, `vendor/pdfjs/pdf.min.mjs`, `vendor/pdfjs/pdf.worker.min.mjs`, and `vendor/pdfjs/standard_fonts/*` as web-accessible resources.
