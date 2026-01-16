# IDS-PARTITION-0 Sanity Check Evidence

## PR #13 Merged Successfully ✅

### Import UI Shows Required Partition Selection

The Import UI now requires:
1. **Company (OpCo)**: Sahrawi Transportation / Metrix Medical Transport
2. **Funding Account**: Modivcare-Sahrawi / Modivcare-Metrix / MTM Main / Access2Care Main

Dropdowns are populated from Admin tables (not hardcoded).

### Screenshot Evidence
- Import page shows "Step 1: Select Company & Funding Account (Required)"
- PHI Protection warning displayed
- Data partitioning message: "This ensures data is partitioned correctly and prevents collisions between different broker manifests."

### Unit Tests Passing (7/7)
```
✓ should import same trip ID under different partitions without collision
✓ should prevent duplicate file import (idempotency)
✓ should allow same file under different partition (creates different batch)
✓ should filter trips by OpCo when querying
✓ should filter driver summary by broker account
✓ should return empty results when filtering by non-existent partition
✓ should filter imports by OpCo
```

### Seed Data Auto-Loaded
```
[Admin] Seeding default data...
[AUDIT] CREATE opcos#1 by system (Sahrawi)
[AUDIT] CREATE opcos#2 by system (Metrix)
[AUDIT] CREATE brokers#1 by system (Modivcare)
[AUDIT] CREATE brokers#2 by system (MTM)
[AUDIT] CREATE brokers#3 by system (Access2Care)
[AUDIT] CREATE broker_accounts#1 by system (Modivcare-Sahrawi)
[AUDIT] CREATE broker_accounts#2 by system (Modivcare-Metrix)
[AUDIT] CREATE broker_accounts#3 by system (MTM Main)
[AUDIT] CREATE broker_accounts#4 by system (A2C Main)
```
