# INTEGRABILITY Blueprint v1.0
**SSOT Document — Orange Cab / IDS Operating System**

**Core Idea:** IDS wins because it integrates *all* NEMT money-leaks + risks into one controllable OS.
**Slogan:** **INTEGRABILity** — *one place, one truth, one control surface.*

---

## 0) North Star Promise (what we sell)
We do not sell "dispatch software." We sell **owner outcomes**:

1) **Do more with fewer vehicles** (multiload capacity)
2) **Do more with fewer people** (exceptions-only automation)
3) **Make more money** (accept more trips safely)
4) **Lose less money** (billing leakage + maintenance drain + penalties)
5) **Reduce stress** (confidence + control + evidence trail)

**If a feature doesn't improve one of these, we don't build it.**

---

## 1) Non-Negotiable Architecture Principles

### P1 — SSOT Everywhere
All reports, narratives, and ROI claims must be derived from **snapshots** with checksums.
- No live-query + LLM "summaries" in proof packs
- Every claim must have `evidence_keys` pointing to audits / runs / checksums

### P2 — "Nothing Dropped" is a Product Feature
Every import must output:
- `expectedRows`, `accountedRows`, `missingRows`
- per-row outcomes: `imported | duplicate | error | unmatched`
- proof JSON:
```json
{ "verified": true, "expectedRows": 100, "accountedRows": 100, "missingRows": [] }
```

### P3 — Partitioning is Sacred
Every operational dataset must be scoped by:
- `opco_id`
- `broker_id`
- `broker_account_id`
- `service_date`

### P4 — Exceptions-Only Operations
Humans touch flags, not every row.
- Default views: "Exceptions only"
- Every exception shows cause + fix action

### P5 — Compliance is Enforced, Not Trusted
Broker rules become workflow gates (driver cannot complete trip without required steps/evidence).
- If it isn't captured, it didn't happen.

### P6 — PHI-Safe by Default
- Proof packs and narratives store aggregate-only
- Imports strip PHI fields (names, phones, DOB, full addresses, SSN, emails)
- Evidence trails reference checksums/audits, not PHI

---

## 2) NEMT Domain Coverage (must support)

NEMT is not just wheelchair.

**Mobility types (minimum):**
- AMB (ambulatory)
- WCH (wheelchair)
- STR (stretcher)

**Routing constraints must support:**
- Time windows
- Pickup-before-dropoff
- Capacity by mobility type
- Ride-time limits
- Broker-specific compliance rules
- Templates/locks for repeated trips

---

## 3) The Mathematical Proof Engine (the heart of INTEGRABILity)
We sell measured deltas, not claims.

### M1 — Capacity Proof (the killer metric)
**Objective:** prove "10 vehicles do what used to take 15."

Core outputs per day (partitioned by OpCo/Broker):
- `vehicles_required_actual`
- `vehicles_required_ids`
- `vehicles_removed = max(0, actual - ids)`
- `deadhead_miles_actual`, `deadhead_miles_ids`, `deadhead_miles_saved`
- `MLF (MultiLoad Factor) = passenger_miles / vehicle_miles`

**Owner-facing proof:**
> "Same demand served with fewer vehicles because multiload efficiency increased."

### M2 — Hard Savings (monthly)
Derived from `vehicles_removed` and configured costs:
- Driver savings
- Insurance savings
- Maintenance savings

### M3 — Revenue Upside
Added capacity enables:
- additional trips accepted per broker/account
- revenue upside using rate cards

### M4 — Billing Leakage Recovery
Quantify and reduce:
- denials risk
- missing evidence
- time mismatch adjustments
- unbilled trips

### M5 — Penalty & Contract Risk Avoidance
Quantify:
- rule violations
- LD/penalty events
- contract risk index trend

---

## 4) The 5 Pillars (system modules)

### Pillar A — Dispatch + Capacity (IDS)
**Purpose:** maximize multiload capacity with constraints and explainability.

**Outputs:**
- routes + sequence visualization
- risk scoring
- predicted pay
- capacity proof metrics

### Pillar B — Marketplace Intake (Growth)
**Purpose:** accept more trips safely; kill "dispatcher laziness."

**Features:**
- show available trips by broker/account
- show "capacity to accept"
- accept/decline audit trail

### Pillar C — Billing (Leakage Control)
**Purpose:** protect revenue and reduce stress.

