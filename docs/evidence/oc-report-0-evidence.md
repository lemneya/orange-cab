# OC-REPORT-0 Evidence: Report Engine

## Weekly Ops (Internal) Report Generated

**Date Range**: 2026-01-09 to 2026-01-16

### Executive Summary KPIs
| Metric | Value |
|--------|-------|
| Total Revenue | $8,300.00 |
| Total Expenses | $7,147.32 |
| Net Margin | $1,152.68 |
| Margin % | 13.9% |

### Payroll Summary
| Driver | Trips | Miles | Pay |
|--------|-------|-------|-----|
| John Smith | 80 | 1,493 | $842.40 |
| Maria Garcia | 72 | 1,043 | $1,068.18 |
| James Wilson | 64 | 989 | $953.28 |
| Sarah Johnson | 80 | 1,435 | $935.02 |
| Michael Brown | 72 | 1,124 | $910.09 |
| **Total** | **368** | **6,084** | **$4,708.97** |

### Trip Metrics
| Metric | Value |
|--------|-------|
| Total Trips | 360 |
| Completed | 332 (92.2%) |
| Canceled | 18 (5.0%) |
| No-Shows | 10 (2.8%) |
| On-Time Rate | 92.4% |

### Fuel & Tolls
| Vehicle | Fuel Cost | Toll Cost | Total |
|---------|-----------|-----------|-------|
| OC-101 | $292.62 | $64.79 | $357.41 |
| OC-102 | $288.49 | $67.03 | $355.52 |
| OC-103 | $291.49 | $67.73 | $359.22 |
| OC-104 | $286.03 | $65.60 | $351.63 |
| OC-105 | $285.41 | $65.16 | $350.57 |

### IDS Shadow Run Analysis
| Metric | Predicted | Actual | Delta |
|--------|-----------|--------|-------|
| On-Time Rate | 93.5% | 90.0% | +3.5% |
| Deadhead Miles | 364 mi | 434 mi | 70 mi saved |
| Total Pay | $20,255 | $21,480 | $1,225 saved |

### Audit Trail
- **Generated**: 1/15/2026, 9:53:09 PM
- **Data Sources**: summary, payroll, trips, fuelTolls, ids
- **Row Counts**: 
  - payroll_records: 5
  - shadow_runs: 8
  - fuel_transactions: 5
  - toll_transactions: 60
  - trips: 360

### Artifacts
| File | Type | Size |
|------|------|------|
| report_1_kpis.json | JSON | 3 KB |

## Acceptance Criteria Met

1. ✅ Generate "Weekly Ops (Internal)" report for a date range → renders + exports PDF
2. ✅ Report JSON stored and matches UI numbers
3. ✅ No PHI in report artifacts (aggregate only)
