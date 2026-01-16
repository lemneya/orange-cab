# Orange Cab — IDS Operating System

**INTEGRABILity** — *one place, one truth, one control surface.*

An integrated NEMT operations platform that combines dispatch optimization, payroll automation, billing control, and fleet management into a single owner-focused operating system.

---

## SSOT Documents

| Document | Description |
|----------|-------------|
| [INTEGRABILITY Blueprint](docs/INTEGRABILITY_BLUEPRINT.md) | The master architecture document defining principles, metrics, pillars, and requirements |
| [Gate Index](docs/GATE_INDEX.md) | Execution order, completed gates, and next priorities |

---

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build
```

---

## Architecture

### The 5 Pillars

| Pillar | Purpose | Route |
|--------|---------|-------|
| **A — Dispatch + Capacity (IDS)** | Maximize multiload capacity | `/ids/*` |
| **B — Marketplace Intake** | Accept more trips safely | `/marketplace/*` |
| **C — Billing** | Protect revenue, reduce leakage | `/billing/*` |
| **D — Payroll** | Exceptions-only automation | `/payroll/*` |
| **E — Fleet & Maintenance** | Stop maintenance drain | `/fleet/*` |

### Owner Cockpit

The central dashboard at `/owner` answers:
1. Are we winning today?
2. Where is the leak?
3. What must I fix now?
4. How much capacity to accept more trips?

### Sales Weapon

- **One-Day Simulator**: `/simulator/day`
- **Proof Packs**: `/simulator/packs/:id`

---

## Non-Negotiable Principles

| Code | Principle |
|------|-----------|
| **P1** | SSOT Everywhere — all claims from checksummed snapshots |
| **P2** | Nothing Dropped — every import fully accounted |
| **P3** | Partitioning is Sacred — opco/broker/account/date |
| **P4** | Exceptions-Only — humans touch flags, not rows |
| **P5** | Compliance Enforced — rules become workflow gates |
| **P6** | PHI-Safe by Default — aggregate-only in proofs |

---

## Proof Metrics

| Code | Metric | Purpose |
|------|--------|---------|
| **M1** | Capacity Proof | vehicles_removed, MLF, deadhead_saved |
| **M2** | Hard Savings | driver/insurance/maintenance savings |
| **M3** | Revenue Upside | additional trips accepted |
| **M4** | Billing Leakage | denials, missing evidence, unbilled |
| **M5** | Penalty Avoidance | violations, LD events, risk index |

---

## PR Requirements


Every PR must include:
- Principles advanced: P1–P6
- Metrics improved: M1–M5
- Evidence: screenshots/logs/tests
- Partition keys for new tables

See [INTEGRABILITY Blueprint](docs/INTEGRABILITY_BLUEPRINT.md) for full details.

---

## License

Proprietary — Orange Cab LLC
