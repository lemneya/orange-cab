/**
 * Manifest Import Page
 * 
 * Upload and import broker manifests (pre-dispatch trips) from various formats:
 * - Modivcare PDF (Sahrawi/Metrix)
 * - MTM CSV
 * - Access2Care CSV
 * 
 * PHI-safe: no patient names, phones, DOB, or full addresses stored.
 */

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

type OpcoId = "SAHRAWI" | "METRIX";
type BrokerId = "MODIVCARE" | "MTM" | "ACCESS2CARE";
type BrokerAccountId = "MODIVCARE_SAHRAWI" | "MODIVCARE_METRIX" | "MTM_MAIN" | "A2C_MAIN";
type ManifestFormat = "modivcare_pdf_sahrawi" | "modivcare_pdf_metrix" | "mtm_csv" | "a2c_csv";

const FORMAT_INFO: Record<ManifestFormat, { name: string; fileType: string }> = {
  modivcare_pdf_sahrawi: { name: "Modivcare PDF (Sahrawi)", fileType: "PDF" },
  modivcare_pdf_metrix: { name: "Modivcare PDF (Metrix)", fileType: "PDF" },
  mtm_csv: { name: "MTM CSV", fileType: "CSV" },
  a2c_csv: { name: "Access2Care CSV", fileType: "CSV" },
};

