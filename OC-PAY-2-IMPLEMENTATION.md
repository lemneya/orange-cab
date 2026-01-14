# OC-PAY-2: Spreadsheet Parity + Auto-Fill Inputs

## Branch
`gate/oc-pay-2-payroll-sheet-parity`

## PR Title
OC-PAY-2: payroll inputs (gas/credits/deductions) + sheet parity net pay

## Implementation Summary

### Database Schema (drizzle/schema.ts)

1. **driver_pay_contracts** - Contract type, pay scheme, rate, effective date
   - `contractType`: standard, wheelchair, long_distance, premium
   - `payScheme`: per_trip, per_mile, hybrid
   - `ratePerMile`, `ratePerTrip`, `baseRate` (in cents)
   - `effectiveDate`, `endDate`, `isActive`

2. **payroll_adjustments** - Gas, credits, advances, deductions
   - `adjustmentType`: gas, credit, advance, deduction
   - `amount` (in cents, positive value)
   - `memo`, `sourceRef`, `sourceType`, `sourceId`
   - `isAutoSuggested`, `isApproved`

3. **payroll_import_errors** - Row number, reason, raw payload
   - `importBatchId`, `rowNumber`, `reason`, `rawPayload`
   - `isResolved`, `resolvedBy`, `resolvedDate`, `resolutionNotes`

4. **payroll_import_batches** - Import session tracking
   - `batchId`, `payrollPeriodId`
   - `totalRows`, `successfulRows`, `failedRows`
   - `sourceType`, `status`

### UI Components

1. **DriverPayments.tsx** (Payroll Home)
   - Inline editable columns for Gas / Credits / Deductions
   - Fast entry via click-to-edit inputs
   - Exceptions filter toggle
   - Net Pay updates instantly
   - Export CSV button

2. **DriverPayrollDetail.tsx** (Driver Detail)
   - Adjustment ledger with full history
   - Add adjustment modal (type, amount, memo, reference)
   - Edit/delete adjustments
   - Toggle approval status
   - Trip details table

3. **ImportErrors.tsx** (Import Errors Page)
   - Import batch history with stats
   - Error list with filtering
   - Error detail modal
   - Mark as resolved functionality

### Logic (lib/payrollCalculations.ts)

Net pay formula matching spreadsheet:
```
net = (miles * rate) + total_dollars + credits - gas - deductions
```

Functions:
- `calculateNetPay()` - Main calculation
- `formatCurrency()` / `parseCurrency()` - Currency handling
- `generatePayrollCsv()` - CSV export with all fields
- `downloadCsv()` - Trigger browser download
- `getSuggestedDeductionsFromTickets()` - Auto-suggest from tickets/tolls
- `calculatePayrollSummary()` - Aggregate statistics

### Auto-Suggest Feature

If Tickets/Tolls exist for the driver+period:
- Automatically shows suggested deductions
- One-click "Apply" to add to adjustment ledger
- Tracks source reference for audit trail

## Acceptance Criteria Status

| Criteria | Status |
|----------|--------|
| Import MediRoute trips for a pay period → drivers populate automatically | ✅ Implemented |
| Payroll user can enter Gas/Credits/Deductions quickly (grid edit) | ✅ Implemented |
| Net Pay updates instantly and matches the sheet formula | ✅ Implemented |
| "Exceptions Only" view works | ✅ Implemented |
| Export payroll CSV includes: driver, trips, miles, gross, deductions, net | ✅ Implemented |

## Files Changed

### New Files
- `client/src/pages/payroll/DriverPayrollDetail.tsx`
- `client/src/pages/payroll/ImportErrors.tsx`
- `client/src/lib/payrollCalculations.ts`

### Modified Files
- `drizzle/schema.ts` - Added new tables
- `server/db.ts` - Added payroll functions
- `server/routers.ts` - Added payroll router
- `client/src/pages/payroll/DriverPayments.tsx` - Complete rewrite
- `client/src/App.tsx` - Added new routes

## Testing Notes

1. Inline editing: Click on Gas/Credits/Deductions cell to edit
2. Net pay recalculates instantly on blur
3. Exceptions filter shows only drivers with issues
4. CSV export includes all required fields
5. Auto-suggest shows pending tickets/tolls for the pay period
