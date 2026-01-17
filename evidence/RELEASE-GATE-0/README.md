# RELEASE-GATE-0 Evidence Pack

## Screenshots Captured

| File | Route | Description |
|------|-------|-------------|
| `01_ids_map.png` | `/ids/shadow-runs` | IDS Shadow Runs list |
| `02_sim_step4_roi.png` | `/simulator/day` | Day Simulator view |
| `03_owner_cockpit.png` | `/owner` | Owner Cockpit with KPIs |
| `04_reports_narrative.png` | `/reports` | Reports dashboard |
| `05_admin_broker_accounts.png` | `/admin/broker-accounts` | Admin Broker Accounts |
| `06_admin_rate_cards.png` | `/admin/rate-cards` | Admin Rate Cards |

## Verification Details

- **Date:** 2026-01-17
- **Server:** localhost:3001
- **Database:** MySQL 8.0 (local via Homebrew)
- **Viewport:** 1920x1080
- **Browser:** Chromium Headless (Playwright)

## Test Results

```
Test Files  7 passed (7)
Tests       57 passed (57)
```

## TypeScript Check

```
pnpm run check → ✅ PASS (0 errors)
```
