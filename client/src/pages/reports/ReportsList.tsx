// Reports List Page - OC-REPORT-0
// Browse report templates and view recent runs

import React, { useState } from "react";
import { useLocation } from "wouter";
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

const categoryColors: Record<string, "slate" | "green" | "amber" | "red" | "purple" | "blue" | "orange"> = {
  OPERATIONS: "orange",
  PAYROLL: "green",
  BILLING: "blue",
  IDS: "purple",
  COMPLIANCE: "red",
};

export default function ReportsList() {
  const [, setLocation] = useLocation();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showNewReportModal, setShowNewReportModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  });

  const { data: templates, isLoading: templatesLoading } = trpc.reports.getTemplates.useQuery(
    selectedCategory ? { category: selectedCategory } : undefined
  );
  const { data: recentRuns, isLoading: runsLoading } = trpc.reports.getReportRuns.useQuery({ limit: 10 });

  const generateMutation = trpc.reports.generateReport.useMutation({
    onSuccess: (run) => {
      setShowNewReportModal(false);
      setLocation(`/reports/runs/${run.id}`);
    },
  });

  const handleGenerateReport = () => {
    if (!selectedTemplate) return;
    generateMutation.mutate({
      templateId: selectedTemplate,
      filters: { dateRange },
    });
  };

  const categories = ["OPERATIONS", "PAYROLL", "BILLING", "IDS", "COMPLIANCE"];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate and view operational reports • KPIs, payroll, IDS analysis
          </p>
        </div>
        <button
          onClick={() => setShowNewReportModal(true)}
          className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600"
        >
          + New Report
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedCategory(null)}
          className={clsx(
            "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
            !selectedCategory
              ? "bg-slate-900 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={clsx(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              selectedCategory === cat
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {cat.charAt(0) + cat.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Report Templates</h2>
        {templatesLoading ? (
          <div className="text-slate-500">Loading templates...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates?.map((template) => (
              <div
                key={template.id}
                className="bg-white rounded-xl border p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setShowNewReportModal(true);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-slate-900">{template.name}</h3>
                  <Pill tone={categoryColors[template.category] || "slate"}>
                    {template.category}
                  </Pill>
                </div>
                <p className="text-sm text-slate-500 mb-3">{template.description}</p>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  {template.isBuiltIn && <span>Built-in</span>}
                  <span>•</span>
                  <span>{(template.sectionsJson as any)?.sections?.length || 0} sections</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Runs */}
      <div>
        <h2 className="text-lg font-semibold text-slate-900 mb-3">Recent Reports</h2>
        {runsLoading ? (
          <div className="text-slate-500">Loading recent reports...</div>
        ) : recentRuns?.length === 0 ? (
          <div className="bg-slate-50 rounded-xl p-8 text-center text-slate-500">
            No reports generated yet. Click "New Report" to create one.
          </div>
        ) : (
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Report
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Date Range
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                    Generated
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {recentRuns?.map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-medium text-slate-900">
                        {run.templateName || `Template #${run.templateId}`}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {run.filtersJson.dateRange.start} to {run.filtersJson.dateRange.end}
                    </td>
                    <td className="px-4 py-3">
                      <Pill
                        tone={
                          run.status === "COMPLETED"
                            ? "green"
                            : run.status === "FAILED"
                            ? "red"
                            : "amber"
                        }
                      >
                        {run.status}
                      </Pill>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(run.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setLocation(`/reports/runs/${run.id}`)}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Report Modal */}
      {showNewReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Generate New Report</h2>

            {/* Template Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Report Template
              </label>
              <select
                value={selectedTemplate || ""}
                onChange={(e) => setSelectedTemplate(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select a template...</option>
                {templates?.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowNewReportModal(false);
                  setSelectedTemplate(null);
                }}
                className="px-4 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateReport}
                disabled={!selectedTemplate || generateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
              >
                {generateMutation.isPending ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
