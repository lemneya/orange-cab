// ActualImport.tsx
// Import actual completed trips from MediRoute CSV exports
// PHI stripping: no patient names, phones, DOB, or full addresses stored

import React, { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "../../lib/trpc";

type ImportStep = "upload" | "preview" | "importing" | "complete";

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

export default function ActualImport() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<ImportStep>("upload");
  const [csvContent, setCsvContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Partition selection - required before import
  const [selectedOpcoId, setSelectedOpcoId] = useState<number | null>(null);
  const [selectedBrokerAccountId, setSelectedBrokerAccountId] = useState<number | null>(null);

  // Fetch OpCos and Broker Accounts from Admin tables (not hardcoded)
  const { data: opcos } = trpc.admin.getOpcos.useQuery();
  const { data: brokerAccounts } = trpc.admin.getBrokerAccounts.useQuery();

  // Filter broker accounts by selected OpCo
  const filteredBrokerAccounts = brokerAccounts?.filter(
    (a) => !selectedOpcoId || a.opcoId === selectedOpcoId
  );

  const previewMutation = trpc.ids.previewActualCSV.useMutation();
  const importMutation = trpc.ids.importActualCSV.useMutation();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvContent(content);
    };
    reader.readAsText(file);
  }, []);

  const handlePreview = async () => {
    if (!selectedOpcoId || !selectedBrokerAccountId) {
      setError("Please select Company and Funding Account first");
      return;
    }
    if (!csvContent) {
      setError("Please upload a CSV file first");
      return;
    }

    setError(null);
    try {
      const result = await previewMutation.mutateAsync({ csvContent });
      setPreview(result);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to preview CSV");
    }
  };

  const handleImport = async () => {
    if (!csvContent || !selectedOpcoId || !selectedBrokerAccountId) return;

    setError(null);
    setStep("importing");
    try {
      // Get partition values from selected entities
      const selectedOpco = opcos?.find((o) => o.id === selectedOpcoId);
      const selectedBrokerAccount = brokerAccounts?.find((a) => a.id === selectedBrokerAccountId);
      
      if (!selectedOpco || !selectedBrokerAccount) {
        setError("Invalid partition selection");
        setStep("preview");
        return;
      }
      
      const opcoCode = selectedOpco.code as "SAHRAWI" | "METRIX";
      const brokerAccountCode = selectedBrokerAccount.code as "MODIVCARE_SAHRAWI" | "MODIVCARE_METRIX" | "MTM_MAIN" | "A2C_MAIN";
      const brokerId = selectedBrokerAccount.brokerId === 1 ? "MODIVCARE" : 
                       selectedBrokerAccount.brokerId === 2 ? "MTM" : "ACCESS2CARE";
      
      const result = await importMutation.mutateAsync({ 
        csvContent, 
        fileName,
        opcoId: opcoCode,
        brokerId: brokerId as "MODIVCARE" | "MTM" | "ACCESS2CARE",
        brokerAccountId: brokerAccountCode,
      });
      setImportResult(result);
      setStep("complete");
    } catch (err: any) {
      setError(err.message || "Failed to import CSV");
      setStep("preview");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setCsvContent("");
    setFileName("");
    setPreview(null);
    setImportResult(null);
    setError(null);
    setSelectedOpcoId(null);
    setSelectedBrokerAccountId(null);
  };

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Import Actual Dispatch Data</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload completed trips CSV from MediRoute • PHI fields are automatically stripped
          </p>
        </div>
        <button
          onClick={() => setLocation("/ids/shadow-runs")}
          className="px-4 py-2 rounded-lg border text-sm text-slate-700 hover:bg-slate-50"
        >
          Back to Shadow Runs
        </button>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {["upload", "preview", "importing", "complete"].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={clsx(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                step === s ? "bg-orange-500 text-white" :
                ["preview", "importing", "complete"].indexOf(step) > i - 1 ? "bg-green-500 text-white" :
                "bg-slate-200 text-slate-500"
              )}
            >
              {i + 1}
            </div>
            <span className={clsx(
              "text-sm",
              step === s ? "text-orange-600 font-medium" : "text-slate-500"
            )}>
              {s === "upload" ? "Upload CSV" :
               s === "preview" ? "Review & Confirm" :
               s === "importing" ? "Importing..." :
               "Complete"}
            </span>
            {i < 3 && <div className="w-8 h-px bg-slate-200" />}
          </div>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="rounded-xl border bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Completed Trips CSV</h2>
          
          {/* Required: OpCo and Broker Account Selection */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-3">Step 1: Select Company & Funding Account (Required)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Company (OpCo) *</label>
                <select
                  value={selectedOpcoId || ""}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedOpcoId(val);
                    setSelectedBrokerAccountId(null); // Reset broker account when OpCo changes
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select Company...</option>
                  {opcos?.map((opco) => (
                    <option key={opco.id} value={opco.id}>
                      {opco.name} ({opco.code})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Funding Account *</label>
                <select
                  value={selectedBrokerAccountId || ""}
                  onChange={(e) => setSelectedBrokerAccountId(e.target.value ? parseInt(e.target.value) : null)}
                  disabled={!selectedOpcoId}
                  className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
                >
                  <option value="">Select Funding Account...</option>
                  {filteredBrokerAccounts?.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <p className="mt-2 text-xs text-blue-600">
              This ensures data is partitioned correctly and prevents collisions between different broker manifests.
            </p>
          </div>

          {/* Step 2: File Upload */}
          <h3 className="font-medium text-slate-700 mb-3">Step 2: Upload CSV File</h3>
          <div className="border-2 border-dashed border-slate-200 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <span className="text-orange-600 font-medium">Click to upload</span>
                <span className="text-slate-500"> or drag and drop</span>
              </div>
              <span className="text-xs text-slate-400">CSV files only • Max 50MB</span>
            </label>
          </div>

          {fileName && (
            <div className="mt-4 flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-slate-700">{fileName}</span>
              </div>
              <button
                onClick={handlePreview}
                disabled={previewMutation.isPending}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition disabled:opacity-50"
              >
                {previewMutation.isPending ? "Analyzing..." : "Preview Import"}
              </button>
            </div>
          )}

          {/* PHI Warning */}
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-amber-800">PHI Protection</h3>
                <p className="mt-1 text-sm text-amber-700">
                  The following fields will be <strong>automatically stripped</strong> and never stored:
                  patient names, phone numbers, dates of birth, full addresses, SSN, and email addresses.
                  Only trip IDs, driver names, vehicle units, GPS coordinates, and timestamps are retained.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && preview && (
        <div className="space-y-4">
          {/* Preview Summary */}
          <div className="rounded-xl border bg-white p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Import Preview</h2>
            
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{preview.totalRows}</div>
                <div className="text-xs text-slate-500">Total Rows</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{preview.columns.length}</div>
                <div className="text-xs text-slate-500">Columns</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">{preview.driverNames.length}</div>
                <div className="text-xs text-slate-500">Drivers</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg">
                <div className="text-2xl font-bold text-slate-900">
                  {preview.serviceDateRange ? `${preview.serviceDateRange.from} - ${preview.serviceDateRange.to}` : "N/A"}
                </div>
                <div className="text-xs text-slate-500">Date Range</div>
              </div>
            </div>

            {/* Ignored Columns (not in allowlist) */}
            {preview.ignoredColumns && preview.ignoredColumns.length > 0 && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <h3 className="font-medium text-amber-800 mb-2">Columns Ignored (not in allowlist)</h3>
                <p className="text-sm text-amber-700 mb-2">
                  These columns are NOT in the approved allowlist and will be completely ignored.
                  This protects against new PHI columns added by vendors.
                </p>
                <div className="flex flex-wrap gap-2">
                  {preview.ignoredColumns.map((field: string) => (
                    <Pill key={field} tone="amber">{field}</Pill>
                  ))}
                </div>
              </div>
            )}

            {/* Allowed Columns (will be extracted) */}
            <div className="mb-6">
              <h3 className="font-medium text-slate-700 mb-2">Columns to Extract (from allowlist)</h3>
              <div className="flex flex-wrap gap-2">
                {(preview.allowedColumns || preview.safeFieldsDetected || []).map((field: string) => (
                  <Pill key={field} tone="green">{field}</Pill>
                ))}
              </div>
            </div>

            {/* Sample Data */}
            <div>
              <h3 className="font-medium text-slate-700 mb-2">Sample Data (first 5 rows)</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      {preview.columns.slice(0, 10).map((col: string) => (
                        <th key={col} className="px-3 py-2 text-left text-xs font-medium text-slate-500">
                          {col}
                        </th>
                      ))}
                      {preview.columns.length > 10 && (
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-400">
                          +{preview.columns.length - 10} more
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.sampleRows.map((row: Record<string, string>, i: number) => (
                      <tr key={i} className="border-t">
                        {preview.columns.slice(0, 10).map((col: string) => (
                          <td key={col} className={clsx(
                            "px-3 py-2",
                            row[col] === "[PHI STRIPPED]" ? "text-red-500 italic" : "text-slate-700"
                          )}>
                            {row[col] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              Import {preview.totalRows} Rows
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === "importing" && (
        <div className="rounded-xl border bg-white p-12 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto" />
          <h2 className="mt-4 text-lg font-semibold text-slate-900">Importing...</h2>
          <p className="mt-2 text-sm text-slate-500">
            Processing rows and stripping PHI fields. This may take a moment.
          </p>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && importResult && (
        <div className="space-y-4">
          <div className="rounded-xl border bg-white p-6">
            <div className="flex items-center gap-3 mb-6">
              {importResult.success ? (
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {importResult.success ? "Import Complete" : "Import Completed with Warnings"}
                </h2>
                <p className="text-sm text-slate-500">Import ID: #{importResult.importId}</p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-900">{importResult.totalRows}</div>
                <div className="text-xs text-slate-500">Total Rows</div>
              </div>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{importResult.importedRows}</div>
                <div className="text-xs text-slate-500">Imported</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-slate-600">{importResult.skippedRows}</div>
                <div className="text-xs text-slate-500">Skipped</div>
              </div>
              <div className="p-4 bg-red-50 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{importResult.errorRows}</div>
                <div className="text-xs text-slate-500">Errors</div>
              </div>
              <div className={clsx(
                "p-4 rounded-lg text-center",
                importResult.isComplete ? "bg-green-50" : "bg-amber-50"
              )}>
                <div className={clsx(
                  "text-2xl font-bold",
                  importResult.isComplete ? "text-green-600" : "text-amber-600"
                )}>
                  {importResult.isComplete ? "✓" : "!"}
                </div>
                <div className="text-xs text-slate-500">
                  {importResult.isComplete ? "Nothing Dropped" : "Check Audit"}
                </div>
              </div>
            </div>

            {/* "Nothing Dropped" Proof - CRITICAL AUDIT */}
            <div className={clsx(
              "p-4 rounded-lg mb-6",
              importResult.isComplete ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"
            )}>
              <h3 className={clsx(
                "font-medium mb-2",
                importResult.isComplete ? "text-green-800" : "text-red-800"
              )}>
                "Nothing Dropped" Audit Proof
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-3">
                <div className="text-center p-2 bg-white rounded">
                  <div className="text-lg font-bold text-slate-900">{importResult.expectedRows || importResult.totalRows}</div>
                  <div className="text-xs text-slate-500">expectedRows</div>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <div className="text-lg font-bold text-slate-900">{importResult.accountedRows}</div>
                  <div className="text-xs text-slate-500">accountedRows</div>
                </div>
                <div className="text-center p-2 bg-white rounded">
                  <div className={clsx(
                    "text-lg font-bold",
                    (importResult.missingRows?.length || 0) === 0 ? "text-green-600" : "text-red-600"
                  )}>
                    {importResult.missingRows?.length || 0}
                  </div>
                  <div className="text-xs text-slate-500">missingRows</div>
                </div>
              </div>
              <p className={clsx(
                "text-sm",
                importResult.isComplete ? "text-green-700" : "text-red-700"
              )}>
                {importResult.isComplete 
                  ? "✓ All rows accounted for: imported + skipped + errors = expected"
                  : `✗ AUDIT FAILURE: ${(importResult.missingRows?.length || 0)} rows not accounted for`}
              </p>
              {importResult.missingRows && importResult.missingRows.length > 0 && (
                <div className="mt-2 text-sm text-red-600">
                  Missing row numbers: {importResult.missingRows.slice(0, 20).join(", ")}
                  {importResult.missingRows.length > 20 && ` +${importResult.missingRows.length - 20} more`}
                </div>
              )}
            </div>

            {/* Columns Ignored (not in allowlist) */}
            {importResult.ignoredColumns && importResult.ignoredColumns.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-amber-700 mb-2">Columns Ignored (not in allowlist)</h3>
                <p className="text-sm text-amber-600 mb-2">
                  These columns were NOT extracted because they are not in the approved allowlist.
                </p>
                <div className="flex flex-wrap gap-2">
                  {importResult.ignoredColumns.map((field: string) => (
                    <Pill key={field} tone="amber">{field}</Pill>
                  ))}
                </div>
              </div>
            )}

            {/* Columns Extracted */}
            {importResult.extractedColumns && importResult.extractedColumns.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-green-700 mb-2">Columns Extracted (from allowlist)</h3>
                <div className="flex flex-wrap gap-2">
                  {importResult.extractedColumns.map((field: string) => (
                    <Pill key={field} tone="green">{field}</Pill>
                  ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {importResult.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-red-700 mb-2">Import Errors ({importResult.errors.length})</h3>
                <div className="max-h-40 overflow-y-auto bg-red-50 rounded-lg p-3">
                  {importResult.errors.slice(0, 20).map((err: { row: number; message: string }, i: number) => (
                    <div key={i} className="text-sm text-red-700">
                      Row {err.row}: {err.message}
                    </div>
                  ))}
                  {importResult.errors.length > 20 && (
                    <div className="text-sm text-red-500 mt-2">
                      +{importResult.errors.length - 20} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Warnings */}
            {importResult.warnings.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-amber-700 mb-2">Warnings</h3>
                <div className="bg-amber-50 rounded-lg p-3">
                  {importResult.warnings.map((warning: string, i: number) => (
                    <div key={i} className="text-sm text-amber-700">{warning}</div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 border rounded-lg text-slate-700 hover:bg-slate-50"
            >
              Import Another File
            </button>
            <button
              onClick={() => setLocation("/ids/shadow-runs")}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              View Shadow Runs
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
