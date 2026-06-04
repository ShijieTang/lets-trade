# CRM Embedded Workbench

Version: `0.5.3`

Manifest V3 Chrome extension for `https://crm.chinaexp365.com/cloud/*`. It injects a right-side Shadow DOM workbench into the CRM page for document upload, CRM field extraction, financial calculators, quick links, and the Documentation Flow Matrix.

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
- `SC NO.` is the primary workflow key.

This separation is important because uploaded photos and long records can become too large for Chrome extension storage.

## Source Layout

- `manifest.json`: MV3 extension manifest.
- `src/content.js`: main Shadow DOM workbench, Doc Flow Matrix, UI event handling, CRM automation helpers.
- `src/background.js`: bookmark folder/link access for quick-link import.
- `src/financialCalculator.js`: financial calculation helpers.
- `src/customerCodeMap.js`: customer code mappings.
- `src/extractionSchema.md`: field extraction reference.
- `vendor/mammoth.browser.min.js`: DOCX preview support.
- `vendor/xlsx.full.min.js`: spreadsheet parsing support.

## Development Notes

- Reload the unpacked extension after editing extension files.
- Then reload the CRM tab so the new content script is injected.
- If Chrome shows `Extension context invalidated` immediately after reload, clear the old error and retest with the refreshed CRM tab.
- Keep CRM host styles isolated by adding UI inside the workbench Shadow DOM only.
- Keep new features scoped; avoid changing existing calculators or extraction mappings unless the task explicitly requires it.

## QA Checklist

- Run `node --check src/content.js`.
- Confirm `manifest.json` parses and reports the expected version.
- Reload the unpacked extension.
- Reload the CRM tab.
- Check both Chinese and English UI modes.
- Check Doc Flow dashboard, order creation/opening, Step 1-4 navigation, Quick Reference Drawer, and copy toast.
- Verify dashboard action buttons remain inside the workbench at the current sidebar width.
