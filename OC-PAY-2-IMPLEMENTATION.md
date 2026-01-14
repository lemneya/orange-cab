# OC-PAY-2: Spreadsheet Parity + Auto-Fill Inputs

## Branch
`gate/oc-pay-2-payroll-sheet-parity`

## PR
https://github.com/lemneya/orange-cab/pull/1

---

## Gatekeeper Feedback Addressed

### Issue 1: No CI/Checks
**Status:** ✅ RESOLVED

Added GitHub Actions workflow at `.github/workflows/ci.yml`:
- **typecheck**: TypeScript type checking (`tsc --noEmit`)
- **lint**: ESLint (`eslint .`)
- **test**: Vitest tests (`vitest run`)

### Issue 2: Formula Inconsistency
**Status:** ✅ RESOLVED

Standardized on the complete sheet formula with `total_dollars`:
```
net = (miles × rate) + total_dollars + credits − gas − deductions
```

This formula is now consistent across:
- `client/src/lib/payrollCalculations.ts`
- `client/src/pages/payroll/PayRuns.tsx`
- `server/payroll.seed-import.test.ts`
- Documentation

---

## Deliverables

### Database Tables

1. **`driver_pay_contracts`** - Pay-specific contract info
   - `contractType`: standard, wheelchair, long_distance, premium
   - `payScheme`: per_trip, per_mile, hybrid
   - `ratePerMile`, `ratePerTrip`, `baseRate` (in cents)
   - `effectiveDate`, `endDate`, `isActive`

2. **`payroll_adjustments`** - Gas, credits, advances, deductions
   - `adjustmentType`: gas, credit, advance, deduction
   - `amount` (in cents, positive value)
   - `memo`, `sourceRef`, `sourceType`, `sourceId`
   - `isAutoSuggested`, `isApproved`

3. **`payroll_import_errors`** - Row number, reason, raw payload
   - `importBatchId`, `rowNumber`, `reason`, `rawPayload`
   - `isResolved`, `resolvedBy`, `resolvedDate`, `resolutionNotes`

### UI - Payroll Navigation (MediRoute-style)

| Page | Description |
|------|-------------|
| **Pay Runs** | Main screen for payroll processing |
| **Drivers** | Pay summary table |
| **Adjustments** | Gas/credits/deductions/advances ledger |
| **Import Errors** | Only exceptions |
| **Exports** | CSV + accounting handoff |

### UI - Pay Runs Screen

**Top Bar:**
- Pay Period selector (Week ending / custom range)
- Sync from MediRoute (API) + "Last sync time"
- Status: Draft → Review → Approved → Exported → Paid

**Four KPI Cards:**
1. Total drivers in run
2. Total net payout (with avg per driver)
3. Exceptions count (clickable to filter)
4. Missing data count (gas/credits/deductions)

**Main Table (spreadsheet parity, fast entry):**

| Column | Description |
|--------|-------------|
| Driver Name | Name + ID |
| Contract | standard/wheelchair/long_distance/premium |
| Miles | Paid units from MediRoute |
| Rate | $/mile from contract |
| Total$/MAT | Bonus bucket |
| Gas | **Inline edit** |
| Credits | **Inline edit** |
| Deductions | **Inline edit** |
| Net Pay | Live calculation |
| Flags | Exception indicators |

**Right-side Exceptions Workbench:**
- "Driver missing contract/rate"
- "Imported trips but 0 payable miles"
- "Deductions suggested but not confirmed"
- "Import row errors"

**Goal:** Payroll user only touches flags, not every row.

### Logic

**Net Pay Formula (STANDARDIZED):**
```
net = (miles × rate) + total_dollars + credits − gas − deductions
```

**Auto-Suggest:**
- If Tickets/Tolls exist for driver+period → prefill deductions

---

## Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| Import MediRoute trips for a pay period → drivers populate automatically | ✅ Pass |
| Payroll user can enter Gas/Credits/Deductions quickly (grid edit) | ✅ Pass |
| Net Pay updates instantly and matches the sheet formula | ✅ Pass |
| "Exceptions Only" view works | ✅ Pass |
| Export payroll CSV includes: driver, trips, miles, gross, deductions, net | ✅ Pass |

---

## Test Results

```
✓ server/payroll.seed-import.test.ts (30 tests) 28ms
  ✓ Payroll Calculations - Seed Import (27)
    ✓ calculateNetPay - STANDARDIZED FORMULA (7)
      ✓ should calculate net pay with the correct formula
      ✓ should handle zero values correctly
      ✓ should handle typical driver scenario (no MAT/bonus)
      ✓ should handle wheelchair rate correctly
      ✓ should include totalDollars (MAT/bonus) in calculation
      ✓ should handle negative net pay scenario
      ✓ should use default values when optional params are omitted
    ✓ formatCurrency (4)
    ✓ parseCurrency (5)
    ✓ generatePayrollCsv (3)
      ✓ should generate CSV with all required columns including Total$/MAT
    ✓ calculatePayrollSummary (2)
    ✓ getDriverExceptionFlags (6)
  ✓ MediRoute Import Simulation (3)
```

---

## Files Changed

### New Files
- `.github/workflows/ci.yml` - CI workflow
- `client/src/pages/payroll/PayRuns.tsx` - Main pay runs screen
- `client/src/pages/payroll/Adjustments.tsx` - Adjustments ledger
- `client/src/pages/payroll/Exports.tsx` - Export history
- `client/src/pages/payroll/DriverPayrollDetail.tsx` - Driver detail
- `client/src/pages/payroll/ImportErrors.tsx` - Import errors
- `client/src/lib/payrollCalculations.ts` - Calculation utilities
- `server/payroll.seed-import.test.ts` - Payroll tests
- `tests/seed-import.test.ts` - Additional tests

### Modified Files
- `drizzle/schema.ts` - Added driver_pay_contracts, payroll_adjustments, payroll_import_errors
- `server/db.ts` - Added payroll database functions
- `server/routers.ts` - Added payroll API routes
- `client/src/App.tsx` - Updated routes
- `client/src/components/DashboardLayout.tsx` - Updated navigation

---

## Live Preview
https://3001-i7ovzyukmi46yk0af0pf9-fa5e1c92.us1.manus.computer/payroll/runs

---

## Decision: OC-PAY-2 = READY FOR MERGE

All blocking issues resolved:
1. ✅ CI/Checks configured and passing
2. ✅ Formula standardized with `total_dollars`
3. ✅ All acceptance criteria met
4. ✅ Tests passing (30/30)
5. ✅ TypeScript compiles without errors
