# OC-SIM-0: One-Day Proof Simulator

## Overview

The One-Day Proof Simulator is a **sales tool** designed to demonstrate the value of the Intelligent Dispatch System (IDS) using just one day of real operational data.

**Sales Pitch**: *"Give me one day. I will show you exactly how much you can save."*

## Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/simulator/day` | OneDaySimulator | Main 4-step wizard |
| `/simulator/runs/:id` | SimRunViewer | Simulation run detail |
| `/simulator/packs/:id` | ProofPackViewer | Shareable proof pack |

## User Flow

### Step 1: Demand In
- Select OpCo + Broker Account + Service Date
- Upload broker manifest (PDF/CSV)
- Preview: total rows, scheduled trips, canceled, wheelchair, will-call
- Badge: "Nothing Dropped" confirms all rows accounted

### Step 2: Shadow Run
- Toggle: Use Locks, Allow Options
- Run IDS optimization
- View predicted KPIs:
  - On-time %
  - Deadhead miles
  - Driver pay
  - Unassigned count
- Vehicle summary table with flags
- CTA: Open Map Replay

### Step 3: Actual In
- Upload completed trips export from MediRoute
- Quality checks: timestamps, vehicle IDs, status field
- Summary: completed, canceled, no-shows, late pickups
- Badges: PHI Stripped, Nothing Dropped

### Step 4: Compare + Proof Pack
- Side-by-side KPI comparison (IDS vs Actual)
- Estimated savings with breakdown:
  - Deadhead reduction
  - Payroll optimization
  - Penalty risk reduction
- Top 5 causes of difference
- Per-driver delta table
- Generate Proof Pack button

## Proof Pack Features

The shareable proof pack includes:

1. **Savings Hero Card**
   - Daily savings amount
   - Annual projection (260 days)

2. **KPI Comparison Cards**
   - On-time performance with progress bar
   - Deadhead miles with progress bar
   - Driver pay with progress bar

3. **AI-Generated Narrative**
   - Executive summary
   - Key findings
   - Savings breakdown table
   - Top improvement areas
   - Conclusion with ROI projection

4. **Evidence Section**
   - Snapshot checksum
   - Import audit IDs
   - PHI Stripped badge
   - SSOT Guarantee badge

## Database Schema

### sim_runs
Tracks simulation progress through the 4 steps:
- `opco_id`, `broker_account_id`, `service_date` (scope)
- `demand_step`, `shadow_step`, `actual_step`, `proof_step` (status)
- `manifest_import_id`, `shadow_run_id`, `actual_import_id`, `proof_pack_id` (refs)

### proof_packs
Shareable proof packs with:
- `pack_id` (e.g., "PP-20260116-001")
- `kpis_json` (aggregate KPIs only, no PHI)
- `narrative_markdown` (AI-generated report)
- `narrative_style` (INTERNAL | CLIENT)
- `snapshot_checksum`, `import_audit_ids` (evidence)
- `expires_at` (optional expiry for shared links)

### sim_compare_results
Cached comparison results:
- KPI deltas (on-time, deadhead, pay)
- Demand loss metrics
- Estimated savings with breakdown
- Top causes array
- Per-driver deltas

## Technical Patterns

1. **PHI Protection**: Proof packs contain only aggregate KPIs
2. **SSOT Guarantee**: Narratives generated from snapshot JSON only
3. **Evidence Trail**: Checksums preserved for audit
4. **Idempotency**: File hash prevents duplicate imports
5. **Partitioning**: All data partitioned by (opco_id, broker_account_id, service_date)

## Acceptance Criteria

- [x] Demo shows clear ROI proof in < 3 minutes
- [x] PHI stripped from all proof packs
- [x] SSOT guarantee: narratives use only snapshot JSON
- [x] Evidence section shows checksums for audit
- [x] Navigation integrated in sidebar

## PR

**PR #19**: https://github.com/lemneya/orange-cab/pull/19

## Next Steps

1. Connect to real tRPC endpoints
2. Add PDF export functionality
3. Integrate with existing manifest/actual import flows
4. Add map replay split-screen view
5. Implement proof pack sharing with expiry links
