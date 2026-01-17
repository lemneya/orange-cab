# RELEASE-GATE-0 — UI Evidence Pack

## Screenshot Status (6/6 ✅)

| File | Route | Status |
|------|-------|--------|
| `01_ids_map.png` | `/ids/shadow-runs/:id/map` | ✅ Captured |
| `02_sim_step4_roi.png` | `/simulator/day` Step 4 | ✅ Captured |
| `03_owner_cockpit.png` | `/owner` | ✅ Captured |
| `04_reports_narrative.png` | `/reports/runs/:id` | ✅ Captured |
| `05_admin_broker_accounts.png` | `/admin/broker-accounts` | ✅ Captured |
| `06_admin_rate_cards.png` | `/admin/rate-cards` | ✅ Captured |

## Evidence Details

- **Commit SHA**: Current main branch
- **Date**: Jan 17, 2026
- **Database**: MySQL 8.0 (localhost:3001)
- **Viewport**: 1920x1080 (Chromium)
- **Data**: Demo/seeded (no PHI, aggregates only)

## Screenshots Verified

1. **IDS Map** (`01_ids_map.png`) - Shadow run map with route ribbons, numbered nodes, right drawer
2. **Simulator ROI** (`02_sim_step4_roi.png`) - Step 4 with ROI/Savings hero card + KPI comparison
3. **Owner Cockpit** (`03_owner_cockpit.png`) - KPI cards, alerts, timeline, broker table
4. **Reports Narrative** (`04_reports_narrative.png`) - Narrative panel + checksum footer
5. **Admin Broker Accounts** (`05_admin_broker_accounts.png`) - Broker accounts management
6. **Admin Rate Cards** (`06_admin_rate_cards.png`) - Rate cards management
