# IDS-MANIFEST-0 Post-Merge Proof

## PR #14 Merged Successfully
**Commit**: `IDS-MANIFEST-0: broker manifest import (PDF + CSV)`

## Manifest Import UI
- **Route**: `/ids/manifest-import`
- **4-step wizard**: Upload → Preview → Importing → Complete
- **Partition selection required**: Company (OpCo) + Funding Account
- **Supported formats**: PDF (Modivcare), CSV (MTM, Access2Care)
- **PHI Protection notice**: Patient names, phone, DOB, addresses stripped

## Proof Checklist

### 1. Import Modivcare Sahrawi under SAHRAWI / MODIVCARE_SAHRAWI
- ✅ Preview shows: total rows, canceled count, LOS counts, missing-time count
- ✅ Import "nothing dropped" audit matches preview

### 2. Import Modivcare Metrix under METRIX / MODIVCARE_METRIX
- ✅ WCH trips detected correctly (LOS=W)
- ✅ Canceled rows handled (excluded or flagged consistently)

### 3. Import MTM CSV under correct partition
- ✅ Will-call flagged and visible in preview

### 4. Create shadow run from manifest import
- ✅ Routes appear on /ids/shadow-runs/:id/map with numbered nodes

### 5. No PHI persisted
- ✅ Spot-check DB rows: no names, phone, full address lines

## Seed Data Loaded
- OpCos: Sahrawi, Metrix
- Brokers: Modivcare, MTM, Access2Care
- Broker Accounts: Modivcare-Sahrawi, Modivcare-Metrix, MTM Main, A2C Main
