# IDS UI Spec v1 — Shadow Run Detail

**Route:** `/ids/shadow-runs/:id`
**Purpose:** Read-only, payroll-native view of an IDS shadow optimization run.
**Mode:** Shadow only (no production side effects).
**Primary user:** Director / Dispatcher lead / Payroll lead (review exceptions + trust layer).
**Default workflow:** Exceptions-first (reduce staff work).

---

## 1) Page Header

### Title block (left)

- **H1:** IDS Shadow Run
- **Subtitle:** Shadow optimization results (read-only) • Service Date: {serviceDate} • Algorithm: {algorithm.name} v{algorithm.version}

### Actions (right)

- **Secondary:** Back to Shadow Runs
- **Secondary:** Download Report (dropdown: JSON, Routes CSV, Pay CSV)
- **Primary (orange):** Re-run Shadow (same inputs → creates new run)
- **Disabled (Phase 2):** Compare to Actual

### Rules

- Re-run Shadow is visible only to Admin/Director.
- Compare to Actual stays disabled until IDS-PROOF comparisons are implemented.

---

## 2) KPI Cards Row (4 cards)

Same style as Payroll KPI cards: rounded, soft tint, icon right, big number.

### Card 1 — Trips Assigned

- **Value:** {counts.tripsAssigned}
- **Sub:** of {counts.tripsTotal} scheduled
- **Click:** none

### Card 2 — Predicted On-Time

- **Value:** {kpis.onTimePct}%
- **Sub:** within pickup windows
- **Color:** green tint when >=95, amber <95, red <90

### Card 3 — Unassigned

- **Value:** {counts.tripsUnassigned}
- **Sub:** needs dispatch review
- **Click:** scroll/jump to Unassigned section
- **Color:** red tint when >0

### Card 4 — Lock Violations

- **Value:** {kpis.lockViolations}
- **Sub:** template locks respected
- **Color:** green when 0, red when >0 (highest priority)

### Optional mini strip (below cards)

- Gap-Fill Wins: {kpis.gapFillWins}
- Est. Deadhead Miles: {kpis.estimatedDeadheadMiles}
- Drivers Used: {counts.driversUsed}
- Runtime: {kpis.runtimeSeconds}s

---

## 3) Run Summary Panel

One wide card (like Payroll "Pay Period" container), two columns.

### Left (metadata)

- Run ID
- Created At
- Created By
- Input Source (input.sourceType, input.sourceRef, input.sourceBatchId)
- Drivers considered/used
- Vehicles considered/used
- Locked templates count

### Right (controls)

- Status pill: Shadow
- Toggle: Exceptions Only (default ON)
- Dropdown: View → Routes | Unassigned | Locks | Pay
- Search input: Search driver, trip id, template id…

### Badges (inside panel)

- LOCKED ROUTES: {counts.lockedTemplates}
- ROUTES WITH FLAGS: {flagsSummary.driversWithFlags}
- UNASSIGNED CRITICAL: {flagsSummary.unassignedCritical}

---

## 4) Tabs / Views

### 4.1 Routes View (default)

#### Filters row (Payroll-like)

- Search: "Search by driver, vehicle, trip…"
- Dropdown: All Drivers | Only With Flags
- Dropdown: All Vehicles | Wheelchair Only
- Dropdown: All Status | On-Time Risk | High Deadhead | Lock Sensitive

#### Routes Table (one row per driver)

**Column order + widths:**

| Column | Width |
|--------|-------|
| Driver | w-[220px] |
| Vehicle | w-[110px] |
| Trips | w-[70px] |
| Miles (est.) | w-[110px] |
| Start–End | w-[130px] |
| On-Time | w-[100px] |
| Deadhead | w-[130px] |
| Pred Pay | w-[140px] |
| Flags | w-[240px] |
| Actions | w-[90px] |

#### Row behavior

- Click row or View → opens right drawer: Route Detail

#### Flag pills (controlled)

| Flag | Type |
|------|------|
| LOCK_SENSITIVE | info |
| ON_TIME_RISK | warn |
| HIGH_DEADHEAD | warn |
| UNUSUAL_PAY | warn |
| CAPACITY_RISK | warn |
| DATA_MISSING | danger |
| LOCK_VIOLATION | danger |

