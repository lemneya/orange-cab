// IDSShadowRunDetail.tsx
// Drop-in UI scaffold for /ids/shadow-runs/:id
// Tailwind-only, payroll-native: KPI cards + summary panel + table + drawer.

import React, { useMemo, useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "../../lib/trpc";

type FlagSeverity = "info" | "warn" | "danger";
type PillTone = "slate" | "green" | "amber" | "red" | "purple" | "blue";

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Pill({
  tone = "slate",
  children,
}: {
  tone?: PillTone;
  children: React.ReactNode;
}) {
  const tones: Record<PillTone, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
  };
  return (
    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

function kpiToneForPct(pct: number): PillTone {
  if (pct >= 95) return "green";
  if (pct >= 90) return "amber";
  return "red";
}

function KpiCard({
  title,
  value,
  sub,
  tone = "slate",
  onClick,
}: {
  title: string;
  value: string | number;
  sub: string;
  tone?: PillTone;
  onClick?: () => void;
}) {
  const tones: Record<PillTone, string> = {
    slate: "bg-white",
    green: "bg-green-50",
    amber: "bg-amber-50",
    red: "bg-red-50",
    purple: "bg-purple-50",
    blue: "bg-blue-50",
  };
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left rounded-xl border p-4 shadow-sm transition",
        tones[tone],
        onClick ? "hover:shadow-md hover:border-slate-300" : "cursor-default"
      )}
      type="button"
    >
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{sub}</div>
    </button>
  );
}

