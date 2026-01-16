# OC-PRICING-0 — Subscription Pricing + Software Stack Savings Proof (M6)

## Goal
Add a pricing engine that proves IDS reduces software stack cost while increasing performance.
This feeds:
- Admin pricing configuration
- Simulator/Proof Pack ROI tab
- Owner cockpit "Cost Stack" widget (later)

## Scope
### Admin (Pricing Control)
- Plans (subscription tiers)
- Add-on modules catalog
- Optional broker-enforced "dispatch compliance" flag

### Proof Packs (ROI)
- Show Current Stack Cost vs IDS Subscription Cost
- Compute SoftwareSavings (M6) with assumptions visible

## Data Model
### pricing_plans
- id, name, monthly_price
- includes_trips, includes_vehicles
- included_modules_json
- is_active

### pricing_addons
- id, name, monthly_price
- description
- dependency_modules_json (optional)

### pricing_assumptions
- opco_id, broker_account_id (nullable for global)
- mediroute_cost_per_trip (default 0.30)
- routegenie_cost_per_vehicle (default null)
- routegenie_minimum_monthly (default null)
- other_tools_json (name, monthly_cost)

### pricing_quotes
- pack_id (or sim_run_id)
- inputs_json (trips_month, vehicles, plan_id, addons[])
- outputs_json (baseline_cost, ids_cost, software_savings)
- checksum, created_at

## UI
### /admin/pricing
- Plans table + create/edit modal
- Add-ons table + create/edit modal
- Assumptions panel:
  - MediRoute per trip cost
  - RouteGenie per vehicle + minimum
  - Other tools list

### Proof Pack ROI Tab ("Software Stack" card)
- Current Stack Cost (breakdown)
- IDS Subscription Cost (plan + addons)
- SoftwareSavings (Hard Savings)
- Assumption chips:
  - trips/month used
  - vehicles used
  - cost/trip
  - min fees
- "Evidence" link:
  - trips/month derived from imports + partition scope

## Formulas (M6)
Baseline:
- Cost_MediRoute = trips_month × mediroute_cost_per_trip
- Cost_RouteGenie = max(routegenie_minimum_monthly, vehicles × routegenie_cost_per_vehicle) if provided
- Cost_OtherTools = Σ(other_tools.monthly_cost)
- Cost_Baseline = Cost_MediRoute + Cost_RouteGenie + Cost_OtherTools

IDS:
- Cost_IDS = plan.monthly_price + Σ(addons.monthly_price)

Savings:
- SoftwareSavings = Cost_Baseline − Cost_IDS

## Acceptance Criteria
- [ ] Admin can configure plans/addons/assumptions without code changes
- [ ] Proof pack ROI computes SoftwareSavings and displays full breakdown
- [ ] Assumptions are visible and editable (with defaults)
- [ ] Evidence trail includes partition scope + checksum
- [ ] No PHI stored in pricing quote artifacts
- [ ] Build passes

## Evidence Required
- Screenshots of /admin/pricing
- Screenshot of Proof Pack ROI "Software Stack" card
- Unit tests:
  - routegenie minimum logic
  - savings computation
  - checksum stability

## Principles
- **P1** (SSOT): All pricing quotes stored with checksums
- **P7** (Subscription OS): Replace tool sprawl with predictable subscription

## Metrics
- **M6** (Software Stack Cost Savings): Primary metric for this gate

## Notes
Pricing is a sales weapon. Keep it transparent:
- Never blend "Hard Savings" and "Upside"
- Always label assumptions

## Sales Positioning
The irresistible sequence:
1. Capacity proof: fewer vehicles needed
2. Labor automation proof: fewer staff touches
3. Billing/penalty proof: contract safety
4. Software savings proof: "and we replace your expensive stack with one subscription"
5. Close: "lower cost + higher performance + one OS"

**Key positioning:** Brokers enforce software usage → owners must pay something.
Your advantage is not just "dispatch compliant" but dispatch + payroll + billing + maintenance + marketplace + reporting under one subscription.
That's value-added compliance, not just compliance.
