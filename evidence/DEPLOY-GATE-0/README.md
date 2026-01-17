# DEPLOY-GATE-0: Evidence Checklist

## Gate Information

| Field | Value |
|-------|-------|
| **Gate ID** | DEPLOY-GATE-0 |
| **Release Tag** | `oc-ids-rg0-20260117` |
| **Runbook** | [docs/deploy/DEPLOY-GATE-0_RUNBOOK.md](../../docs/deploy/DEPLOY-GATE-0_RUNBOOK.md) |
| **Created** | 2026-01-17 |

---

## Gate Checklist (Pass/Fail Only)

> **Instructions**: Mark each item as PASS or FAIL. All items must PASS for gate approval.

### 1. Release Verification

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1.1 | Tag used = `oc-ids-rg0-20260117` | ☐ PASS / ☐ FAIL | |
| 1.2 | Deployed from exact tag (not HEAD/main) | ☐ PASS / ☐ FAIL | |

### 2. Database

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 2.1 | Pre-migration backup created | ☐ PASS / ☐ FAIL | |
| 2.2 | Backup log attached (`db-backup.log`) | ☐ PASS / ☐ FAIL | |
| 2.3 | Migration succeeded | ☐ PASS / ☐ FAIL | |
| 2.4 | Migration log attached (`migrate.log`) | ☐ PASS / ☐ FAIL | |

### 3. Health Check

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 3.1 | Health endpoint returns HTTP 200 | ☐ PASS / ☐ FAIL | |
| 3.2 | Health log attached (`health.log`) | ☐ PASS / ☐ FAIL | |

### 4. Smoke Test Screenshots (6 Required)

| # | Route | File | Status |
|---|-------|------|--------|
| 4.1 | `/owner` | `smoke_01_owner.png` | ☐ PASS / ☐ FAIL |
| 4.2 | `/admin/broker-accounts` | `smoke_02_admin_broker_accounts.png` | ☐ PASS / ☐ FAIL |
| 4.3 | `/admin/rate-cards` | `smoke_03_admin_rate_cards.png` | ☐ PASS / ☐ FAIL |
| 4.4 | `/ids/shadow-runs/:id/map` | `smoke_04_ids_map.png` | ☐ PASS / ☐ FAIL |
| 4.5 | `/simulator/day` (Step 4 ROI) | `smoke_05_simulator_roi.png` | ☐ PASS / ☐ FAIL |
| 4.6 | `/reports/runs/:id` | `smoke_06_reports_run.png` | ☐ PASS / ☐ FAIL |

### 5. Rollback Verification

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 5.1 | Rollback procedure documented | ☐ PASS / ☐ FAIL | See runbook |
| 5.2 | Rollback tested (if executed) | ☐ PASS / ☐ FAIL / ☐ N/A | |
| 5.3 | Rollback log attached (if executed) | ☐ PASS / ☐ FAIL / ☐ N/A | `rollback.log` |

### 6. Security & Compliance

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 6.1 | No PHI in screenshots | ☐ PASS / ☐ FAIL | |
| 6.2 | No PHI in logs | ☐ PASS / ☐ FAIL | |
| 6.3 | No secrets/credentials in evidence | ☐ PASS / ☐ FAIL | |
| 6.4 | PHI review log attached (`phi-review.log`) | ☐ PASS / ☐ FAIL | |

---

## Evidence Files

### Required Files

```
evidence/DEPLOY-GATE-0/
├── README.md                           # This checklist
├── db-backup.log                       # Database backup log/reference
├── migrate.log                         # Migration output
├── health.log                          # Health check output
├── phi-review.log                      # PHI review confirmation
├── smoke_01_owner.png                  # Owner cockpit
├── smoke_02_admin_broker_accounts.png  # Broker accounts
├── smoke_03_admin_rate_cards.png       # Rate cards
├── smoke_04_ids_map.png                # IDS map view
├── smoke_05_simulator_roi.png          # Simulator Step 4 ROI
├── smoke_06_reports_run.png            # Reports run with narrative
└── templates/                          # Template files (no secrets)
    └── .gitkeep
```

### Conditional Files (if rollback executed)

```
evidence/DEPLOY-GATE-0/
├── rollback.log                        # Rollback execution log
└── smoke_rollback_*.png                # Post-rollback screenshots
```

---

## Sign-off

### Gate Approval

| Role | Name | Date | Approved |
|------|------|------|----------|
| Deployer | | | ☐ |
| Reviewer | | | ☐ |
| QA | | | ☐ |

### Final Status

- [ ] **GATE PASSED** - All checks PASS, evidence complete
- [ ] **GATE FAILED** - One or more checks FAIL

---

## Notes

_Add any deployment notes, issues encountered, or deviations from runbook here._

```
[Date] [Author] - Note
```
