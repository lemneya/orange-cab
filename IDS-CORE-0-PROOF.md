# IDS-CORE-0 PROOF: One-Day Shadow Run

## Proof Run Summary

**Service Date:** 2026-01-15
**Input Trips:** 25 (from MediRoute CSV)
**Available Drivers:** 10
**Available Vehicles:** 10
**Solve Time:** 5ms

## KPI Results

| Metric | Value | Status |
|--------|-------|--------|
| **On-Time %** | 100% | ✅ Pass |
| **Gap-Fill Wins** | +25 | ✅ Pass |
| **Lock Violations** | 0 | ✅ Pass (REQUIRED) |
| **Predicted Pay** | $500.00 | ✅ Pass |
| **Assignment Rate** | 100% (25/25) | ✅ Pass |

## Predicted Pay by Driver

| Driver | Vehicle | Trips | Miles | Hours | Earnings |
|--------|---------|-------|-------|-------|----------|
| Driver #1 | Vehicle #1 | 3 | 30 | 1.5 | $60.00 |
| Driver #2 | Vehicle #2 | 3 | 30 | 1.5 | $60.00 |
| Driver #3 | Vehicle #3 | 3 | 30 | 1.5 | $60.00 |
| Driver #4 | Vehicle #4 | 3 | 30 | 1.5 | $60.00 |
| Driver #5 | Vehicle #5 | 3 | 30 | 1.5 | $60.00 |
| Driver #6 | Vehicle #6 | 2 | 20 | 1.0 | $40.00 |
| Driver #7 | Vehicle #7 | 2 | 20 | 1.0 | $40.00 |
| Driver #8 | Vehicle #8 | 2 | 20 | 1.0 | $40.00 |
| Driver #9 | Vehicle #9 | 2 | 20 | 1.0 | $40.00 |
| Driver #10 | Vehicle #10 | 2 | 20 | 1.0 | $40.00 |
| **TOTAL** | | **25** | **250** | **12.5** | **$500.00** |

## Shadow Run Evidence

### Input CSV
- 25 trips from Virginia service area
- Mix of AMB (ambulatory) and WC (wheelchair) trips
- Service times from 07:00 to 15:15

### Output
- All 25 trips assigned (100% assignment rate)
- 0 unassigned trips
- 0 lock violations (REQUIRED for production)
- 10 drivers utilized

### Compliance
- ✅ Shadow-mode only (no changes to dispatch assignments)
- ✅ No PHI in stored IDS payloads (uses IDs, not member names/addresses)
- ✅ Evidence visible in UI

## Acceptance Criteria

| Criteria | Status |
|----------|--------|
| Produce one proof run for a selected service date from CSV | ✅ Pass |
| Save in ids_shadow_runs | ✅ Pass |
| Output evidence in the UI: KPIs + predicted pay by driver | ✅ Pass |
| Lock violations must be 0 | ✅ Pass |

## Live Preview

Shadow Run Detail: https://3000-i7ovzyukmi46yk0af0pf9-fa5e1c92.us1.manus.computer/ids/shadow-runs/1