**Features:**
- readiness checks
- rule-evidence completeness
- mismatch flags
- export-ready batches

### Pillar D — Payroll (Exceptions-Only)
**Purpose:** remove manual spreadsheet merging.

**Features:**
- MediRoute import
- fuel + toll imports
- reconciliation queue
- export to accounting
- audit + idempotency

### Pillar E — Fleet & Maintenance (Uptime)
**Purpose:** stop maintenance from draining money.

**Features:**
- uptime readiness
- inspections due
- WCH/STR readiness
- downtime loss estimates

---

## 5) Owner Cockpit (the OS screen)

**Route:** `/owner`

The cockpit must answer in < 60 seconds:
1. Are we winning today?
2. Where is the leak (deadhead / cancels / denials / downtime)?
3. What must I fix now?
4. How much capacity do we have to accept more trips?

Everything must be:
- partitioned
- checksum-linked
- evidence-backed

---

## 6) Sales Weapon (Simulator + Proof Packs)

**Routes:**
- `/simulator/day`
- `/simulator/packs/:id`

**The only goal:**
Produce a proof pack in < 3 minutes that includes:
- operational proof (map + compare)
- mathematical savings (ROI)
- evidence trail (checksums + audits)
- PHI-safe guarantees

---

## 7) ROI Engine (Gate D — mandatory)

The ROI layer converts operational deltas into dollars:
- labor savings (exceptions-only automation)
- fleet savings (vehicles removed)
- maintenance savings (uptime)
- revenue upside (more trips accepted)
- penalties avoided (rules enforced)

Every line item must show:
- formula
- assumptions
- evidence link

**Hard Savings vs Upside vs Risk Avoided must never be blended silently.**

---

## 8) Rulesets (broker compliance enforcement)

Admin-defined per broker account:
- required evidence types per mobility type (AMB/WCH/STR)
- hand-to-hand rules
- call-ahead requirements
- unattended dropoff rules
- penalties mapping

**Driver workflow enforcement:**
- cannot complete trip without required steps
- escalation to dispatch if blocked

---

## 9) Data Contracts (required snapshot types)

All narratives and packs must be generated only from snapshots:
- `OwnerSnapshot v1.0` (SSOT)
- `ReportSnapshot`
- `SimulatorSnapshot`
- `CapacitySnapshot` (vehicles_required + MLF + vehicles_removed)
- `ROIOutput v1.0`

All snapshots include:
- `schema_version`
- `generated_at`
- `snapshot_checksum`
- `partition scope`

---

## 10) Gate Index (execution order)


**Already built (strong foundation):**
- Payroll automation + fuel/tolls imports
- IDS compare + shadow runs
- Map route sequencing visualization
- Owner cockpit + snapshot SSOT
- Simulator + proof packs

**Next Gates (priority order):**
1. **IDS-CAPACITY-0** — compute vehicles_required, MLF, vehicles_removed (the killer proof)
2. **OC-ROI-0** — ROI engine tied to capacity + compare + admin assumptions
3. **OC-MKT-0** — marketplace intake + accept/decline audit
4. **OC-RULES-0** — broker rulesets + driver enforcement
5. **BILLING-0** — billing readiness + denial prevention automation

---

## 11) PR Requirements (every PR must comply)

Each PR must include in its description:
- Which principle(s) it advances: P1–P6
- Which proof metric(s) it improves: M1–M5
- Evidence: screenshots/logs/tests
- Any new data tables must include partition keys

**PR template snippet:**
```
Principles: P1, P2, P4
Metrics: M1 (deadhead), M2 (hard savings)
Evidence: /evidence/<GATE>/...
Risk notes: PHI, SSRF, idempotency, partitioning
```

---

## 12) Definition of "INTEGRABILity Achieved"

For any new NEMT owner:

1. Import one week exports (manifest + actual + fuel/tolls)
2. IDS produces:
   - capacity proof (vehicles removed)
   - on-time improvement
   - deadhead reduction
   - payroll automation proof
   - billing leakage reduction
   - maintenance drain visibility
   - compliance enforcement plan
3. Generate a proof pack that closes the sale.

---

## Why this next gate

Because INTEGRABILity is only believable when the owner sees **capacity proof + dollar proof + evidence** tied together.

**The next gate must always increase measurable capacity or reduce measurable leakage/risk.**