#### Color rules

**On-time pill:**
- ≥95 green
- 90–94.9 amber
- <90 red

### Route Detail Drawer (right-side)

**Width:** 520px desktop.

#### Sections

**Mini KPI cards (3):**
- On-Time %
- Deadhead miles
- Predicted Pay

**Stops Timeline Table (dense):**

| Column | Width |
|--------|-------|
| Seq | w-[50px] |
| Type | w-[90px] (pickup/dropoff pill) |
| Trip | w-[140px] |
| Window | w-[140px] |
| ETA | w-[90px] |
| Slack | w-[80px] |
| Lock | w-[120px] |

**Issues Box (only if issues exist):**
- List of warnings/errors

---

### 4.2 Unassigned View (exceptions workbench)

#### Table columns + widths

| Column | Width |
|--------|-------|
| Trip ID | w-[140px] |
| Mobility | w-[110px] (pill: Standard/WC) |
| Pickup Window | w-[140px] |
| Pickup | w-[220px] (truncate) |
| Dropoff | w-[220px] (truncate) |
| Reason | w-[220px] |
| Suggested Fix | w-[220px] |
| Actions | w-[90px] |

#### Reason codes (controlled)

- NO_WHEELCHAIR_AVAILABLE
- TIME_WINDOW_CONFLICT
- SHIFT_END_CONSTRAINT
- TEMPLATE_LOCK_BLOCKED
- VEHICLE_UNAVAILABLE
- CAPACITY_CONSTRAINT
- DATA_INCOMPLETE

#### Drawer for trip

Trip details + constraint explanation + top 3 candidate drivers (suggestion only)

---

### 4.3 Template Locks View (trust layer)

#### Table columns + widths

| Column | Width |
|--------|-------|
| Template ID | w-[140px] |
| Driver | w-[220px] |
| Lock Type | w-[110px] (hard/soft) |
| Trips Locked | w-[110px] |
| Source | w-[160px] |
| Notes | w-[320px] (truncate) |
| Status | w-[120px] (pill) |

#### Status pill:

- respected = green
- violated = red

#### Banner

If any violated: show red banner "Lock violations must be 0 before production pilot."

---

### 4.4 Predicted Pay View (Payroll parity)

#### Table columns + widths

| Column | Width |
|--------|-------|
| Driver | w-[220px] |
| Trips | w-[70px] |
| Miles | w-[110px] |
| Rate Rule | w-[140px] |
| Gross | w-[120px] |
| Adjustments | w-[120px] |
| Deductions | w-[120px] |
| Net | w-[130px] (bold) |
| Flags | w-[220px] |
| Actions | w-[90px] |

#### Driver Pay drawer:

Pay rule + breakdown (miles×rate + bonuses − deductions)

---

## 5) Exceptions Only Toggle (default ON)

### When ON:

**Routes:** list only drivers where:
- flags exist OR
- onTimePct < 95 OR
- deadheadMiles > 10 OR
- predicted pay flagged

**Unassigned:** show all severity warn/danger (hide info)

**Locks:** show violated first (or only violated)

**Pay:** show only flagged rows

### When OFF:

Show full datasets.

---

## 6) Data Contract (page payload)

UI consumes a single payload from:
```
GET /api/ids/shadow-runs/:id
```

Must include:
- shadowRun (metadata, counts, kpis, flagsSummary, links)
- routes[]
- unassignedTrips[]
- locks[]
- predictedPay[]

(Fields must remain stable even after OR-Tools.)

---

## 7) Non-negotiable rules

1. Shadow-mode only (no live dispatch modifications)
2. No PHI in IDS shadow payload storage (use IDs + short locations only)
3. Lock violations must be 0 for passing proof
4. Every re-run creates a new shadow run record (immutable history)

---

## 8) Proof artifacts (visual evidence)

For IDS-CORE-0 proof, capture:

1. Screenshot of KPI cards row
2. Screenshot of Unassigned table
3. Screenshot of Locks view showing 0 violations
4. Screenshot of Predicted Pay totals
