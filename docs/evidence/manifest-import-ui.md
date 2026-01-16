# IDS-MANIFEST-0: Broker Manifest Import Evidence

## Screenshot 1: Manifest Import Upload Page

The Manifest Import page at `/ids/manifest-import` shows:

1. **Progress Steps**: Upload → Preview → Importing → Complete
2. **Partition Selection (Required)**:
   - Company (OpCo): Sahrawi Transportation / Metrix Medical Transport
   - Funding Account: Modivcare-Sahrawi / Modivcare-Metrix / MTM Main / Access2Care Main
3. **File Upload**: Drag-and-drop interface for CSV/PDF files
4. **Supported Formats**:
   - PDF: Modivcare Manifest (Sahrawi/Metrix)
   - CSV: MTM Export, Access2Care Export
5. **PHI Protection Warning**: Automatic stripping of patient names, phones, DOB, addresses, SSN, email

## Key Features

- Partition selection is **required** before upload (enforced by UI)
- Dropdowns populated from Admin tables (not hardcoded)
- PHI protection warning clearly visible
- 4-step wizard for guided import process

## Format Adapters

| Format | File Type | Description |
|--------|-----------|-------------|
| modivcare_pdf_sahrawi | PDF | Modivcare manifest for Sahrawi |
| modivcare_pdf_metrix | PDF | Modivcare manifest for Metrix |
| mtm_csv | CSV | MTM export |
| a2c_csv | CSV | Access2Care export |
