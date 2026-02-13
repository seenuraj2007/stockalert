# Sample Tally Export Files

This directory contains sample export files that demonstrate the format expected by the DKS StockAlert Tally Import feature.

## Files

### 1. `tally-export-sample.xml`
A sample XML export file in Tally format containing 5 products with complete details including:
- Product name and SKU (alias)
- Category (parent group)
- Description
- Unit cost (rate)
- Opening stock quantity
- GST rate and HSN code

### 2. `tally-export-sample.csv`
A sample CSV export file containing 10 products with columns:
- Name - Product name
- SKU - Stock keeping unit / Product code
- Category - Product category/group
- Description - Product description
- Unit Cost - Purchase price
- Selling Price - Sale price/MRP
- Opening Stock - Current stock quantity
- Unit - Unit of measurement (PCS, KG, LTR, etc.)
- GST Rate - GST percentage (5, 12, 18, 28)
- HSN Code - Harmonized System of Nomenclature code

## How to Use

1. **For Testing**: Upload these files directly to the Tally Import feature in DKS StockAlert to see how the import works.

2. **As Template**: Use these files as templates to format your actual Tally export data.

3. **From Tally ERP 9 / Tally Prime**:
   - Go to Gateway of Tally > Display > List of Accounts > Stock Items
   - Press Alt+E (Export)
   - Select XML or CSV format
   - Save the file
   - Upload to DKS StockAlert

## Supported Column Names (CSV)

The importer automatically detects columns using these keywords:

- **Name**: name, product name, item name, stock item, product
- **SKU**: sku, alias, code, item code, product code
- **Category**: category, group, parent, type, under
- **Unit Cost**: cost, unit cost, purchase price, buying price, rate
- **Selling Price**: price, selling price, sale price, mrp, rate
- **Stock**: stock, quantity, opening stock, balance, qty
- **GST Rate**: gst, tax, gst rate, tax rate, gstrateduty
- **HSN Code**: hsn, hsn code, sac
- **Unit**: unit, uom, unit of measure, base unit

## Notes

- The importer automatically calculates reorder point as 20% of opening stock
- If selling price is not provided, it's calculated with 20% markup on unit cost
- If SKU is missing, one will be auto-generated from the product name
- GST rate should be a number (5, 12, 18, 28) without the % symbol
