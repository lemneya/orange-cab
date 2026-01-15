// LocksTable.tsx
// Trust-layer table for IDS Template Locks (Payroll-native density).

import React, { useMemo, useState } from "react";

type LockRow = {
  templateId: string;
  driver: { id: string; name: string };
  lockType: "hard" | "soft";
  tripsLocked: number;
  source: { type: string; name: string };
  notes?: string;
  status: "respected" | "violated";
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

export function LocksTable({ locks }: { locks: LockRow[] }) {
  const [q, setQ] = useState("");
  const [onlyViolations, setOnlyViolations] = useState(false);

  const violatedCount = useMemo(() => locks.filter((l) => l.status === "violated").length, [locks]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return locks
      .filter((l) => {
        if (!qq) return true;
        return (
          l.templateId.toLowerCase().includes(qq) ||
          l.driver.name.toLowerCase().includes(qq) ||
          l.driver.id.toLowerCase().includes(qq) ||
          (l.notes ?? "").toLowerCase().includes(qq)
        );
      })
      .filter((l) => (onlyViolations ? l.status === "violated" : true));
  }, [locks, q, onlyViolations]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b flex flex-col gap-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="font-semibold text-slate-900">Template Locks</div>
            <div className="text-xs text-slate-500">Trust layer • lock violations must be 0 before production pilot</div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOnlyViolations((v) => !v)}
              className={clsx(
                "px-3 py-2 rounded-lg border text-sm font-medium",
                onlyViolations ? "border-red-300 bg-red-50 text-red-700" : "text-slate-700 hover:bg-slate-50"
              )}
            >
              Violations Only
            </button>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search template, driver, notes..."
              className="w-[320px] max-w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-200"
            />
            <button className="px-3 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50">
              Export Locks CSV
            </button>
          </div>
        </div>

        {violatedCount > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
            <span className="font-semibold">Attention:</span> {violatedCount} lock violation(s). Lock violations must be{" "}
            <span className="font-semibold">0</span> before any production pilot.
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1180px] w-full">
          <thead className="border-b bg-white">
            <tr className="h-11 text-xs text-slate-500">
              <th className="px-3 text-left w-[140px]">Template ID</th>
              <th className="px-3 text-left w-[220px]">Driver</th>
              <th className="px-3 text-left w-[110px]">Lock Type</th>
              <th className="px-3 text-left w-[110px]">Trips Locked</th>
              <th className="px-3 text-left w-[160px]">Source</th>
              <th className="px-3 text-left w-[320px]">Notes</th>
              <th className="px-3 text-left w-[120px]">Status</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((l) => (
              <tr key={l.templateId + l.driver.id} className="h-12 border-b last:border-b-0 hover:bg-slate-50">
                <td className="px-3 py-2 font-medium">{l.templateId}</td>

                <td className="px-3 py-2">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{l.driver.name}</div>
                    <div className="text-xs text-slate-500 truncate">{l.driver.id}</div>
                  </div>
                </td>

                <td className="px-3 py-2">
                  <Pill tone={l.lockType === "hard" ? "purple" : "slate"}>{l.lockType.toUpperCase()}</Pill>
                </td>

                <td className="px-3 py-2">{l.tripsLocked}</td>

                <td className="px-3 py-2">
                  <div className="truncate max-w-[160px]">{l.source.name}</div>
                  <div className="text-xs text-slate-500">{l.source.type}</div>
                </td>

                <td className="px-3 py-2">
                  <div className="truncate max-w-[320px]">{l.notes ?? "—"}</div>
                </td>

                <td className="px-3 py-2">
                  <Pill tone={l.status === "violated" ? "red" : "green"}>{l.status.toUpperCase()}</Pill>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-sm text-slate-500">
                  No locks match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { LockRow };
