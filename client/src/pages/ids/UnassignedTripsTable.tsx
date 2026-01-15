// UnassignedTripsTable.tsx
// Payroll-native dense table for IDS Unassigned Trips.
// Drop into /ids/shadow-runs/:id under the Unassigned view.

import React, { useMemo, useState } from "react";

type UnassignedTrip = {
  tripId: string;
  mobility: "standard" | "wheelchair";
  pickupWindow: { start: string; end: string };
  pickupShort: string;
  dropoffShort: string;
  requiredVehicle?: "standard" | "wheelchair";
  reason: { code: string; label: string };
  suggestedFix?: { type: string; label: string; candidateDrivers?: string[] };
  severity: "info" | "warn" | "danger";
};

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Pill({
  tone = "slate",
  children,
}: {
  tone?: "slate" | "green" | "amber" | "red" | "purple" | "blue";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
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

function severityTone(s: UnassignedTrip["severity"]) {
  if (s === "danger") return "red";
  if (s === "warn") return "amber";
  return "slate";
}

export function UnassignedTripsTable({
  trips,
  onView,
}: {
  trips: UnassignedTrip[];
  onView: (trip: UnassignedTrip) => void;
}) {
  const [q, setQ] = useState("");
  const [onlyExceptions, setOnlyExceptions] = useState(true);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return trips
      .filter((t) => {
        if (!qq) return true;
        return (
          t.tripId.toLowerCase().includes(qq) ||
          t.pickupShort.toLowerCase().includes(qq) ||
          t.dropoffShort.toLowerCase().includes(qq) ||
          t.reason.label.toLowerCase().includes(qq)
        );
      })
      .filter((t) => (onlyExceptions ? t.severity !== "info" : true));
  }, [trips, q, onlyExceptions]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900">Unassigned Trips</div>
          <div className="text-xs text-slate-500">Exception workbench • nothing should be silently dropped</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setOnlyExceptions((v) => !v)}
            className={clsx(
              "px-3 py-2 rounded-lg border text-sm font-medium",
              onlyExceptions ? "border-orange-300 bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            Exceptions Only
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search trip, pickup, dropoff, reason..."
            className="w-[320px] max-w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-200"
          />
          <button className="px-3 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50">
            Export Unassigned CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1150px] w-full">
          <thead className="border-b bg-white">
            <tr className="h-11 text-xs text-slate-500">
              <th className="px-3 text-left w-[140px]">Trip ID</th>
              <th className="px-3 text-left w-[110px]">Mobility</th>
              <th className="px-3 text-left w-[140px]">Pickup Window</th>
              <th className="px-3 text-left w-[220px]">Pickup</th>
              <th className="px-3 text-left w-[220px]">Dropoff</th>
              <th className="px-3 text-left w-[220px]">Reason</th>
              <th className="px-3 text-left w-[220px]">Suggested Fix</th>
              <th className="px-3 text-right w-[90px]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((t) => (
              <tr
                key={t.tripId}
                className="h-12 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                onClick={() => onView(t)}
              >
                <td className="px-3 py-2 font-medium">{t.tripId}</td>

                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Pill tone={t.mobility === "wheelchair" ? "purple" : "slate"}>
                      {t.mobility === "wheelchair" ? "WC" : "STD"}
                    </Pill>
                    {t.requiredVehicle && t.requiredVehicle !== t.mobility && (
                      <Pill tone="amber">Req: {t.requiredVehicle === "wheelchair" ? "WC" : "STD"}</Pill>
                    )}
                  </div>
                </td>

                <td className="px-3 py-2">
                  {t.pickupWindow.start}–{t.pickupWindow.end}
                </td>

                <td className="px-3 py-2">
                  <div className="truncate max-w-[220px]">{t.pickupShort}</div>
                </td>

                <td className="px-3 py-2">
                  <div className="truncate max-w-[220px]">{t.dropoffShort}</div>
                </td>

                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <Pill tone={severityTone(t.severity)}>{t.severity.toUpperCase()}</Pill>
                    <span className="text-sm text-slate-700 truncate max-w-[170px]">{t.reason.label}</span>
                  </div>
                </td>

                <td className="px-3 py-2">
                  {t.suggestedFix?.label ? (
                    <span className="text-sm text-slate-700 truncate max-w-[220px] inline-block">
                      {t.suggestedFix.label}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">—</span>
                  )}
                </td>

                <td className="px-3 py-2 text-right">
                  <button
                    className="text-sm font-medium text-slate-700 hover:text-slate-900"
                    onClick={(e) => {
                      e.stopPropagation();
                      onView(t);
                    }}
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                  No unassigned trips match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { UnassignedTrip };
