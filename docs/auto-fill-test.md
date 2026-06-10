# Auto Fill Manual Test

## Setup

1. Open `chrome://extensions`.
2. Enable Developer Mode.
3. Click **Load unpacked** and select this extension folder.
4. Open the CRM page that matches `https://crm.chinaexp365.com/cloud/*`.
5. Confirm the sidebar still injects on the right, can collapse, and can resize.

## Gemini Extraction

1. Open the **Auto Fill** tab.
2. Expand **Gemini Settings**.
3. Enter a Gemini API key and confirm the model is `gemini-2.5-flash`.
4. Click **Gemini Settings** to save the configuration.
5. Click **Load PDF** and choose a sample PO/SC PDF.
6. Confirm the same PDF appears in the existing upload preview/document area.
7. Wait for the extracted review table.

Expected checks:

- Customer should be the real buyer/customer name, not `THE`.
- Quantity should include the commercial quantity and unit, for example `6480 KG`, not a date-like value such as `5.2026`.
- Total amount should be a currency/amount value, not a row number such as `10`.
- HS code should only appear when there is HS/HSN/customs/tariff evidence.
- Fields with low confidence or validation issues should show review status and remain safe to skip.

## Review And Validate

1. Edit any extracted value that is visibly wrong.
2. Uncheck fields that should not be filled.
3. Click **Validate Data**.
4. Confirm high-risk fields require review when confidence is below `0.8` or validation fails.

## CRM Field Detection And Fill

1. Keep the CRM form visible on the page.
2. Click **Fill CRM Fields**.
3. Confirm only checked fields that passed validation are filled.
4. Confirm the CRM page reacts as if values were typed manually.
5. Confirm the extension does not submit the CRM form.
6. If fields were matched correctly, click **Save Mapping**.
7. Reload the CRM page, repeat extraction, and confirm saved mappings improve matching.

## Audit Trail

1. After a fill operation, open DevTools for the CRM page.
2. Inspect IndexedDB.
3. Confirm `TradeOpsAutomationDB > fillLogs` contains a log with timestamp, document type, extracted fields, validation results, warnings, and fill status.
4. Confirm `TradeOpsAutomationDB > fieldMappings` contains saved selectors after **Save Mapping**.

## Regression Sweep

Confirm these existing features still work:

- Upload and preview for PDF, DOCX, images, and spreadsheets.
- Editable document text extraction for text-based PDFs.
- Quick Links and Chrome bookmark import.
- Documentation Flow Matrix.
- Purchase price calculator.
- Export tax rebate calculator.
- Existing **Extract & Fill CRM** regex/manual-copy flow.
- **Sync & Upload to CRM** attachment workflow.
