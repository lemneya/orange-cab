# IDS-COMPARE-0: Actual Import UI Evidence

## Date: 2026-01-15

## Screenshot Evidence

### Actual Import Page (/ids/actual-import)

The Actual Import page is now live with:

1. **4-Step Progress Indicator**
   - Upload CSV
   - Review & Confirm
   - Importing...
   - Complete

2. **File Upload Interface**
   - Drag-and-drop support
   - CSV file validation
   - 50MB max file size

3. **PHI Protection Warning**
   - Clearly displays which fields will be stripped:
     - Patient names
     - Phone numbers
     - Dates of birth
     - Full addresses
     - SSN
     - Email addresses
   - Only retains: trip IDs, driver names, vehicle units, GPS coordinates, timestamps

## Sample Test Data

Created sample MediRoute completed trips CSV with:
- 15 trips
- 5 drivers (John Smith, Maria Garcia, Robert Lee, Sarah Kim, David Chen)
- Service date: 01/09/2026
- Includes PHI fields that will be stripped (Patient, Phone, DOB, Addresses)
- Includes safe fields (Trip Id, Driver, Vehicle, GPS coords, timestamps)

## API Endpoints Implemented

- `POST /api/ids/actual/preview` - Preview CSV with PHI detection
- `POST /api/ids/actual/import` - Import with PHI stripping
- `GET /api/ids/actual/imports` - List all imports
- `GET /api/ids/actual/import/:id` - Get import audit
- `GET /api/ids/actual/trips` - Get trips by service date
- `GET /api/ids/actual/driver-summary` - Get driver summary
- `GET /api/ids/compare` - Compare shadow run with actual

## Acceptance Criteria Status

- ✅ Actual Import UI at /ids/actual-import
- ✅ PHI stripping implemented (never stored)
- ✅ File hash idempotency (duplicate detection)
- ✅ "Nothing dropped" audit proof
- ✅ Compare tab integration
