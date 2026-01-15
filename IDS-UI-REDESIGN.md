# IDS Shadow Run Detail - UI Redesign

## Overview

The `/ids/shadow-runs/:id` page has been completely redesigned to match the Payroll look/feel with the exact UI layout blueprint provided.

## UI Layout Components

### 0) Top Header
- **Title**: "IDS Shadow Run"
- **Subtitle**: "Shadow optimization results (read-only) • Service Date: {date} • Algorithm: Greedy Baseline"
- **Action Buttons**:
  - Back to Shadow Runs
  - Download Report
  - Re-run Shadow (orange primary)
  - Compare to Actual (disabled)

### 1) KPI Cards Row (4 cards)

| Card | Metric | Click Action |
|------|--------|--------------|
| Trips Assigned | X of Y scheduled | - |
| Predicted On-Time | X% within pickup windows | - |
| Unassigned | X needs dispatch review | Jumps to Unassigned tab |
| Lock Violations | 0 (must be 0) | Red if > 0 |

### Mini KPI Strip
- Gap-Fill Wins: +X
- Est. Deadhead: X mi
- Drivers Used: X
- Runtime: Xs

### 2) Run Summary Panel

**Left Column - Metadata:**
- Run ID
- Service Date
- Run Timestamp
- Created By
- Input Source
- Driver / Vehicle / Trip Count
- Runtime

**Right Column - Controls:**
- Shadow badge
- Exceptions Only toggle
- Search input
- Flag badges (LOCKED ROUTES, LOW ON-TIME, HIGH MILEAGE)

### 3) Main Content Tabs

#### Tab A - Routes
- **Filters**: Driver, Vehicle, Status dropdowns
- **Table Columns**: Driver, Vehicle, Trips, Miles (est.), Start–End, On-Time %, Gap-Fill, Predicted Pay, Flags, Actions
- **Flags**: Lock-Sensitive, On-Time Risk, High Mileage
- **Drawer**: Route details with stops timeline, mini KPI cards

#### Tab B - Unassigned Trips
- **Table Columns**: Trip ID, Pickup Window, Pickup, Dropoff, Mobility, Required Vehicle, Reason, Suggested Fix, Actions
- **Reasons** (controlled vocabulary):
  - No available wheelchair unit
  - Time window conflict
  - Driver shift end constraint
  - Template lock prevents assignment
  - Vehicle unavailable (maintenance/lot)
  - Insufficient capacity
- **Drawer**: Trip details, constraint info, suggested drivers

#### Tab C - Template Locks
- **Violation Banner**: Red banner if violations > 0
- **Table Columns**: Template ID, Driver, Trips Locked, Lock Type, Source, Notes, Status
- **Status**: Respected (green) or Violated (red)

#### Tab D - Predicted Pay
- **Table Columns**: Driver, Trips, Miles, Rate Rule, Gross (pred), Adjustments, Net (pred), Flags, Actions
- **Totals Row**: Total Predicted Payout
- **Drawer**: Pay breakdown (Miles × Rate, Bonuses, Deductions, Final Predicted)

## Proof Run Results

| Metric | Value | Status |
|--------|-------|--------|
| Trips Assigned | 25/25 | ✅ 100% |
| On-Time % | 100% | ✅ Pass |
| Unassigned | 0 | ✅ Pass |
| Lock Violations | 0 | ✅ REQUIRED |
| Gap-Fill Wins | +25 | ✅ Pass |
| Total Predicted Pay | $500.00 | ✅ Pass |

## Live Preview

- Shadow Run Detail: https://3000-i7ovzyukmi46yk0af0pf9-fa5e1c92.us1.manus.computer/ids/shadow-runs/1

## PR

- Branch: `ids/ids-core-0-proof-day-ui`
- PR: https://github.com/lemneya/orange-cab/pull/6
