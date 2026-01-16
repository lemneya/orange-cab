# Gate Index (SSOT)

Each gate must link to:
- spec
- PR
- evidence folder
- acceptance checks (pass/fail)

---

## Current Priority

| Priority | Gate | Description | Status |
|----------|------|-------------|--------|
| 1 | **IDS-CAPACITY-0** | Compute vehicles_required, MLF, vehicles_removed | 🔜 Next |
| 2 | **OC-ROI-0** | ROI engine tied to capacity + compare + admin assumptions | Planned |
| 3 | **OC-PRICING-0** | Pricing logic + software stack cost savings | Planned |
| 4 | **OC-MKT-0** | Marketplace intake + accept/decline audit | Planned |
| 5 | **OC-RULES-0** | Broker rulesets + driver enforcement | Planned |
| 6 | **BILLING-0** | Billing readiness + denial prevention automation | Planned |

---

## Completed Gates

| Gate | Description | PR | Evidence |
|------|-------------|-----|----------|
| **OC-PAY-0** | Payroll core + MediRoute import | [#1](../../pull/1) | `/evidence/oc-pay-0/` |
| **OC-PAY-1** | Fuel/toll imports | [#2](../../pull/2) | `/evidence/oc-pay-1/` |
| **OC-PAY-2** | Payroll sheet parity | [#5](../../pull/5) | `/evidence/oc-pay-2/` |
| **OC-PAY-3** | Fuel/toll import improvements | [#6](../../pull/6) | `/evidence/oc-pay-3/` |
| **IDS-DATA-0** | UI contracts + data layer | [#7](../../pull/7) | `/evidence/ids-data-0/` |
| **IDS-PARTITION-0** | Partitioning cleanup | [#10](../../pull/10) | `/evidence/ids-partition-0/` |
| **IDS-COMPARE-0** | Actual import + compare | [#11](../../pull/11) | `/evidence/ids-compare-0/` |
| **IDS-WIRE-0** | Shadow UI wiring | [#12](../../pull/12) | `/evidence/ids-wire-0/` |
| **IDS-UX-1** | Exceptions default view | [#13](../../pull/13) | `/evidence/ids-ux-1/` |
| **OC-ADMIN-0** | Org/broker/rates admin | [#14](../../pull/14) | `/evidence/oc-admin-0/` |
| **IDS-MANIFEST-0** | Manifest merge fix | [#15](../../pull/15) | `/evidence/ids-manifest-0/` |
| **IDS-MAP-SEQ-0** | Route graph visualization | [#17](../../pull/17) | `/evidence/ids-map-seq-0/` |
| **OC-OWNER-0** | Owner cockpit + snapshot SSOT | [#18](../../pull/18) | `/evidence/oc-owner-0/` |
| **OC-SIM-0** | One-Day Proof Simulator | [#19](../../pull/19) | `/evidence/oc-sim-0/` |

---

## Gate Template

When creating a new gate, use this template:

```markdown
## GATE-NAME-0

**Objective:** [One sentence describing what this gate achieves]

**Principles:** P1, P2, P4 (reference INTEGRABILITY_BLUEPRINT.md)

**Metrics:** M1, M2 (reference INTEGRABILITY_BLUEPRINT.md)

**Acceptance Criteria:**
- [ ] Criterion 1
- [ ] Criterion 2
- [ ] Build passes
- [ ] Evidence captured

**Evidence:**
- Screenshots: `/evidence/<gate>/screenshots/`
- Logs: `/evidence/<gate>/logs/`
- Tests: `/evidence/<gate>/tests/`

**Risk Notes:**
- PHI: [yes/no + mitigation]
- SSRF: [yes/no + mitigation]
- Idempotency: [yes/no + mitigation]
- Partitioning: [verified/needs-work]
```

---

## Next Gate: IDS-CAPACITY-0

**Objective:** Compute the killer capacity proof metrics that demonstrate "10 vehicles do what used to take 15."

**Principles:** P1 (SSOT), P2 (Nothing Dropped), P3 (Partitioning)

**Metrics:** M1 (Capacity Proof), M2 (Hard Savings)

**Core Outputs:**
- `vehicles_required_actual` — vehicles used in actual operations
- `vehicles_required_ids` — vehicles needed with IDS optimization
- `vehicles_removed` — `max(0, actual - ids)`
- `deadhead_miles_actual` / `deadhead_miles_ids` / `deadhead_miles_saved`
- `MLF (MultiLoad Factor)` — `passenger_miles / vehicle_miles`

**Acceptance Criteria:**
- [ ] Capacity metrics computed per day, partitioned by OpCo/Broker
- [ ] Results stored in `CapacitySnapshot` with checksum
- [ ] Owner Cockpit displays capacity proof card
- [ ] Proof pack includes capacity proof section
- [ ] Build passes

**Why This Gate:**
This is the "killer metric" that proves IDS value. Without capacity proof, we're just another dispatch tool. With it, we prove measurable fleet reduction.