export default function ManifestImport() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<ImportStep>("upload");
  const [fileContent, setFileContent] = useState<string>("");
  const [fileName, setFileName] = useState<string>("");
  const [preview, setPreview] = useState<any>(null);
  const [importResult, setImportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Partition selection (required before import)
  const [selectedOpcoId, setSelectedOpcoId] = useState<number | null>(null);
  const [selectedBrokerAccountId, setSelectedBrokerAccountId] = useState<number | null>(null);

  // Fetch OpCos and Broker Accounts from Admin tables
  const { data: opcos } = trpc.admin.getOpcos.useQuery();
  const { data: brokerAccounts } = trpc.admin.getBrokerAccounts.useQuery();

  // Filter broker accounts by selected OpCo
  const filteredBrokerAccounts = brokerAccounts?.filter(
    (a) => !selectedOpcoId || a.opcoId === selectedOpcoId
  );

  // Get selected entities
  const selectedOpco = opcos?.find((o) => o.id === selectedOpcoId);
  const selectedBrokerAccount = brokerAccounts?.find((a) => a.id === selectedBrokerAccountId);

  // Determine partition values
  const getPartitionValues = () => {
    if (!selectedOpco || !selectedBrokerAccount) return null;
    
    const opcoCode = selectedOpco.code as OpcoId;
    const broker = brokerAccounts?.find((a) => a.id === selectedBrokerAccountId);
    const brokerId = broker?.brokerId === 1 ? "MODIVCARE" : 
                     broker?.brokerId === 2 ? "MTM" : "ACCESS2CARE";
    
    // Map broker account to code
    const brokerAccountCode = selectedBrokerAccount.code as BrokerAccountId;
    
    return {
      opcoId: opcoCode,
      brokerId: brokerId as BrokerId,
      brokerAccountId: brokerAccountCode,
    };
  };

  const previewMutation = trpc.ids.previewManifest.useMutation();
  const importMutation = trpc.ids.importManifest.useMutation();

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setFileContent(content);
    };
    reader.readAsText(file);
  }, []);

  const handlePreview = async () => {
    const partition = getPartitionValues();
    if (!partition) {
      setError("Please select Company and Funding Account first");
      return;
    }
    if (!fileContent) {
      setError("Please upload a file first");
      return;
    }

    setError(null);
    try {
      const result = await previewMutation.mutateAsync({
        content: fileContent,
        fileName,
        ...partition,
      });
      setPreview(result);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Failed to preview file");
    }
  };

  const handleImport = async () => {
    const partition = getPartitionValues();
    if (!fileContent || !partition) return;

    setError(null);
    setStep("importing");
    try {
      const result = await importMutation.mutateAsync({
        content: fileContent,
        fileName,
        ...partition,
      });
      setImportResult(result);
      setStep("complete");
    } catch (err: any) {
      setError(err.message || "Failed to import file");
      setStep("preview");
    }
  };

  const handleReset = () => {
    setStep("upload");
    setFileContent("");
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
          <h1 className="text-2xl font-bold text-slate-900">Import Broker Manifest</h1>
          <p className="mt-1 text-sm text-slate-500">
            Upload pre-dispatch trips from Modivcare, MTM, or Access2Care • PHI fields are automatically stripped
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
      <div className="flex items-center gap-2">
        {["Upload", "Preview", "Importing...", "Complete"].map((label, i) => {
          const stepNum = i + 1;
          const stepKey = ["upload", "preview", "importing", "complete"][i];
          const isActive = step === stepKey;
          const isPast = ["upload", "preview", "importing", "complete"].indexOf(step) > i;
          return (
            <React.Fragment key={label}>
              <div className="flex items-center gap-2">
                <div
                  className={clsx(
                    "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
                    isActive ? "bg-orange-500 text-white" : isPast ? "bg-green-500 text-white" : "bg-slate-200 text-slate-500"
                  )}
                >
                  {isPast ? "✓" : stepNum}
                </div>
                <span className={clsx("text-sm", isActive ? "text-orange-600 font-medium" : "text-slate-500")}>
                  {label}
                </span>
              </div>
              {i < 3 && <div className="flex-1 h-px bg-slate-200" />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === "upload" && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Upload Broker Manifest</h2>
            
            {/* Partition Selection */}
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 mb-6">
              <p className="text-sm font-medium text-orange-800 mb-3">
                Step 1: Select Company & Funding Account (Required)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company (OpCo) *</label>
                  <select
                    value={selectedOpcoId || ""}
                    onChange={(e) => {
                      setSelectedOpcoId(e.target.value ? Number(e.target.value) : null);
                      setSelectedBrokerAccountId(null);
                    }}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Select Company...</option>
                    {opcos?.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name} ({o.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Funding Account *</label>
                  <select
                    value={selectedBrokerAccountId || ""}
                    onChange={(e) => setSelectedBrokerAccountId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                    disabled={!selectedOpcoId}
                  >
                    <option value="">Select Funding Account...</option>
                    {filteredBrokerAccounts?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-xs text-orange-600 mt-2">
                This ensures data is partitioned correctly and prevents collisions between different broker manifests.
              </p>
            </div>

            {/* File Upload */}
            <div className="mb-6">
              <p className="text-sm font-medium text-slate-700 mb-3">Step 2: Upload Manifest File</p>
              <label className="block border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-orange-400 transition-colors">
                <input
                  type="file"
                  accept=".csv,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {fileName ? (
                  <div>
                    <p className="text-sm font-medium text-slate-900">{fileName}</p>
                    <p className="text-xs text-slate-500 mt-1">Click to change file</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-orange-600 font-medium">Click to upload or drag and drop</p>
                    <p className="text-xs text-slate-500 mt-1">CSV or PDF files • Max 50MB</p>
                  </div>
                )}
              </label>
            </div>

            {/* Supported Formats */}
            <div className="p-4 rounded-lg bg-slate-50 border mb-6">
              <p className="text-sm font-medium text-slate-700 mb-2">Supported Formats</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Pill tone="purple">PDF</Pill>
                  <span className="text-slate-600">Modivcare Manifest (Sahrawi/Metrix)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone="blue">CSV</Pill>
                  <span className="text-slate-600">MTM Export</span>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone="blue">CSV</Pill>
                  <span className="text-slate-600">Access2Care Export</span>
                </div>
              </div>
            </div>

            {/* PHI Warning */}
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm font-medium text-amber-800 flex items-center gap-2">
                <span>⚠️</span> PHI Protection
              </p>
              <p className="text-xs text-amber-700 mt-1">
                The following fields will be <strong>automatically stripped</strong> and never stored: 
                patient names, phone numbers, dates of birth, full addresses, SSN, and email addresses. 
                Only trip IDs, appointment times, GPS coordinates, and mobility types are retained.
              </p>
            </div>

            <button
              onClick={handlePreview}
              disabled={!fileContent || !selectedOpcoId || !selectedBrokerAccountId || previewMutation.isPending}
              className={clsx(
                "mt-6 w-full py-3 rounded-lg text-sm font-medium transition-colors",
                fileContent && selectedOpcoId && selectedBrokerAccountId
                  ? "bg-orange-500 text-white hover:bg-orange-600"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              )}
            >
              {previewMutation.isPending ? "Analyzing..." : "Preview Import"}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === "preview" && preview && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Import Preview</h2>

            {/* Partition Info */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 mb-6">
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-blue-600">Company:</span>{" "}
                  <strong className="text-blue-800">{selectedOpco?.name}</strong>
                </div>
                <div>
                  <span className="text-blue-600">Funding Account:</span>{" "}
                  <strong className="text-blue-800">{selectedBrokerAccount?.name}</strong>
                </div>
                <div>
                  <span className="text-blue-600">Format:</span>{" "}
                  <Pill tone="purple">{FORMAT_INFO[preview.format as ManifestFormat]?.name || preview.format}</Pill>
                </div>
              </div>
            </div>

            {/* Duplicate Warning */}
            {preview.isDuplicate && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-6">
                <p className="text-sm font-medium text-amber-800">⚠️ Duplicate File Detected</p>
                <p className="text-xs text-amber-700 mt-1">
                  This file has already been imported under this partition. Re-importing will be blocked.
                </p>
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-50 border">
                <p className="text-xs text-slate-500">Total Rows</p>
                <p className="text-2xl font-bold text-slate-900">{preview.totalRows}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-xs text-green-600">Valid Trips</p>
                <p className="text-2xl font-bold text-green-700">{preview.validRows}</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-600">Cancelled</p>
                <p className="text-2xl font-bold text-amber-700">{preview.cancelledRows}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border">
                <p className="text-xs text-slate-500">Date Range</p>
                <p className="text-sm font-medium text-slate-900">
                  {preview.serviceDateRange?.from || "N/A"} → {preview.serviceDateRange?.to || "N/A"}
                </p>
              </div>
            </div>

            {/* LOS Breakdown */}
            <div className="p-4 rounded-lg bg-slate-50 border mb-6">
              <p className="text-sm font-medium text-slate-700 mb-2">Level of Service Breakdown</p>
              <div className="flex items-center gap-4">
                {Object.entries(preview.losCounts || {}).map(([los, count]) => (
                  <div key={los} className="flex items-center gap-2">
                    <Pill tone={los === "WC" ? "purple" : los === "STR" ? "red" : "green"}>
                      {los}
                    </Pill>
                    <span className="text-sm font-medium text-slate-700">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Funding Sources */}
            {preview.fundingSources?.length > 0 && (
              <div className="p-4 rounded-lg bg-slate-50 border mb-6">
                <p className="text-sm font-medium text-slate-700 mb-2">Funding Sources Found</p>
                <div className="flex flex-wrap gap-2">
                  {preview.fundingSources.map((source: string) => (
                    <Pill key={source} tone="blue">{source}</Pill>
                  ))}
                </div>
              </div>
            )}

            {/* Sample Trips */}
            {preview.sampleTrips?.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium text-slate-700 mb-2">Sample Trips (First 5)</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-slate-100">
                        <th className="px-3 py-2 text-left">Trip ID</th>
                        <th className="px-3 py-2 text-left">Date</th>
                        <th className="px-3 py-2 text-left">Type</th>
                        <th className="px-3 py-2 text-left">Appt Time</th>
                        <th className="px-3 py-2 text-left">Pickup City</th>
                        <th className="px-3 py-2 text-left">Dropoff City</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sampleTrips.map((trip: any, i: number) => (
                        <tr key={i} className="border-b">
                          <td className="px-3 py-2 font-mono">{trip.externalTripId}</td>
                          <td className="px-3 py-2">{trip.serviceDate}</td>
                          <td className="px-3 py-2">
                            <Pill tone={trip.mobilityType === "WC" ? "purple" : trip.mobilityType === "STR" ? "red" : "green"}>
                              {trip.mobilityType}
                            </Pill>
                          </td>
                          <td className="px-3 py-2">{trip.appointmentTime || "-"}</td>
                          <td className="px-3 py-2">{trip.pickupCity || "-"}</td>
                          <td className="px-3 py-2">{trip.dropoffCity || "-"}</td>
                          <td className="px-3 py-2">
                            {trip.isCancelled ? (
                              <Pill tone="red">Cancelled</Pill>
                            ) : (
                              <Pill tone="green">Active</Pill>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Errors */}
            {preview.errors?.length > 0 && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-6">
                <p className="text-sm font-medium text-red-800">Errors</p>
                <ul className="mt-2 text-xs text-red-700 list-disc list-inside">
                  {preview.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-lg text-sm font-medium border text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={preview.isDuplicate || importMutation.isPending}
                className={clsx(
                  "flex-1 py-3 rounded-lg text-sm font-medium transition-colors",
                  preview.isDuplicate
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-orange-500 text-white hover:bg-orange-600"
                )}
              >
                {importMutation.isPending ? "Importing..." : `Import ${preview.validRows} Trips`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === "importing" && (
        <div className="bg-white rounded-xl border p-6 text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900">Importing Manifest...</h2>
          <p className="text-sm text-slate-500 mt-1">This may take a moment for large files.</p>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === "complete" && importResult && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">✓</span>
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Import Complete!</h2>
              <p className="text-sm text-slate-500 mt-1">
                Manifest has been imported successfully.
              </p>
            </div>

            {/* "Nothing Dropped" Proof */}
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 mb-6">
              <p className="text-sm font-medium text-green-800 mb-2">✓ "Nothing Dropped" Proof</p>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-green-600">Expected Rows:</span>{" "}
                  <strong className="text-green-800">{importResult.expectedRows}</strong>
                </div>
                <div>
                  <span className="text-green-600">Accounted Rows:</span>{" "}
                  <strong className="text-green-800">{importResult.accountedRows}</strong>
                </div>
                <div>
                  <span className="text-green-600">Complete:</span>{" "}
                  <strong className="text-green-800">{importResult.isComplete ? "Yes" : "No"}</strong>
                </div>
              </div>
            </div>

            {/* Import Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-lg bg-slate-50 border">
                <p className="text-xs text-slate-500">Import ID</p>
                <p className="text-xl font-bold text-slate-900">#{importResult.importId}</p>
              </div>
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <p className="text-xs text-green-600">Imported</p>
                <p className="text-xl font-bold text-green-700">{importResult.importedRows}</p>
              </div>
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                <p className="text-xs text-amber-600">Cancelled</p>
                <p className="text-xl font-bold text-amber-700">{importResult.cancelledRows}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-50 border">
                <p className="text-xs text-slate-500">Skipped</p>
                <p className="text-xl font-bold text-slate-700">{importResult.skippedRows}</p>
              </div>
            </div>

            {/* LOS Breakdown */}
            <div className="p-4 rounded-lg bg-slate-50 border mb-6">
              <p className="text-sm font-medium text-slate-700 mb-2">Level of Service Breakdown</p>
              <div className="flex items-center gap-4">
                {Object.entries(importResult.losCounts || {}).map(([los, count]) => (
                  <div key={los} className="flex items-center gap-2">
                    <Pill tone={los === "WC" ? "purple" : los === "STR" ? "red" : "green"}>
                      {los}
                    </Pill>
                    <span className="text-sm font-medium text-slate-700">{count as number}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Errors */}
            {importResult.errors?.length > 0 && (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 mb-6">
                <p className="text-sm font-medium text-amber-800">Notes</p>
                <ul className="mt-2 text-xs text-amber-700 list-disc list-inside">
                  {importResult.errors.map((err: string, i: number) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 py-3 rounded-lg text-sm font-medium border text-slate-700 hover:bg-slate-50"
              >
                Import Another
              </button>
              <button
                onClick={() => setLocation("/ids/shadow-runs/new")}
                className="flex-1 py-3 rounded-lg text-sm font-medium bg-orange-500 text-white hover:bg-orange-600"
              >
                Create Shadow Run
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recent Imports */}
      <RecentImports />
    </div>
  );
}

function RecentImports() {
  const { data: imports } = trpc.ids.getManifestImports.useQuery({});

  if (!imports || imports.length === 0) return null;

  return (
    <div className="bg-white rounded-xl border p-6">
      <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Manifest Imports</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">File</th>
              <th className="px-3 py-2 text-left">Format</th>
              <th className="px-3 py-2 text-left">Partition</th>
              <th className="px-3 py-2 text-left">Date Range</th>
              <th className="px-3 py-2 text-right">Trips</th>
              <th className="px-3 py-2 text-left">LOS</th>
              <th className="px-3 py-2 text-left">Imported</th>
            </tr>
          </thead>
          <tbody>
            {imports.slice(0, 10).map((imp) => (
              <tr key={imp.id} className="border-b hover:bg-slate-50">
                <td className="px-3 py-2 font-mono text-xs">#{imp.id}</td>
                <td className="px-3 py-2 text-xs truncate max-w-[150px]" title={imp.fileName}>
                  {imp.fileName}
                </td>
                <td className="px-3 py-2">
                  <Pill tone="purple">{FORMAT_INFO[imp.format as ManifestFormat]?.fileType || imp.format}</Pill>
                </td>
                <td className="px-3 py-2 text-xs">
                  {imp.opcoId} / {imp.brokerAccountId}
                </td>
                <td className="px-3 py-2 text-xs">
                  {imp.serviceDateFrom} → {imp.serviceDateTo}
                </td>
                <td className="px-3 py-2 text-right font-medium">{imp.importedRows}</td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {Object.entries(imp.losCounts || {}).map(([los, count]) => (
                      <span key={los} className="text-xs">
                        {los}:{count as number}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-3 py-2 text-xs text-slate-500">
                  {new Date(imp.importedAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
