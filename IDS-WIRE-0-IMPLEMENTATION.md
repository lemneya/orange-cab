# IDS-WIRE-0: Shadow Safety + UI Entry Point

**Branch:** `ids/ids-wire-0-shadow-ui`
**PR Title:** IDS-WIRE-0: shadow-mode guards + IDS dashboard screens

## Deliverables Completed

### Server Guards ✅

1. **Environment Variables:**
   - `IDS_ENABLED=false` by default
   - `IDS_SHADOW_MODE=true` in dev

2. **Guard Implementation (`server/ids/ids.config.ts`):**
   - `isIDSEnabled()` - Returns false when IDS_ENABLED !== 'true'
   - `isIDSShadowMode()` - Returns true when IDS_SHADOW_MODE === 'true'
   - `assertIDSEnabled()` - Throws if IDS is disabled
   - `assertShadowModeOnly()` - Throws if trying to dispatch in shadow mode

3. **Router Protection:**
   - All IDS endpoints check `isIDSEnabled()` before processing
   - Shadow mode writes ONLY to `ids_shadow_runs` table
   - No effect on real dispatch when in shadow mode

### IDS Dashboard Screens ✅

| Route | Component | Description |
|-------|-----------|-------------|
| `/ids` | IDSOverview | Main IDS dashboard with KPI cards and status |
| `/ids/shadow-runs` | ShadowRunsList | List of all shadow optimization runs |
| `/ids/shadow-runs/new` | NewShadowRun | Upload CSV + Run Shadow Solve |
| `/ids/shadow-runs/:id` | ShadowRunDetail | Detailed view of a shadow run |

### Shadow Run Detail Page Features ✅

- **Routes:** Driver → ordered stops visualization
- **KPI Cards:**
  - On-Time % (predicted performance)
  - Gap-Fill Wins (empty seats captured)
  - Lock Violations (must be 0)
  - Predicted Driver Pay Total
- **Unassigned Trips List:** Shows trips that couldn't be assigned

### Upload CSV + Run Shadow Solve ✅

- Upload MediRoute CSV file or paste content directly
- Select service date
- Configure available drivers/vehicles
- Calls `/api/ids/solve` in shadow mode
- Saves result to `ids_shadow_runs` table
- Redirects to shadow run detail page

## Acceptance Criteria

| Criteria | Status |
|----------|--------|
| IDS is inert by default (cannot affect live ops) | ✅ Pass |
| A user can run a shadow solve from the UI | ✅ Pass |
| Shadow run is saved and viewable | ✅ Pass |

## Files Changed

### New Files
- `server/ids/ids.config.ts` - Environment guards
- `client/src/pages/ids/IDSOverview.tsx` - Main dashboard
- `client/src/pages/ids/ShadowRunsList.tsx` - Shadow runs list
- `client/src/pages/ids/ShadowRunDetail.tsx` - Shadow run detail
- `client/src/pages/ids/NewShadowRun.tsx` - CSV upload + solve

### Modified Files
- `server/ids/ids.router.ts` - Added guards and shadow run storage
- `server/ids/ids.service.ts` - Added shadow run methods
- `server/ids/index.ts` - Export config module
- `server/routers.ts` - Added IDS router
- `client/src/App.tsx` - Added IDS routes
- `client/src/components/DashboardLayout.tsx` - Added IDS navigation
- `.env` - Added IDS environment variables

## Live Preview

- IDS Overview: `/ids`
- Shadow Runs: `/ids/shadow-runs`
- New Shadow Solve: `/ids/shadow-runs/new`
