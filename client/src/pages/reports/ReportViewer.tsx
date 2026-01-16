// Report Viewer Page - OC-REPORT-0
// View generated report with KPI cards, tables, and export options

import React, { useRef, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "../../lib/trpc";

function clsx(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Pill({
  tone = "slate",
  children,
}: {
  tone?: "slate" | "green" | "amber" | "red" | "purple" | "blue" | "orange";
  children: React.ReactNode;
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-green-100 text-green-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    purple: "bg-purple-100 text-purple-700",
    blue: "bg-blue-100 text-blue-700",
    orange: "bg-orange-100 text-orange-700",
  };
  return (
    <span className={clsx("px-2 py-0.5 rounded-full text-xs font-medium", tones[tone])}>
      {children}
    </span>
  );
}

function KPICard({
  label,
  value,
  subValue,
  trend,
  trendLabel,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="text-sm text-slate-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-slate-900">{value}</div>
      {subValue && <div className="text-sm text-slate-500 mt-1">{subValue}</div>}
      {trend && trendLabel && (
        <div
          className={clsx(
            "text-xs mt-2",
            trend === "up" ? "text-green-600" : trend === "down" ? "text-red-600" : "text-slate-500"
          )}
        >
          {trend === "up" ? "↑" : trend === "down" ? "↓" : "→"} {trendLabel}
        </div>
      )}
    </div>
  );
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export default function ReportViewer() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const reportRef = useRef<HTMLDivElement>(null);

  const runId = parseInt(params.id || "0");
  const { data: run, isLoading } = trpc.reports.getReportRunById.useQuery({ id: runId });
  const { data: artifacts } = trpc.reports.getArtifacts.useQuery({ runId });
  const { data: narratives, refetch: refetchNarratives } = trpc.reports.getNarratives.useQuery({ runId });
  const { data: llmStatus } = trpc.reports.checkLLMStatus.useQuery();
  const generateNarrativeMutation = trpc.reports.generateNarrative.useMutation();

  const [narrativeStyle, setNarrativeStyle] = useState<"INTERNAL" | "CLIENT">("INTERNAL");
  const [showNarrativePanel, setShowNarrativePanel] = useState(false);
  const [currentNarrative, setCurrentNarrative] = useState<string | null>(null);

  const handleGenerateNarrative = async () => {
    try {
      const result = await generateNarrativeMutation.mutateAsync({
        runId,
        style: narrativeStyle,
        useTemplate: !llmStatus?.available, // Use template if LLM unavailable
      });
      if (result.result.success && result.result.markdown) {
        setCurrentNarrative(result.result.markdown);
        setShowNarrativePanel(true);
      }
      refetchNarratives();
    } catch (error) {
      console.error("Failed to generate narrative:", error);
    }
  };

  const handleCopyNarrative = () => {
    if (currentNarrative) {
      navigator.clipboard.writeText(currentNarrative);
    }
  };

  const handleExportPDF = () => {
    // Use browser print to PDF
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!run?.kpisJson) return;
    const blob = new Blob([JSON.stringify(run.kpisJson, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${runId}_kpis.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-slate-500">Loading report...</div>
      </div>
    );
  }

  if (!run) {
    return (
      <div className="p-6">
        <div className="text-red-500">Report not found</div>
      </div>
    );
  }

  const kpis = run.kpisJson;
  const audit = run.auditJson;

  return (
    <div className="p-6 space-y-6">
      {/* Header - Hidden in print */}
      <div className="flex items-start justify-between gap-3 print:hidden">
        <div>
          <button
            onClick={() => setLocation("/reports")}
            className="text-sm text-slate-500 hover:text-slate-700 mb-2"
          >
            ← Back to Reports
          </button>
          <h1 className="text-2xl font-bold text-slate-900">
            {run.templateName || `Report #${run.id}`}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {run.filtersJson.dateRange.start} to {run.filtersJson.dateRange.end}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadJSON}
            className="px-4 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50"
          >
            Download JSON
          </button>
          <button
            onClick={handleExportPDF}
            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Report Content */}
      <div ref={reportRef} className="space-y-6">
        {/* Print Header */}
        <div className="hidden print:block mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            {run.templateName || `Report #${run.id}`}
          </h1>
          <p className="text-sm text-slate-500">
            Period: {run.filtersJson.dateRange.start} to {run.filtersJson.dateRange.end}
          </p>
          <p className="text-sm text-slate-500">
            Generated: {new Date(run.createdAt).toLocaleString()}
          </p>
        </div>

        {/* Status Banner */}
        {run.status !== "COMPLETED" && (
          <div
            className={clsx(
              "rounded-xl p-4",
              run.status === "FAILED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"
            )}
          >
            <strong>Status:</strong> {run.status}
            {run.errorMessage && <p className="mt-1 text-sm">{run.errorMessage}</p>}
          </div>
        )}

        {/* Executive Summary */}
        {kpis?.summary && (
          <section className="print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Executive Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KPICard
                label="Total Revenue"
                value={formatCurrency(kpis.summary.totalRevenue)}
                trend="up"
                trendLabel="from trips"
              />
              <KPICard
                label="Total Expenses"
                value={formatCurrency(kpis.summary.totalExpenses)}
                subValue={`Driver: ${formatCurrency(kpis.summary.expenseBreakdown.driverPay)}`}
              />
              <KPICard
                label="Net Margin"
                value={formatCurrency(kpis.summary.netMargin)}
                trend={kpis.summary.netMargin > 0 ? "up" : "down"}
                trendLabel={formatPercent(kpis.summary.marginPercent)}
              />
              <KPICard
                label="Margin %"
                value={formatPercent(kpis.summary.marginPercent)}
                trend={kpis.summary.marginPercent > 15 ? "up" : kpis.summary.marginPercent > 10 ? "neutral" : "down"}
                trendLabel={kpis.summary.marginPercent > 15 ? "Healthy" : "Below target"}
              />
            </div>
          </section>
        )}

        {/* Payroll Summary */}
        {kpis?.payroll && (
          <section className="print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Payroll Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <KPICard label="Total Driver Pay" value={formatCurrency(kpis.payroll.totalDriverPay)} />
              <KPICard label="Total Trips" value={formatNumber(kpis.payroll.totalTrips)} />
              <KPICard label="Total Miles" value={formatNumber(kpis.payroll.totalMiles)} />
              <KPICard
                label="Avg Pay/Trip"
                value={formatCurrency(kpis.payroll.avgPayPerTrip)}
                subValue={`${formatCurrency(kpis.payroll.avgPayPerMile)}/mile`}
              />
            </div>

            {/* Driver Pay Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Driver
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Trips
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Miles
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kpis.payroll.byDriver.map((driver) => (
                    <tr key={driver.driverId}>
                      <td className="px-4 py-3 font-medium text-slate-900">{driver.driverName}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatNumber(driver.trips)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatNumber(driver.miles)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(driver.pay)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 border-t">
                  <tr>
                    <td className="px-4 py-3 font-semibold text-slate-900">Total</td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatNumber(kpis.payroll.totalTrips)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatNumber(kpis.payroll.totalMiles)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-900">
                      {formatCurrency(kpis.payroll.totalDriverPay)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* Trip Metrics */}
        {kpis?.trips && (
          <section className="print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Trip Metrics</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <KPICard label="Total Trips" value={formatNumber(kpis.trips.totalTrips)} />
              <KPICard
                label="Completed"
                value={formatNumber(kpis.trips.completedTrips)}
                trend="up"
                trendLabel={formatPercent((kpis.trips.completedTrips / kpis.trips.totalTrips) * 100)}
              />
              <KPICard
                label="Canceled"
                value={formatNumber(kpis.trips.canceledTrips)}
                trend="down"
                trendLabel={formatPercent((kpis.trips.canceledTrips / kpis.trips.totalTrips) * 100)}
              />
              <KPICard
                label="No-Shows"
                value={formatNumber(kpis.trips.noShowTrips)}
                trend="down"
                trendLabel={formatPercent((kpis.trips.noShowTrips / kpis.trips.totalTrips) * 100)}
              />
              <KPICard
                label="On-Time Rate"
                value={formatPercent(kpis.trips.onTimeRate)}
                trend={kpis.trips.onTimeRate > 90 ? "up" : "down"}
                trendLabel={kpis.trips.onTimeRate > 90 ? "Target met" : "Below target"}
              />
            </div>
          </section>
        )}

        {/* Fuel & Tolls */}
        {kpis?.fuelTolls && (
          <section className="print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Fuel & Tolls</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <KPICard label="Total Fuel Cost" value={formatCurrency(kpis.fuelTolls.totalFuelCost)} />
              <KPICard label="Total Toll Cost" value={formatCurrency(kpis.fuelTolls.totalTollCost)} />
              <KPICard
                label="Fuel Gallons"
                value={formatNumber(kpis.fuelTolls.fuelGallons)}
                subValue={`${formatCurrency(kpis.fuelTolls.avgFuelPricePerGallon)}/gal`}
              />
              <KPICard
                label="Toll Transactions"
                value={formatNumber(kpis.fuelTolls.tollTransactionCount)}
              />
            </div>

            {/* Vehicle Breakdown Table */}
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Vehicle
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Fuel Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Toll Cost
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {kpis.fuelTolls.byVehicle.map((vehicle) => (
                    <tr key={vehicle.vehicleId}>
                      <td className="px-4 py-3 font-medium text-slate-900">{vehicle.vehicleUnit}</td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(vehicle.fuelCost)}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600">
                        {formatCurrency(vehicle.tollCost)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-slate-900">
                        {formatCurrency(vehicle.fuelCost + vehicle.tollCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* IDS Analysis */}
        {kpis?.ids && (
          <section className="print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">IDS Shadow Run Analysis</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <KPICard label="Shadow Runs" value={formatNumber(kpis.ids.shadowRunCount)} />
              <KPICard
                label="Predicted On-Time"
                value={formatPercent(kpis.ids.predictedOnTimeRate)}
                subValue={
                  kpis.ids.actualOnTimeRate
                    ? `Actual: ${formatPercent(kpis.ids.actualOnTimeRate)}`
                    : undefined
                }
              />
              <KPICard
                label="Predicted Deadhead"
                value={`${formatNumber(kpis.ids.predictedDeadheadMiles)} mi`}
                subValue={
                  kpis.ids.actualDeadheadMiles
                    ? `Actual: ${formatNumber(kpis.ids.actualDeadheadMiles)} mi`
                    : undefined
                }
              />
              <KPICard
                label="Predicted Pay"
                value={formatCurrency(kpis.ids.predictedTotalPay)}
                subValue={
                  kpis.ids.actualTotalPay
                    ? `Actual: ${formatCurrency(kpis.ids.actualTotalPay)}`
                    : undefined
                }
              />
            </div>

            {/* IDS Comparison */}
            {kpis.ids.comparison && (
              <div className="bg-purple-50 rounded-xl p-4">
                <h3 className="font-medium text-purple-900 mb-2">IDS Value (Predicted vs Actual)</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-purple-600">On-Time Improvement:</span>
                    <span className="ml-2 font-medium text-purple-900">
                      +{kpis.ids.comparison.onTimeDelta}%
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-600">Deadhead Savings:</span>
                    <span className="ml-2 font-medium text-purple-900">
                      {kpis.ids.comparison.deadheadDelta} miles
                    </span>
                  </div>
                  <div>
                    <span className="text-purple-600">Pay Savings:</span>
                    <span className="ml-2 font-medium text-purple-900">
                      {formatCurrency(kpis.ids.comparison.payDelta)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* Audit Trail */}
        {audit && (
          <section className="print:break-inside-avoid">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Audit Trail</h2>
            <div className="bg-slate-50 rounded-xl p-4 text-sm">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <span className="text-slate-500">Generated:</span>
                  <span className="ml-2 text-slate-900">
                    {new Date(audit.generatedAt).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Data Sources:</span>
                  <span className="ml-2 text-slate-900">{audit.dataSources.join(", ")}</span>
                </div>
              </div>
              <div className="mb-3">
                <span className="text-slate-500">Row Counts:</span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {Object.entries(audit.rowCounts).map(([key, count]) => (
                    <Pill key={key} tone="slate">
                      {key}: {count}
                    </Pill>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Calculation Notes:</span>
                <ul className="mt-1 list-disc list-inside text-slate-600">
                  {audit.calculationNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* Narrative Section */}
        <section className="print:hidden">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-900">AI Narrative</h2>
            <div className="flex items-center gap-3">
              {/* LLM Status */}
              <div className="flex items-center gap-2 text-sm">
                <span
                  className={`w-2 h-2 rounded-full ${
                    llmStatus?.available ? "bg-green-500" : "bg-amber-500"
                  }`}
                />
                <span className="text-slate-500">
                  {llmStatus?.available ? "LLM Ready" : "Using Template"}
                </span>
              </div>
              {/* Style Toggle */}
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setNarrativeStyle("INTERNAL")}
                  className={`px-3 py-1.5 text-sm ${
                    narrativeStyle === "INTERNAL"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Internal
                </button>
                <button
                  onClick={() => setNarrativeStyle("CLIENT")}
                  className={`px-3 py-1.5 text-sm ${
                    narrativeStyle === "CLIENT"
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  Client
                </button>
              </div>
              {/* Generate Button */}
              <button
                onClick={handleGenerateNarrative}
                disabled={generateNarrativeMutation.isPending}
                className="px-4 py-2 rounded-lg bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 disabled:opacity-50"
              >
                {generateNarrativeMutation.isPending ? "Generating..." : "Generate Narrative"}
              </button>
            </div>
          </div>

          {/* Narrative Output Panel */}
          {showNarrativePanel && currentNarrative && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50">
                <span className="font-medium text-slate-700">Draft Narrative</span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopyNarrative}
                    className="px-3 py-1 rounded border text-sm text-slate-600 hover:bg-slate-100"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setShowNarrativePanel(false)}
                    className="px-3 py-1 rounded border text-sm text-slate-600 hover:bg-slate-100"
                  >
                    Close
                  </button>
                </div>
              </div>
              <div className="p-4 prose prose-slate max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-slate-700">
                  {currentNarrative}
                </pre>
              </div>
            </div>
          )}

          {/* Previous Narratives */}
          {narratives && narratives.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-slate-500 mb-2">Previous Narratives</h3>
              <div className="space-y-2">
                {narratives.map((narrative) => (
                  <div
                    key={narrative.id}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      <Pill tone={narrative.style === "INTERNAL" ? "purple" : "blue"}>
                        {narrative.style}
                      </Pill>
                      <Pill tone={narrative.status === "success" ? "green" : "red"}>
                        {narrative.status}
                      </Pill>
                      <span className="text-sm text-slate-500">
                        {narrative.modelId} • {narrative.promptVersion}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-500">
                        {new Date(narrative.createdAt).toLocaleString()}
                      </span>
                      {narrative.outputMarkdown && (
                        <button
                          onClick={() => {
                            setCurrentNarrative(narrative.outputMarkdown || null);
                            setShowNarrativePanel(true);
                          }}
                          className="px-2 py-1 rounded border text-xs text-slate-600 hover:bg-slate-50"
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Artifacts */}
        {artifacts && artifacts.length > 0 && (
          <section className="print:hidden">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Artifacts</h2>
            <div className="bg-white rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      File
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Size
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Created
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {artifacts.map((artifact) => (
                    <tr key={artifact.id}>
                      <td className="px-4 py-3 font-medium text-slate-900">{artifact.fileName}</td>
                      <td className="px-4 py-3">
                        <Pill tone="blue">{artifact.artifactType}</Pill>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {artifact.fileSize ? `${Math.round(artifact.fileSize / 1024)} KB` : "-"}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(artifact.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
