# PO/SC 55-5237 Extraction Regression Test

Use this checklist with `Approved PO SC 55-5237.pdf` or equivalent OCR text for the same purchase order / sales contract.

## Expected Workflow

1. Load the unpacked extension and reload the CRM page.
2. Upload or select the PO/SC PDF in the workbench.
3. Open `Auto`.
4. Click `Process current PDF/Word and extract fields`.
5. Confirm the processed PDF text appears in the editable document area.
6. Confirm the review table renders extracted fields with method, page, evidence, risk, status, edit control, and fill checkbox.
7. Click `Validate`.
8. Review warnings and blocking issues before any CRM fill.

## Expected Values

Compare against `docs/sample-po-sc-55-5237-expected.json`.

The workflow should prefer layout-aware evidence for:

- quantity: `6480 KG / 6,480 KGS`
- unit price: `USD 9.3000 / USD 9.30/KG`
- amount: `USD 60,264.000`
- HS code: `2922.9.90`
- CAS No: `156-87-6`
- payment term: `DA 90 days from the date of AWB / BOL`
- destination port: `NHAVA SHEVA SEA PORT / NHAVA SHEVA`
- incoterm: `CIF NHAVA SHEVA`

## Values That Must Not Pass Review Silently

The extension should not extract or pre-check these failed high-risk values for CRM filling:

- quantity = `5.2026`
- amount = `10`
- HS code = `5500005237`
- customer name = `THE`
- supplier name = corrupted OCR fragments

If any of those values appear, validation should show a warning or blocking issue. Blocking high-risk fields must stay unchecked until the user edits them or manually confirms review.

## CRM Fill Safety

1. Map at least three canonical fields to scanned CRM fields.
2. Fill selected fields.
3. Confirm the visible CRM fields update.
4. Confirm no CRM submit/save/final form action runs automatically.
5. Reload the page and confirm saved mappings still appear.
