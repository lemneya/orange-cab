# RELEASE-GATE-0 — UI Evidence Pack

## Screenshot Status

| File | Route | Status |
|------|-------|--------|
| `01_ids_map.png` | `/ids/shadow-runs/:id/map` | ❌ Pending recapture (currently shows list page) |
| `02_sim_step4_roi.png` | `/simulator/day` Step 4 | ❌ Pending recapture (currently shows empty state) |
| `03_owner_cockpit.png` | `/owner` | ✅ Captured |
| `04_reports_narrative.png` | `/reports/runs/:id` | ❌ Pending recapture (currently shows dashboard) |
| `05_admin_broker_accounts.png` | `/admin/broker-accounts` | ✅ Captured |
| `06_admin_rate_cards.png` | `/admin/rate-cards` | ✅ Captured |

## Recapture Needed (3 screenshots)

1. **`01_ids_map.png`** - Must show `/ids/shadow-runs/:id/map` with route ribbons + numbered nodes + right drawer open
2. **`02_sim_step4_roi.png`** - Must show `/simulator/day` Step 4 with ROI/Savings hero card + KPI comparison cards
3. **`04_reports_narrative.png`** - Must show `/reports/runs/:id` with narrative panel + checksum footer

## Notes

- Screenshots must be taken with DB-backed demo data (not empty state)
- No PHI. Aggregates only.
- Verification: MySQL 8.0, localhost:3001, 1920x1080 viewport
