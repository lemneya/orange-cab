// PredictedPayTable.tsx
// Payroll-parity table for IDS Predicted Pay.

import React, { useMemo, useState } from "react";

type PayRow = {
  driver: { id: string; name: string };
  tripCount: number;
  miles: number;
  payRule: { id: string; label: string; scheme: string; rate: number };
  grossPred: number;
  adjustmentsPred?: Array<{ label: string; amount: number }>;
  deductionsPred?: Array<{ label: string; amount: number }>;
  netPred: number;
  flags?: Array<{ code: string; label: string; severity: "info" | "warn" | "danger" }>;
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

function sum(xs?: Array<{ amount: number }>) {
  return (xs ?? []).reduce((a, b) => a + (b.amount ?? 0), 0);
}

export function PredictedPayTable({
  rows,
  onView,
}: {
  rows: PayRow[];
  onView: (row: PayRow) => void;
}) {
  const [q, setQ] = useState("");
  const [exceptionsOnly, setExceptionsOnly] = useState(true);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return rows
      .filter((r) => {
        if (!qq) return true;
        return (
          r.driver.name.toLowerCase().includes(qq) ||
          r.driver.id.toLowerCase().includes(qq) ||
          r.payRule.label.toLowerCase().includes(qq)
        );
      })
      .filter((r) => (exceptionsOnly ? (r.flags ?? []).length > 0 : true));
  }, [rows, q, exceptionsOnly]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      <div className="px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="font-semibold text-slate-900">Predicted Driver Pay</div>
          <div className="text-xs text-slate-500">Payroll parity view • read-only predicted values</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setExceptionsOnly((v) => !v)}
            className={clsx(
              "px-3 py-2 rounded-lg border text-sm font-medium",
              exceptionsOnly ? "border-orange-300 bg-orange-50 text-orange-700" : "text-slate-700 hover:bg-slate-50"
            )}
          >
            Exceptions Only
          </button>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search driver, rule..."
            className="w-[280px] max-w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-200"
          />
          <button className="px-3 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50">
            Export Pay CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-[1200px] w-full">
          <thead className="border-b bg-white">
            <tr className="h-11 text-xs text-slate-500">
              <th className="px-3 text-left w-[220px]">Driver</th>
              <th className="px-3 text-left w-[70px]">Trips</th>
              <th className="px-3 text-left w-[110px]">Miles</th>
              <th className="px-3 text-left w-[140px]">Rate Rule</th>
              <th className="px-3 text-left w-[120px]">Gross</th>
              <th className="px-3 text-left w-[120px]">Adj</th>
              <th className="px-3 text-left w-[120px]">Ded</th>
              <th className="px-3 text-left w-[130px]">Net</th>
              <th className="px-3 text-left w-[220px]">Flags</th>
              <th className="px-3 text-right w-[90px]">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((r) => {
              const adj = sum(r.adjustmentsPred);
              const ded = sum(r.deductionsPred);
              return (
                <tr
                  key={r.driver.id}
                  className="h-12 border-b last:border-b-0 hover:bg-slate-50 cursor-pointer"
                  onClick={() => onView(r)}
                >
                  <td className="px-3 py-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{r.driver.name}</div>
                      <div className="text-xs text-slate-500 truncate">{r.driver.id}</div>
                    </div>
                  </td>

                  <td className="px-3 py-2">{r.tripCount}</td>
                  <td className="px-3 py-2">{r.miles.toFixed(1)}</td>

                  <td className="px-3 py-2">
                    <div className="truncate max-w-[140px]">{r.payRule.label}</div>
                    <div className="text-xs text-slate-500">{r.payRule.scheme}</div>
                  </td>

                  <td className="px-3 py-2">${r.grossPred.toFixed(2)}</td>
                  <td className="px-3 py-2">{adj ? `$${adj.toFixed(2)}` : "—"}</td>
                  <td className="px-3 py-2">{ded ? `$${ded.toFixed(2)}` : "—"}</td>

                  <td className="px-3 py-2 font-semibold">${r.netPred.toFixed(2)}</td>

                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1 max-h-[40px] overflow-hidden">
                      {(r.flags ?? []).length === 0 ? (
                        <Pill tone="green">OK</Pill>
                      ) : (
                        (r.flags ?? []).map((f) => (
                          <Pill
                            key={f.code}
                            tone={f.severity === "danger" ? "red" : f.severity === "warn" ? "amber" : "slate"}
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
                        onView(r);
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center text-sm text-slate-500">
                  No predicted pay rows match your filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export type { PayRow };