function Drawer({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className={clsx("fixed inset-0 z-50", open ? "" : "pointer-events-none")}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={clsx(
          "absolute inset-0 bg-black/20 transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      {/* Panel */}
      <div
        className={clsx(
          "absolute right-0 top-0 h-full w-full sm:w-[520px] bg-white border-l shadow-xl transition-transform",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="h-14 px-4 border-b flex items-center justify-between">
          <div className="font-semibold text-slate-900 truncate">{title}</div>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded-md text-sm text-slate-700 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="p-4 overflow-auto h-[calc(100%-56px)]">{children}</div>
      </div>
    </div>
  );
}

/** ---- Types (match the contract we defined) ---- */
type RouteRow = {
  driver: { id: string; name: string; type: string; shift: { start: string; end: string } };
  vehicle: { unitNumber: string; mobility: "standard" | "wheelchair" };
  summary: {
    tripCount: number;
    estimatedMiles: number;
    estimatedDeadheadMiles: number;
    startTime: string;
    endTime: string;
    onTimePct: number;
    predictedPayNet: number;
  };
  flags: Array<{ code: string; label: string; severity: FlagSeverity }>;
  routeDetail: {
    timeline: Array<{
      seq: number;
      stopType: "pickup" | "dropoff";
      tripId: string;
      window: { start: string; end: string };
      eta: string;
      slackMinutes: number;
      lock?: { isLocked: boolean; templateId?: string; lockType?: "hard" | "soft" };
    }>;
    issues: Array<{ severity: FlagSeverity; message: string }>;
  };
};

type UnassignedTrip = {
  tripId: string;
  mobility: "AMB" | "WC" | "STR";
  pickup: string;
  dropoff: string;
  window: string;
  reason: string;
  severity: FlagSeverity;
};

type TemplateLock = {
  templateId: string;
  driver: string;
  dayPattern: string;
  status: "respected" | "violated";
};

type PredictedPayRow = {
  driver: { id: string; name: string; type: string };
  contract: string;
  trips: number;
  miles: number;
  rate: number;
  basePay: number;
  adjustments: number;
  deductions: number;
  net: number;
  flags: Array<{ code: string; label: string; severity: FlagSeverity }>;
};

type ShadowRunPayload = {
  shadowRun: {
    id: string;
    serviceDate: string;
    createdAt: string;
    algorithm: { name: string; version: string };
    counts: { tripsTotal: number; tripsAssigned: number; tripsUnassigned: number; driversUsed: number; vehiclesUsed: number; driversAvailable: number; vehiclesAvailable: number };
    kpis: { onTimePct: number; lockViolations: number; gapFillWins: number; estimatedDeadheadMiles: number; runtimeSeconds: number };
  };
  routes: RouteRow[];
  unassigned: UnassignedTrip[];
  locks: TemplateLock[];
  predictedPay: PredictedPayRow[];
};

// Transform API data to component format
function transformApiData(apiData: any): ShadowRunPayload {
  const result = apiData?.result;
  if (!result) {
    return {
      shadowRun: {
        id: "unknown",
        serviceDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        algorithm: { name: "greedy_baseline", version: "1.0" },
        counts: { tripsTotal: 0, tripsAssigned: 0, tripsUnassigned: 0, driversUsed: 0, vehiclesUsed: 0, driversAvailable: 0, vehiclesAvailable: 0 },
        kpis: { onTimePct: 0, lockViolations: 0, gapFillWins: 0, estimatedDeadheadMiles: 0, runtimeSeconds: 0 },
      },
      routes: [],
      unassigned: [],
      locks: [],
      predictedPay: [],
    };
  }

  const routes: RouteRow[] = [];
  const predictedPay: PredictedPayRow[] = [];
  let totalMiles = 0;
  let totalDeadhead = 0;

  // Transform routes from API result
  if (result.routes) {
    result.routes.forEach((route: any, idx: number) => {
      const driverId = String(route.driverId || `DRV-${idx + 1}`);
      const trips = route.trips || [];
      const tripCount = trips.length;
      const estimatedMiles = trips.reduce((sum: number, t: any) => sum + (t.miles || 10), 0);
      const deadheadMiles = Math.round(estimatedMiles * 0.15 * 10) / 10;
      totalMiles += estimatedMiles;
      totalDeadhead += deadheadMiles;

      const flags: Array<{ code: string; label: string; severity: FlagSeverity }> = [];
      if (route.hasLock) {
        flags.push({ code: "LOCK_SENSITIVE", label: "Lock-Sensitive", severity: "info" });
      }

      routes.push({
        driver: {
          id: driverId,
          name: `Driver ${driverId.replace('DRV-', '')}`,
          type: "1099",
          shift: { start: "04:00", end: "16:00" },
        },
        vehicle: {
          unitNumber: `#${1000 + idx + 1}`,
          mobility: idx % 4 === 0 ? "wheelchair" : "standard",
        },
        summary: {
          tripCount,
          estimatedMiles,
          estimatedDeadheadMiles: deadheadMiles,
          startTime: trips[0]?.pickupTime?.slice(0, 5) || "04:00",
          endTime: trips[trips.length - 1]?.dropoffTime?.slice(0, 5) || "16:00",
          onTimePct: 100,
          predictedPayNet: estimatedMiles * 2.0,
        },
        flags,
        routeDetail: {
          timeline: trips.flatMap((t: any, tIdx: number) => [
            {
              seq: tIdx * 2 + 1,
              stopType: "pickup" as const,
              tripId: t.tripId || `TRIP-${tIdx + 1}`,
              window: { start: t.pickupTime?.slice(0, 5) || "08:00", end: t.pickupTime?.slice(0, 5) || "08:30" },
              eta: t.pickupTime?.slice(0, 5) || "08:10",
              slackMinutes: 5,
              lock: route.hasLock ? { isLocked: true, templateId: `TPL-${idx + 1}`, lockType: "hard" as const } : undefined,
            },
            {
              seq: tIdx * 2 + 2,
              stopType: "dropoff" as const,
              tripId: t.tripId || `TRIP-${tIdx + 1}`,
              window: { start: t.dropoffTime?.slice(0, 5) || "09:00", end: t.dropoffTime?.slice(0, 5) || "09:30" },
              eta: t.dropoffTime?.slice(0, 5) || "09:15",
              slackMinutes: 10,
            },
          ]),
          issues: [],
        },
      });

      predictedPay.push({
        driver: {
          id: driverId,
          name: `Driver ${driverId.replace('DRV-', '')}`,
          type: "1099",
        },
        contract: "Per Mile",
        trips: tripCount,
        miles: estimatedMiles,
        rate: 2.0,
        basePay: estimatedMiles * 2.0,
        adjustments: 0,
        deductions: 0,
        net: estimatedMiles * 2.0,
        flags: [],
      });
    });
  }

  // Transform unassigned trips
  const unassigned: UnassignedTrip[] = (result.unassignedTrips || []).map((t: any, idx: number) => ({
    tripId: t.tripId || `UNASSIGNED-${idx + 1}`,
    mobility: t.mobilityType === "wheelchair" ? "WC" : "AMB",
    pickup: t.pickupAddress || "Unknown",
    dropoff: t.dropoffAddress || "Unknown",
    window: `${t.pickupTime?.slice(0, 5) || "00:00"} - ${t.dropoffTime?.slice(0, 5) || "00:00"}`,
    reason: t.reason || "NO_CAPACITY",
    severity: "warn" as FlagSeverity,
  }));

  // Transform locks
  const locks: TemplateLock[] = (result.locksApplied || []).map((l: any, idx: number) => ({
    templateId: l.templateId || `TPL-${idx + 1}`,
    driver: l.driverId || `Driver ${idx + 1}`,
    dayPattern: l.dayPattern || "Mon-Fri",
    status: l.violated ? "violated" : "respected",
  }));

  const tripsTotal = result.summary?.totalTrips || routes.reduce((sum, r) => sum + r.summary.tripCount, 0);
  const tripsAssigned = result.summary?.assignedTrips || routes.reduce((sum, r) => sum + r.summary.tripCount, 0);
  const tripsUnassigned = result.summary?.unassignedTrips || unassigned.length;
  const driversUsed = result.summary?.driversUsed || routes.length;
  const lockViolations = locks.filter(l => l.status === "violated").length;

  return {
    shadowRun: {
      id: apiData?.id?.toString() || "unknown",
      serviceDate: apiData?.serviceDate || new Date().toISOString().split('T')[0],
      createdAt: apiData?.createdAt || new Date().toISOString(),
      algorithm: { name: "Greedy Baseline", version: "1.0" },
      counts: {
        tripsTotal,
        tripsAssigned,
        tripsUnassigned,
        driversUsed,
        vehiclesUsed: driversUsed,
        driversAvailable: 15,
        vehiclesAvailable: 15,
      },
      kpis: {
        onTimePct: 100,
        lockViolations,
        gapFillWins: tripsAssigned,
        estimatedDeadheadMiles: totalDeadhead,
        runtimeSeconds: result.summary?.runtimeMs ? result.summary.runtimeMs / 1000 : 0.005,
      },
    },
    routes,
    unassigned,
    locks,
    predictedPay,
  };
}

type TabId = "routes" | "unassigned" | "locks" | "pay" | "compare";

// ============================================================================
// Compare Tab Component
// ============================================================================

function CompareTab({
  shadowRunId,
  serviceDate,
  comparisonData,
}: {
  shadowRunId: number;
  serviceDate: string;
  comparisonData: any;
}) {
  const [, setLocation] = useLocation();
  const [selectedDriver, setSelectedDriver] = useState<any>(null);

  // No actual data yet
  if (!comparisonData?.hasActualData) {
    return (
      <div className="rounded-xl border bg-white p-12 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">No Actual Data Yet</h3>
        <p className="text-sm text-slate-500 mb-6">
          Import actual dispatch data from MediRoute to compare with this shadow run.
        </p>
        <button
          onClick={() => setLocation("/ids/actual-import")}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
        >
          Import Actual Dispatch CSV
        </button>
      </div>
    );
  }

  const { comparison } = comparisonData;

  return (
    <div className="space-y-4">
      {/* KPI Comparison Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-slate-500 mb-2">On-Time %</div>
          <div className="flex items-baseline gap-3">
            <div>
              <div className="text-xs text-slate-400">Predicted</div>
              <div className="text-2xl font-bold text-slate-900">
                {comparison.predicted.onTimePercent.toFixed(0)}%
              </div>
            </div>
            <div className="text-slate-300">vs</div>
            <div>
              <div className="text-xs text-slate-400">Actual</div>
              <div className="text-2xl font-bold text-slate-900">
                {comparison.actual.onTimePercent.toFixed(0)}%
              </div>
            </div>
          </div>
          <div className={clsx(
            "mt-2 text-sm font-medium",
            comparison.delta.onTimePercent > 0 ? "text-green-600" : "text-red-600"
          )}>
            {comparison.delta.onTimePercent > 0 ? "+" : ""}
            {comparison.delta.onTimePercent.toFixed(0)}% {comparison.delta.onTimePercent > 0 ? "better" : "worse"}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-slate-500 mb-2">Total Miles</div>
          <div className="flex items-baseline gap-3">
            <div>
              <div className="text-xs text-slate-400">Predicted</div>
              <div className="text-2xl font-bold text-slate-900">
                {comparison.predicted.totalMiles.toFixed(0)} mi
              </div>
            </div>
            <div className="text-slate-300">vs</div>
            <div>
              <div className="text-xs text-slate-400">Actual</div>
              <div className="text-2xl font-bold text-slate-900">
                {comparison.actual.totalMiles.toFixed(0)} mi
              </div>
            </div>
          </div>
          <div className={clsx(
            "mt-2 text-sm font-medium",
            comparison.delta.totalMiles < 0 ? "text-green-600" : "text-amber-600"
          )}>
            {comparison.delta.totalMiles < 0 ? "" : "+"}
            {comparison.delta.totalMiles.toFixed(0)} mi {comparison.delta.totalMiles < 0 ? "saved" : "extra"}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs text-slate-500 mb-2">Total Pay</div>
          <div className="flex items-baseline gap-3">
            <div>
              <div className="text-xs text-slate-400">Predicted</div>
              <div className="text-2xl font-bold text-slate-900">
                ${comparison.predicted.totalPay.toFixed(0)}
              </div>
            </div>
            <div className="text-slate-300">vs</div>
            <div>
              <div className="text-xs text-slate-400">Actual</div>
              <div className="text-2xl font-bold text-slate-900">
                {comparison.actual.totalPay !== null ? `$${comparison.actual.totalPay.toFixed(0)}` : "N/A"}
              </div>
            </div>
          </div>
          {comparison.delta.totalPay !== null && (
            <div className={clsx(
              "mt-2 text-sm font-medium",
              comparison.delta.totalPay > 0 ? "text-green-600" : "text-red-600"
            )}>
              {comparison.delta.totalPay > 0 ? "+" : ""}${comparison.delta.totalPay.toFixed(0)} predicted
            </div>
          )}
        </div>
      </div>

      {/* Top Causes */}
      {comparison.topCauses.length > 0 && (
        <div className="rounded-xl border bg-white p-4">
          <h3 className="font-semibold text-slate-900 mb-3">Top Causes for Differences</h3>
          <div className="space-y-2">
            {comparison.topCauses.map((cause: any, i: number) => (
              <div key={cause.cause} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="text-sm text-slate-700">
                    {cause.cause.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                  </span>
                  <Pill tone="slate">{cause.count}x</Pill>
                </div>
                <span className="text-sm text-slate-500">{cause.impact}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-Driver Delta Table */}
      <div className="rounded-xl border bg-white overflow-hidden">
        <div className="px-4 py-3 border-b">
          <h3 className="font-semibold text-slate-900">Per-Driver Delta</h3>
          <p className="text-xs text-slate-500">Predicted vs Actual performance by driver</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="border-b bg-slate-50">
              <tr className="h-10 text-xs text-slate-500">
                <th className="px-4 text-left">Driver</th>
                <th className="px-4 text-left">Pred Trips</th>
                <th className="px-4 text-left">Actual Trips</th>
                <th className="px-4 text-left">Pred Miles</th>
                <th className="px-4 text-left">Actual Miles</th>
                <th className="px-4 text-left">Pred On-Time</th>
                <th className="px-4 text-left">Actual On-Time</th>
                <th className="px-4 text-left">Flags</th>
                <th className="px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {comparison.driverDeltas.map((driver: any) => (
                <tr key={driver.driverName} className="h-12 border-b last:border-b-0 hover:bg-slate-50">
                  <td className="px-4 py-2">
                    <div className="font-medium">{driver.driverName}</div>
                  </td>
                  <td className="px-4 py-2">{driver.predTrips}</td>
                  <td className="px-4 py-2">{driver.actualTrips}</td>
                  <td className="px-4 py-2">{driver.predMiles.toFixed(0)}</td>
                  <td className="px-4 py-2">{driver.actualMiles.toFixed(0)}</td>
                  <td className="px-4 py-2">{driver.predOnTime.toFixed(0)}%</td>
                  <td className="px-4 py-2">{driver.actualOnTime.toFixed(0)}%</td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {driver.flags.map((flag: string) => (
                        <Pill key={flag} tone={
                          flag === "LATE_PICKUPS" ? "red" :
                          flag === "MORE_MILES" ? "amber" :
                          flag === "FEWER_TRIPS" ? "amber" :
                          "slate"
                        }>
                          {flag.replace(/_/g, " ")}
                        </Pill>
                      ))}
                      {driver.flags.length === 0 && <Pill tone="green">Match</Pill>}
                    </div>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => setSelectedDriver(driver)}
                      className="text-sm text-orange-600 hover:text-orange-700"
                    >
                      Explain
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explain Delta Drawer */}
      <Drawer
        open={!!selectedDriver}
        title={selectedDriver ? `Delta Explanation — ${selectedDriver.driverName}` : ""}
        onClose={() => setSelectedDriver(null)}
      >
        {selectedDriver && (
          <div className="space-y-4">
            <div className="rounded-xl border p-4">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <div className="text-xs text-slate-500">Driver</div>
                  <div className="font-semibold">{selectedDriver.driverName}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Pay Delta</div>
                  <div className={clsx(
                    "text-xl font-bold",
                    selectedDriver.delta && selectedDriver.delta > 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {selectedDriver.delta !== null ? (
                      `${selectedDriver.delta > 0 ? "+" : ""}$${selectedDriver.delta.toFixed(2)}`
                    ) : "N/A"}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h4 className="font-medium text-slate-900 mb-3">Comparison Breakdown</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Predicted Trips</span>
                  <span className="font-medium">{selectedDriver.predTrips}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual Trips</span>
                  <span className="font-medium">{selectedDriver.actualTrips}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Predicted Miles</span>
                  <span className="font-medium">{selectedDriver.predMiles.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual Miles</span>
                  <span className="font-medium">{selectedDriver.actualMiles.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Predicted On-Time</span>
                  <span className="font-medium">{selectedDriver.predOnTime.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Actual On-Time</span>
                  <span className="font-medium">{selectedDriver.actualOnTime.toFixed(0)}%</span>
                </div>
              </div>
            </div>

            {selectedDriver.flags.length > 0 && (
              <div className="rounded-xl border p-4">
                <h4 className="font-medium text-slate-900 mb-3">Likely Causes</h4>
                <div className="space-y-2">
                  {selectedDriver.flags.map((flag: string) => (
                    <div key={flag} className="flex items-center gap-2">
                      <Pill tone={
                        flag === "LATE_PICKUPS" ? "red" :
                        flag === "MORE_MILES" ? "amber" :
                        "slate"
                      }>
                        {flag}
                      </Pill>
                      <span className="text-sm text-slate-600">
                        {flag === "LATE_PICKUPS" ? "Late pickup windows" :
                         flag === "MORE_MILES" ? "More miles than predicted" :
                         flag === "FEWER_TRIPS" ? "Fewer trips assigned" :
                         flag === "MORE_TRIPS" ? "More trips assigned" :
                         flag === "FEWER_MILES" ? "Fewer miles than predicted" :
                         flag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default function IDSShadowRunDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const runId = params.id ? parseInt(params.id, 10) : 0;

  // Fetch shadow run data from API
  const { data: apiData, isLoading, error } = trpc.ids.getShadowRun.useQuery(
    { id: runId },
    { enabled: runId > 0 }
  );

  // Fetch comparison data - must be before early returns
  const { data: comparisonData } = trpc.ids.compareWithActual.useQuery(
    { shadowRunId: runId },
    { enabled: runId > 0 && !!apiData }
  );

  // Transform API data to component format
  const data = useMemo(() => transformApiData(apiData), [apiData]);

  const [activeTab, setActiveTab] = useState<TabId>("routes");
  // Default: Exceptions Only ON for workbench tabs (unassigned, locks, pay), OFF for routes
  const [exceptionsOnly, setExceptionsOnly] = useState(false);

  // Set default exceptionsOnly based on tab - workbench tabs default to ON
  useEffect(() => {
    const workbenchTabs: TabId[] = ["unassigned", "locks", "pay"];
    if (workbenchTabs.includes(activeTab)) {
      setExceptionsOnly(true);
    } else if (activeTab === "routes") {
      // Routes can be either way, default to OFF
      setExceptionsOnly(false);
    }
  }, [activeTab]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RouteRow | null>(null);
  const [selectedPay, setSelectedPay] = useState<PredictedPayRow | null>(null);

  const filteredRoutes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.routes
      .filter((r) => {
        if (!q) return true;
        return (
          r.driver.name.toLowerCase().includes(q) ||
          r.driver.id.toLowerCase().includes(q) ||
          r.vehicle.unitNumber.toLowerCase().includes(q)
        );
      })
      .filter((r) => {
        if (!exceptionsOnly) return true;
        return (
          r.flags.length > 0 ||
          r.summary.onTimePct < 95 ||
          r.summary.estimatedDeadheadMiles > 10
        );
      });
  }, [data.routes, query, exceptionsOnly]);

  const filteredUnassigned = useMemo(() => {
    if (!exceptionsOnly) return data.unassigned;
    return data.unassigned.filter(u => u.severity === "warn" || u.severity === "danger");
  }, [data.unassigned, exceptionsOnly]);

  const filteredLocks = useMemo(() => {
    if (!exceptionsOnly) return data.locks;
    return [...data.locks].sort((a, b) => (a.status === "violated" ? -1 : 1) - (b.status === "violated" ? -1 : 1));
  }, [data.locks, exceptionsOnly]);

  const filteredPay = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.predictedPay
      .filter((p) => {
        if (!q) return true;
        return p.driver.name.toLowerCase().includes(q) || p.driver.id.toLowerCase().includes(q);
      })
      .filter((p) => {
        if (!exceptionsOnly) return true;
        return p.flags.length > 0;
      });
  }, [data.predictedPay, query, exceptionsOnly]);

  const onTimeTone = kpiToneForPct(data.shadowRun.kpis.onTimePct);
  const unassignedTone: PillTone = data.shadowRun.counts.tripsUnassigned > 0 ? "red" : "green";
  const lockTone: PillTone = data.shadowRun.kpis.lockViolations > 0 ? "red" : "green";

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-slate-500">Loading shadow run...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          Error loading shadow run: {error.message}
        </div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; count?: number }[] = [
    { id: "routes", label: "Routes", count: data.routes.length },
    { id: "unassigned", label: "Unassigned", count: data.unassigned.length },
    { id: "locks", label: "Template Locks", count: data.locks.length },
    { id: "pay", label: "Predicted Pay", count: data.predictedPay.length },
    { id: "compare", label: "Compare" },
  ];

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-2xl font-semibold text-slate-900 truncate">IDS Shadow Run</div>
          <div className="mt-1 text-sm text-slate-500">
            Shadow optimization results (read-only) • Service Date:{" "}
            <span className="font-medium text-slate-700">{data.shadowRun.serviceDate}</span>{" "}
            • Algorithm:{" "}
            <span className="font-medium text-slate-700">
              {data.shadowRun.algorithm.name} v{data.shadowRun.algorithm.version}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation("/ids/shadow-runs")}
            className="px-3 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50"
          >
            Back to Shadow Runs
          </button>
          <button className="px-3 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50">
            Download Report
          </button>
          <button className="px-3 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600">
            Re-run Shadow
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          title="Trips Assigned"
          value={data.shadowRun.counts.tripsAssigned}
          sub={`of ${data.shadowRun.counts.tripsTotal} scheduled`}
          tone="slate"
        />
        <KpiCard
          title="Predicted On-Time"
          value={`${data.shadowRun.kpis.onTimePct.toFixed(1)}%`}
          sub="within pickup windows"
          tone={onTimeTone}
        />
        <KpiCard
          title="Unassigned"
          value={data.shadowRun.counts.tripsUnassigned}
          sub="needs dispatch review"
          tone={unassignedTone}
          onClick={() => setActiveTab("unassigned")}
        />
        <KpiCard
          title="Lock Violations"
          value={data.shadowRun.kpis.lockViolations}
          sub="template locks respected"
          tone={lockTone}
          onClick={() => setActiveTab("locks")}
        />
      </div>

      {/* Run Summary Panel */}
      <div className="rounded-xl border bg-white p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-slate-500">Run ID</div>
              <div className="font-medium text-slate-900">#{data.shadowRun.id}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Created</div>
              <div className="font-medium text-slate-900">{new Date(data.shadowRun.createdAt).toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Drivers Used</div>
              <div className="font-medium text-slate-900">{data.shadowRun.counts.driversUsed} / {data.shadowRun.counts.driversAvailable}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Runtime</div>
              <div className="font-medium text-slate-900">{data.shadowRun.kpis.runtimeSeconds.toFixed(3)}s</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="blue">Shadow</Pill>
            <button
              onClick={() => setExceptionsOnly((v) => !v)}
              className={clsx(
                "px-3 py-2 rounded-lg border text-sm font-medium",
                exceptionsOnly ? "border-orange-300 bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              Exceptions Only
            </button>
            <div className="relative">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search driver, vehicle, trip..."
                className="w-[280px] max-w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-200"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <Pill tone="slate">GAP-FILL WINS: {data.shadowRun.kpis.gapFillWins}</Pill>
          <Pill tone="slate">EST. DEADHEAD: {data.shadowRun.kpis.estimatedDeadheadMiles.toFixed(1)} mi</Pill>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition",
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-100 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "routes" && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Routes</div>
              <div className="text-xs text-slate-500">Driver-level summary • click a row to view route detail</div>
            </div>
            <button className="px-3 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50">
              Export Routes CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="border-b bg-white">
                <tr className="h-11 text-xs text-slate-500">
                  <th className="px-3 text-left w-[220px]">Driver</th>
                  <th className="px-3 text-left w-[110px]">Vehicle</th>
                  <th className="px-3 text-left w-[70px]">Trips</th>
                  <th className="px-3 text-left w-[110px]">Miles (est.)</th>
                  <th className="px-3 text-left w-[130px]">Start–End</th>
                  <th className="px-3 text-left w-[100px]">On-Time</th>
                  <th className="px-3 text-left w-[130px]">Deadhead</th>
                  <th className="px-3 text-left w-[140px]">Pred Pay</th>
                  <th className="px-3 text-left w-[240px]">Flags</th>
                  <th className="px-3 text-right w-[90px]">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredRoutes.map((r) => {
                  const onTone = kpiToneForPct(r.summary.onTimePct);
                  const mobilityTone: PillTone = r.vehicle.mobility === "wheelchair" ? "purple" : "slate";
                  return (
                    <tr
                      key={r.driver.id}
                      onClick={() => setSelected(r)}
                      className="h-12 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                    >
                      <td className="px-3 py-2">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{r.driver.name}</div>
                          <div className="text-xs text-slate-500 truncate">
                            {r.driver.id} • {r.driver.type} • {r.driver.shift.start}–{r.driver.shift.end}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{r.vehicle.unitNumber}</span>
                          <Pill tone={mobilityTone}>{r.vehicle.mobility === "wheelchair" ? "WC" : "STD"}</Pill>
                        </div>
                      </td>

                      <td className="px-3 py-2">{r.summary.tripCount}</td>
                      <td className="px-3 py-2">{r.summary.estimatedMiles.toFixed(1)} mi</td>
                      <td className="px-3 py-2">
                        {r.summary.startTime}–{r.summary.endTime}
                      </td>

                      <td className="px-3 py-2">
                        <Pill tone={onTone}>{r.summary.onTimePct.toFixed(1)}%</Pill>
                      </td>

                      <td className="px-3 py-2">{r.summary.estimatedDeadheadMiles.toFixed(1)} mi</td>

                      <td className="px-3 py-2 font-semibold text-green-600">
                        ${r.summary.predictedPayNet.toFixed(2)}
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex flex-wrap gap-1 max-h-[40px] overflow-hidden">
                          {r.flags.length === 0 ? (
                            <Pill tone="green">OK</Pill>
                          ) : (
                            r.flags.map((f) => (
                              <Pill
                                key={f.code}
                                tone={f.severity === "danger" ? "red" : f.severity === "warn" ? "amber" : "blue"}
                              >
                                {f.label}
                              </Pill>
                            ))
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-2 text-right">
                        <button
                          className="text-sm font-medium text-slate-700 hover:text-slate-900"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelected(r);
                          }}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {filteredRoutes.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                      {exceptionsOnly ? "No routes with exceptions. Toggle \"Exceptions Only\" off to see all routes." : "No routes match your filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "unassigned" && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="font-semibold text-slate-900">Unassigned Trips</div>
            <div className="text-xs text-slate-500">Trips that could not be assigned • review and manually assign</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full">
              <thead className="border-b bg-white">
                <tr className="h-11 text-xs text-slate-500">
                  <th className="px-3 text-left w-[100px]">Trip ID</th>
                  <th className="px-3 text-left w-[80px]">Mobility</th>
                  <th className="px-3 text-left w-[180px]">Pickup</th>
                  <th className="px-3 text-left w-[180px]">Dropoff</th>
                  <th className="px-3 text-left w-[120px]">Window</th>
                  <th className="px-3 text-left w-[200px]">Reason</th>
                  <th className="px-3 text-right w-[70px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUnassigned.map((u) => (
                  <tr key={u.tripId} className="h-12 border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{u.tripId}</td>
                    <td className="px-3 py-2">
                      <Pill tone={u.mobility === "WC" ? "purple" : u.mobility === "STR" ? "amber" : "slate"}>
                        {u.mobility}
                      </Pill>
                    </td>
                    <td className="px-3 py-2 truncate max-w-[180px]">{u.pickup}</td>
                    <td className="px-3 py-2 truncate max-w-[180px]">{u.dropoff}</td>
                    <td className="px-3 py-2">{u.window}</td>
                    <td className="px-3 py-2">
                      <Pill tone={u.severity === "danger" ? "red" : "amber"}>{u.reason}</Pill>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button className="text-sm font-medium text-orange-600 hover:text-orange-700">
                        Assign
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUnassigned.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                      All trips assigned successfully!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "locks" && (
        <div className="rounded-xl border bg-white overflow-hidden">
          {data.shadowRun.kpis.lockViolations > 0 && (
            <div className="px-4 py-3 bg-red-50 border-b border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <span className="font-semibold">⚠️ {data.shadowRun.kpis.lockViolations} Lock Violation(s)</span>
                <span className="text-sm">Template locks were not respected in this run.</span>
              </div>
            </div>
          )}
          <div className="px-4 py-3 border-b">
            <div className="font-semibold text-slate-900">Template Locks</div>
            <div className="text-xs text-slate-500">Driver-trip locks that must be respected</div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[700px] w-full">
              <thead className="border-b bg-white">
                <tr className="h-11 text-xs text-slate-500">
                  <th className="px-3 text-left w-[120px]">Template ID</th>
                  <th className="px-3 text-left w-[200px]">Driver</th>
                  <th className="px-3 text-left w-[140px]">Day Pattern</th>
                  <th className="px-3 text-left w-[100px]">Status</th>
                  <th className="px-3 text-right w-[70px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocks.map((l) => (
                  <tr key={l.templateId} className="h-12 border-b last:border-b-0 hover:bg-slate-50">
                    <td className="px-3 py-2 font-medium">{l.templateId}</td>
                    <td className="px-3 py-2">{l.driver}</td>
                    <td className="px-3 py-2">{l.dayPattern}</td>
                    <td className="px-3 py-2">
                      <Pill tone={l.status === "respected" ? "green" : "red"}>
                        {l.status === "respected" ? "Respected" : "VIOLATED"}
                      </Pill>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button className="text-sm font-medium text-slate-700 hover:text-slate-900">
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredLocks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-slate-500">
                      No template locks configured.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "pay" && (
        <div className="rounded-xl border bg-white overflow-hidden">
          <div className="px-4 py-3 border-b flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-900">Predicted Pay</div>
              <div className="text-xs text-slate-500">Estimated driver earnings based on shadow assignments</div>
            </div>
            <div className="text-sm font-semibold text-green-600">
              Total: ${data.predictedPay.reduce((sum, p) => sum + p.net, 0).toFixed(2)}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full">
              <thead className="border-b bg-white">
                <tr className="h-11 text-xs text-slate-500">
                  <th className="px-3 text-left w-[220px]">Driver</th>
                  <th className="px-3 text-left w-[100px]">Contract</th>
                  <th className="px-3 text-left w-[60px]">Trips</th>
                  <th className="px-3 text-left w-[80px]">Miles</th>
                  <th className="px-3 text-left w-[80px]">Rate</th>
                  <th className="px-3 text-left w-[100px]">Base Pay</th>
                  <th className="px-3 text-left w-[100px]">Adjustments</th>
                  <th className="px-3 text-left w-[100px]">Deductions</th>
                  <th className="px-3 text-left w-[100px]">Net</th>
                  <th className="px-3 text-right w-[70px]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPay.map((p) => (
                  <tr
                    key={p.driver.id}
                    onClick={() => setSelectedPay(p)}
                    className="h-12 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="px-3 py-2">
                      <div className="min-w-0">
                        <div className="font-medium truncate">{p.driver.name}</div>
                        <div className="text-xs text-slate-500 truncate">
                          {p.driver.id} • {p.driver.type}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">{p.contract}</td>
                    <td className="px-3 py-2">{p.trips}</td>
                    <td className="px-3 py-2">{p.miles.toFixed(1)}</td>
                    <td className="px-3 py-2">${p.rate.toFixed(2)}</td>
                    <td className="px-3 py-2">${p.basePay.toFixed(2)}</td>
                    <td className="px-3 py-2">
                      {p.adjustments > 0 ? (
                        <span className="text-green-600">+${p.adjustments.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">$0.00</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {p.deductions > 0 ? (
                        <span className="text-red-600">-${p.deductions.toFixed(2)}</span>
                      ) : (
                        <span className="text-slate-400">$0.00</span>
                      )}
                    </td>
                    <td className="px-3 py-2 font-bold text-green-600">${p.net.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        className="text-sm font-medium text-slate-700 hover:text-slate-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPay(p);
                        }}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredPay.length === 0 && (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                      {exceptionsOnly ? "No drivers with pay exceptions. Toggle \"Exceptions Only\" off to see all." : "No predicted pay data."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compare Tab */}
      {activeTab === "compare" && (
        <CompareTab 
          shadowRunId={runId} 
          serviceDate={data.shadowRun.serviceDate}
          comparisonData={comparisonData}
        />
      )}

      {/* Route Drawer */}
      <Drawer
        open={!!selected}
        title={selected ? `Route — ${selected.driver.name} (${selected.vehicle.unitNumber})` : ""}
        onClose={() => setSelected(null)}
      >
        {selected && (
          <div className="space-y-4">
            {/* Mini KPIs */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl border p-3">
                <div className="text-xs text-slate-500">On-Time</div>
                <div className="mt-1 font-semibold">
                  <Pill tone={kpiToneForPct(selected.summary.onTimePct)}>{selected.summary.onTimePct.toFixed(1)}%</Pill>
                </div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-slate-500">Deadhead</div>
                <div className="mt-1 font-semibold">{selected.summary.estimatedDeadheadMiles.toFixed(1)} mi</div>
              </div>
              <div className="rounded-xl border p-3">
                <div className="text-xs text-slate-500">Pred Pay</div>
                <div className="mt-1 font-semibold">${selected.summary.predictedPayNet.toFixed(2)}</div>
              </div>
            </div>

            {/* Stops table */}
            <div className="rounded-xl border overflow-hidden">
              <div className="px-3 py-2 border-b">
                <div className="font-semibold text-slate-900">Stops Timeline</div>
                <div className="text-xs text-slate-500">Planned order • pickup must precede dropoff</div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-[520px] w-full">
                  <thead className="border-b bg-white">
                    <tr className="h-10 text-xs text-slate-500">
                      <th className="px-3 text-left w-[50px]">#</th>
                      <th className="px-3 text-left w-[90px]">Type</th>
                      <th className="px-3 text-left w-[140px]">Trip</th>
                      <th className="px-3 text-left w-[140px]">Window</th>
                      <th className="px-3 text-left w-[90px]">ETA</th>
                      <th className="px-3 text-left w-[80px]">Slack</th>
                      <th className="px-3 text-left w-[120px]">Lock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.routeDetail.timeline.map((s) => (
                      <tr key={s.seq} className="h-11 border-b last:border-b-0">
                        <td className="px-3 py-2">{s.seq}</td>
                        <td className="px-3 py-2">
                          <Pill tone={s.stopType === "pickup" ? "blue" : "slate"}>{s.stopType}</Pill>
                        </td>
                        <td className="px-3 py-2 font-medium">{s.tripId}</td>
                        <td className="px-3 py-2">
                          {s.window.start}–{s.window.end}
                        </td>
                        <td className="px-3 py-2">{s.eta}</td>
                        <td className="px-3 py-2">
                          <Pill tone={s.slackMinutes >= 0 ? "green" : "amber"}>
                            {s.slackMinutes}m
                          </Pill>
                        </td>
                        <td className="px-3 py-2">
                          {s.lock?.isLocked ? (
                            <Pill tone={s.lock.lockType === "hard" ? "purple" : "slate"}>
                              {s.lock.templateId ?? "Locked"}
                            </Pill>
                          ) : (
                            <Pill tone="slate">—</Pill>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Issues */}
            {selected.routeDetail.issues.length > 0 && (
              <div className="rounded-xl border p-3 bg-amber-50">
                <div className="font-semibold text-slate-900">Issues</div>
                <ul className="mt-2 space-y-1 text-sm text-slate-700">
                  {selected.routeDetail.issues.map((i, idx) => (
                    <li key={idx} className="flex gap-2">
                      <Pill tone={i.severity === "danger" ? "red" : i.severity === "warn" ? "amber" : "slate"}>
                        {i.severity.toUpperCase()}
                      </Pill>
                      <span>{i.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Pay Drawer */}
      <Drawer
        open={!!selectedPay}
        title={selectedPay ? `Predicted Pay — ${selectedPay.driver.name}` : ""}
        onClose={() => setSelectedPay(null)}
      >
        {selectedPay && (
          <div className="space-y-4">
            <div className="rounded-xl border p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-slate-500">Driver</div>
                  <div className="font-medium">{selectedPay.driver.name}</div>
                  <div className="text-xs text-slate-500">{selectedPay.driver.id} • {selectedPay.driver.type}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Contract</div>
                  <div className="font-medium">{selectedPay.contract}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border overflow-hidden">
              <div className="px-3 py-2 border-b font-semibold text-slate-900">Pay Breakdown</div>
              <div className="p-3 space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Trips</span>
                  <span className="font-medium">{selectedPay.trips}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Miles</span>
                  <span className="font-medium">{selectedPay.miles.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Rate</span>
                  <span className="font-medium">${selectedPay.rate.toFixed(2)}/mi</span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="text-slate-500">Base Pay (Miles × Rate)</span>
                  <span className="font-medium">${selectedPay.basePay.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Adjustments</span>
                  <span className={selectedPay.adjustments > 0 ? "font-medium text-green-600" : "text-slate-400"}>
                    {selectedPay.adjustments > 0 ? `+$${selectedPay.adjustments.toFixed(2)}` : "$0.00"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Deductions</span>
                  <span className={selectedPay.deductions > 0 ? "font-medium text-red-600" : "text-slate-400"}>
                    {selectedPay.deductions > 0 ? `-$${selectedPay.deductions.toFixed(2)}` : "$0.00"}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between">
                  <span className="font-semibold">Net Pay</span>
                  <span className="font-bold text-green-600">${selectedPay.net.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
