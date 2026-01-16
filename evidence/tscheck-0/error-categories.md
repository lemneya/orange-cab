# TypeScript Error Categories

## Category 1: Iterator/downlevelIteration (4 errors)
- server/admin/admin.service.ts:501 - Map iteration
- server/ai/narrative.service.ts:422 - Set iteration
- server/ai/narrative.service.ts:732 - Set iteration
- server/ids/ids.actual-import.service.ts:808 - MapIterator iteration

**Fix:** Use Array.from() or spread operator

## Category 2: Missing properties on types (8 errors)
- client/src/pages/admin/AuditLogPage.tsx:65 - missing properties
- client/src/pages/ids/IDSOverview.tsx:39 - missing properties
- client/src/pages/ids/ShadowRunsList.tsx:50 - missing properties
- client/src/pages/owner/OwnerCockpit.tsx:78 - 6 errors, missing properties
- client/src/pages/reports/ReportViewer.tsx:588 - missing properties
- server/owner/snapshot.service.ts:566 - IDSImpactSummary missing properties

**Fix:** Add missing properties or use type assertions

## Category 3: tRPC property access (4 errors)
- client/src/pages/simulator/OneDaySimulator.tsx:143 - opcos doesn't exist
- client/src/pages/simulator/OneDaySimulator.tsx:144 - brokerAccounts should be getBrokerAccounts
- server/ids/ids.router.ts:354 - opcoId doesn't exist on StoredShadowRun
- server/ids/ids.router.ts:355 - brokerAccountId doesn't exist on StoredShadowRun

**Fix:** Use correct property names

## Category 4: Type mismatches (5 errors)
- server/admin/admin.router.ts:77 - Expected 2-3 arguments, got 1
- server/ids/ids.actual-import.service.ts:315,332,354,471 - string not assignable to union type

**Fix:** Add missing arguments or use type assertions

## Category 5: Object literal unknown properties (3 errors)
- server/admin/admin.service.ts:1012,1025,1038 - applyToNewHires doesn't exist

**Fix:** Remove unknown properties or update type

## Category 6: Null/undefined assignment (2 errors)
- server/reports/reports.router.ts:175 - null not assignable
- server/reports/reports.service.ts:504 - unknown[] not assignable to string[]

**Fix:** Add null checks or type assertions
