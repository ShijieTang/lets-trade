# CRM PDF Extraction Schema

The extension should extract these values from an uploaded document or OCR text,
normalize them, then fill the CRM by matching the CRM field name.

## Header
- `合同审批单号`: generated as `YS/DC/YSDC-CUSTOMCODEYYYYMMDD` unless the document already has one.
- `签订日期`: PO date, contract date, or SC date. Normalize to `YYYY-MM-DD`.
- `客户订单号`: PO number / purchase order number.
- `报价单号`: quotation number, if present.

## Basic Information
- `购销方式`: default `以销定购`.
- `客户`: buyer / customer / consignee company name. Fill by opening the CRM customer picker, searching `客商名称`, selecting the best row, then clicking `确定`.
- `国别地区`: buyer country or destination country.
- `联系人`: contact / attention person, if present.
- `备注`: remarks, if present.

## Amount Information
- `币种`: currency such as `USD`.
- `汇率`: exchange rate, if present.
- `合同总金额`: total contract amount.
- `美元总金额`: USD total amount.
- `付款方法`: payment terms, e.g. `D/A`, `T/T`, `L/C`, commission.

## Shipping Information
- `交货期限`: delivery term/time.
- `运输方式`: shipment method such as `By Sea`.
- `装运港`: port of loading.
- `目的港`: destination/discharge port.
- `装运港国家(地区)`: loading country.
- `目的港国家(地区)`: destination country.
- `目的地`: final destination.
- `成交方式`: Incoterm such as `CIF`, `FOB`, `CFR`.
- `溢装率`: default `5%`.
- `短装率`: default `5%`.
- `唛头`: shipping mark.

## Custom Information
- `CAS NO`: CAS number, if present.
- `报关SC NO`: sales contract number for customs declaration.
- `佣金说明`: commission note, if present.

## Product Information
- Search product by Chinese or English product name.
- Select the best matching product row and confirm.
- Fill product row:
  - `数量`
  - `单位`
  - `单价`
  - `金额`

## Protected Fields
Do not modify these CRM fields:
- `状态`
- `业务员`
- `公司`
