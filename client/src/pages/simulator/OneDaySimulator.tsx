/**
 * OC-SIM-0: One-Day Proof Simulator
 * Route: /simulator/day
 * 
 * A sales agent can say: "Give me one day. I will show you exactly how much you can save."
 */

import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// ============================================
// TYPES
// ============================================

type StepStatus = "NOT_STARTED" | "READY" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

interface SimulationState {
  opcoId: string;
  opcoName: string;
  brokerAccountId: string;
  brokerAccountName: string;
  serviceDate: string;
  
  // Step statuses
  demandStep: StepStatus;
  shadowStep: StepStatus;
  actualStep: StepStatus;
  proofStep: StepStatus;
  
  // References
  manifestImportId?: string;
  shadowRunId?: string;
  actualImportId?: string;
  proofPackId?: string;
  
  // Data
  manifestPreview?: ManifestPreview;
  shadowSummary?: ShadowSummary;
  actualSummary?: ActualSummary;
  compareResults?: CompareResults;
}

interface ManifestPreview {
  totalRows: number;
  scheduledTrips: number;
  canceledTrips: number;
  willCallCount: number;
  wheelchairCount: number;
  missingTimeCount: number;
  batchChecksum: string;
}

interface ShadowSummary {
  predOnTimePct: number;
  predDeadheadMiles: number;
  predDriverPay: number;
  unassignedCount: number;
  vehicleSummary: VehicleSummary[];
}

interface VehicleSummary {
  vehicleId: string;
  driverName: string;
  trips: number;
  miles: number;
  predOnTime: number;
  deadhead: number;
  pay: number;
  flags: string[];
}

interface ActualSummary {
  completedTrips: number;
  canceledTrips: number;
  noShowTrips: number;
  latePickups: number;
  phiStripped: boolean;
  nothingDropped: boolean;
  qualityChecks: QualityCheck[];
}

interface QualityCheck {
  name: string;
  passed: boolean;
  required: boolean;
}

interface CompareResults {
  predOnTimePct: number;
  actualOnTimePct: number;
  onTimeDelta: number;
  predDeadheadMiles: number;
  actualDeadheadMiles: number;
  deadheadDelta: number;
  predDriverPay: number;
  actualDriverPay: number;
  driverPayDelta: number;
  estimatedSavingsUsd: number;
  savingsBreakdown: { label: string; amount: number }[];
  topCauses: { cause: string; count: number; severity: string; impact: string }[];
  driverDeltas: DriverDelta[];
}

interface DriverDelta {
  driverName: string;
  predTrips: number;
  actualTrips: number;
  tripsDelta: number;
  predMiles: number;
  actualMiles: number;
  milesDelta: number;
  predPay: number;
  actualPay: number;
  payDelta: number;
  latePickupsDelta: number;
  flags: string[];
}

// ============================================
// COMPONENT
// ============================================

export default function OneDaySimulator() {
  const [, navigate] = useLocation();
  
  // Context selection
  const [opcoId, setOpcoId] = useState("");
  const [brokerAccountId, setBrokerAccountId] = useState("");
  const [serviceDate, setServiceDate] = useState("");
  
  // Simulation state
  const [simState, setSimState] = useState<SimulationState | null>(null);
  const [activeSection, setActiveSection] = useState<number>(1);
  const [isRunning, setIsRunning] = useState(false);
  
  // Toggles
  const [useLocks, setUseLocks] = useState(true);
  const [allowOptions, setAllowOptions] = useState(false);
  const [narrativeStyle, setNarrativeStyle] = useState<"INTERNAL" | "CLIENT">("CLIENT");
  
  // Fetch admin data
  const { data: opcos } = trpc.admin.getOpcos.useQuery({});
  const { data: brokerAccounts } = trpc.admin.getBrokerAccounts.useQuery({});
  
  const filteredAccounts = brokerAccounts?.filter(
    (a: any) => !opcoId || a.opcoId === opcoId
  ) || [];
  
  const canRun = opcoId && brokerAccountId && serviceDate;
  
  // ============================================
  // HANDLERS
  // ============================================
  
  const handleReset = useCallback(() => {
    setSimState(null);
    setActiveSection(1);
    setIsRunning(false);
  }, []);
  
  const handleLoadExample = useCallback(() => {
    // Load synthetic demo data
    setOpcoId("SAHRAWI");
    setBrokerAccountId("MODIVCARE_SAHRAWI");
    setServiceDate("2026-01-09");
    
    // Create demo state
    setSimState({
      opcoId: "SAHRAWI",
      opcoName: "Sahrawi",
      brokerAccountId: "MODIVCARE_SAHRAWI",
      brokerAccountName: "Modivcare - Sahrawi",
      serviceDate: "2026-01-09",
      demandStep: "COMPLETED",
      shadowStep: "COMPLETED",
      actualStep: "COMPLETED",
      proofStep: "READY",
      manifestImportId: "MI-001",
      shadowRunId: "SR-001",
      actualImportId: "AI-001",
      manifestPreview: {
        totalRows: 156,
        scheduledTrips: 148,
        canceledTrips: 8,
        willCallCount: 12,
        wheelchairCount: 23,
        missingTimeCount: 2,
        batchChecksum: "abc123def456",
      },
      shadowSummary: {
        predOnTimePct: 94.2,
        predDeadheadMiles: 187,
        predDriverPay: 2847.50,
        unassignedCount: 3,
        vehicleSummary: [
          { vehicleId: "V001", driverName: "John Smith", trips: 18, miles: 142, predOnTime: 95, deadhead: 22, pay: 342.50, flags: [] },
          { vehicleId: "V002", driverName: "Maria Garcia", trips: 22, miles: 168, predOnTime: 91, deadhead: 31, pay: 412.00, flags: ["HIGH_LOAD"] },
          { vehicleId: "V003", driverName: "James Wilson", trips: 15, miles: 98, predOnTime: 100, deadhead: 12, pay: 287.00, flags: [] },
          { vehicleId: "V004", driverName: "Sarah Johnson", trips: 20, miles: 155, predOnTime: 90, deadhead: 28, pay: 378.00, flags: ["LATE_RISK"] },
          { vehicleId: "V005", driverName: "Michael Brown", trips: 19, miles: 134, predOnTime: 95, deadhead: 19, pay: 356.00, flags: [] },
        ],
      },
      actualSummary: {
        completedTrips: 142,
        canceledTrips: 8,
        noShowTrips: 4,
        latePickups: 18,
        phiStripped: true,
        nothingDropped: true,
        qualityChecks: [
          { name: "Has timestamps?", passed: true, required: true },
          { name: "Has vehicle/driver identifiers?", passed: true, required: true },
          { name: "Has status field?", passed: true, required: true },
          { name: "Has cancellation reason?", passed: false, required: false },
        ],
      },
      compareResults: {
        predOnTimePct: 94.2,
        actualOnTimePct: 87.3,
        onTimeDelta: 6.9,
        predDeadheadMiles: 187,
        actualDeadheadMiles: 312,
        deadheadDelta: -125,
        predDriverPay: 2847.50,
        actualDriverPay: 3124.00,
        driverPayDelta: -276.50,
        estimatedSavingsUsd: 487.25,
        savingsBreakdown: [
          { label: "Deadhead reduction (125 mi × $1.25)", amount: 156.25 },
          { label: "Payroll optimization", amount: 276.50 },
          { label: "Penalty risk reduction (est.)", amount: 54.50 },
        ],
        topCauses: [
          { cause: "Late pickup windows", count: 12, severity: "HIGH", impact: "-8.2% on-time" },
          { cause: "Lock constraint overrides", count: 8, severity: "MEDIUM", impact: "+45 mi deadhead" },
          { cause: "WC vehicle scarcity", count: 5, severity: "MEDIUM", impact: "3 unassigned" },
          { cause: "Shift boundary conflicts", count: 4, severity: "LOW", impact: "+$87 overtime" },
          { cause: "Route clustering gaps", count: 3, severity: "LOW", impact: "+22 mi deadhead" },
        ],
        driverDeltas: [
          { driverName: "John Smith", predTrips: 18, actualTrips: 16, tripsDelta: 2, predMiles: 142, actualMiles: 158, milesDelta: -16, predPay: 342.50, actualPay: 378.00, payDelta: -35.50, latePickupsDelta: 3, flags: ["FEWER_TRIPS"] },
          { driverName: "Maria Garcia", predTrips: 22, actualTrips: 24, tripsDelta: -2, predMiles: 168, actualMiles: 198, milesDelta: -30, predPay: 412.00, actualPay: 468.00, payDelta: -56.00, latePickupsDelta: 5, flags: ["MORE_MILES", "LATE_PICKUPS"] },
          { driverName: "James Wilson", predTrips: 15, actualTrips: 14, tripsDelta: 1, predMiles: 98, actualMiles: 112, milesDelta: -14, predPay: 287.00, actualPay: 312.00, payDelta: -25.00, latePickupsDelta: 2, flags: [] },
          { driverName: "Sarah Johnson", predTrips: 20, actualTrips: 18, tripsDelta: 2, predMiles: 155, actualMiles: 178, milesDelta: -23, predPay: 378.00, actualPay: 425.00, payDelta: -47.00, latePickupsDelta: 4, flags: ["LATE_PICKUPS"] },
          { driverName: "Michael Brown", predTrips: 19, actualTrips: 20, tripsDelta: -1, predMiles: 134, actualMiles: 156, milesDelta: -22, predPay: 356.00, actualPay: 398.00, payDelta: -42.00, latePickupsDelta: 2, flags: ["MORE_MILES"] },
        ],
      },
    });
  }, []);
  
  const handleRunSimulation = useCallback(async () => {
    if (!canRun) return;
    
    setIsRunning(true);
    
    // Initialize simulation state
    const opco = opcos?.find((o: any) => o.code === opcoId);
    const account = brokerAccounts?.find((a: any) => a.code === brokerAccountId);
    
    setSimState({
      opcoId,
      opcoName: opco?.name || opcoId,
      brokerAccountId,
      brokerAccountName: account?.name || brokerAccountId,
      serviceDate,
      demandStep: "READY",
      shadowStep: "NOT_STARTED",
      actualStep: "NOT_STARTED",
      proofStep: "NOT_STARTED",
    });
    
    setActiveSection(1);
    setIsRunning(false);
  }, [canRun, opcoId, brokerAccountId, serviceDate, opcos, brokerAccounts]);
  
  const handleGenerateProofPack = useCallback(() => {
    if (!simState) return;
    
    // Generate proof pack
    const packId = `PP-${Date.now()}`;
    setSimState(prev => prev ? {
      ...prev,
      proofStep: "COMPLETED",
      proofPackId: packId,
    } : null);
    
    // Navigate to pack viewer
    navigate(`/simulator/packs/${packId}`);
  }, [simState, navigate]);
  
  // ============================================
  // RENDER
  // ============================================
  
  const steps = [
    { id: 1, label: "Demand In", status: simState?.demandStep || "NOT_STARTED" },
    { id: 2, label: "Shadow Run", status: simState?.shadowStep || "NOT_STARTED" },
    { id: 3, label: "Actual In", status: simState?.actualStep || "NOT_STARTED" },
    { id: 4, label: "Proof Pack", status: simState?.proofStep || "NOT_STARTED" },
  ];
  
  const getStatusColor = (status: StepStatus) => {
    switch (status) {
      case "COMPLETED": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-blue-100 text-blue-800";
      case "READY": return "bg-yellow-100 text-yellow-800";
      case "FAILED": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-600";
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Title */}
            <div>
              <h1 className="text-xl font-bold text-gray-900">One-Day Simulator</h1>
              <p className="text-sm text-gray-500">Proof of savings with IDS</p>
            </div>
            
            {/* Center: Context Chips */}
            <div className="flex items-center gap-3">
              <select
                value={opcoId}
                onChange={(e) => { setOpcoId(e.target.value); setBrokerAccountId(""); }}
                className="px-3 py-2 border rounded-lg text-sm"
              >
                <option value="">Select Company</option>
                {opcos?.map((o: any) => (
                  <option key={o.code} value={o.code}>{o.name}</option>
                ))}
              </select>
              
              <select
                value={brokerAccountId}
                onChange={(e) => setBrokerAccountId(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
                disabled={!opcoId}
              >
                <option value="">Select Funding Account</option>
                {filteredAccounts.map((a: any) => (
                  <option key={a.code} value={a.code}>{a.name}</option>
                ))}
              </select>
              
              <input
                type="date"
                value={serviceDate}
                onChange={(e) => setServiceDate(e.target.value)}
                className="px-3 py-2 border rounded-lg text-sm"
              />
            </div>
            
            {/* Right: Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleLoadExample}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Load Example
              </button>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Reset
              </button>
              <button
                onClick={handleRunSimulation}
                disabled={!canRun || isRunning}
                className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRunning ? "Running..." : "Run Simulation"}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stepper Card */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => (
              <div key={step.id} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step.status === "COMPLETED" ? "bg-green-500 text-white" :
                    step.status === "IN_PROGRESS" ? "bg-blue-500 text-white" :
                    step.status === "READY" ? "bg-yellow-500 text-white" :
                    "bg-gray-200 text-gray-500"
                  }`}>
                    {step.status === "COMPLETED" ? "✓" : step.id}
                  </div>
                  <span className="mt-2 text-sm font-medium">{step.label}</span>
                  <span className={`mt-1 px-2 py-0.5 text-xs rounded-full ${getStatusColor(step.status)}`}>
                    {step.status.replace("_", " ")}
                  </span>
                  <button
                    onClick={() => setActiveSection(step.id)}
                    className="mt-2 text-xs text-purple-600 hover:underline"
                  >
                    Open
                  </button>
                </div>
                {idx < steps.length - 1 && (
                  <div className={`w-24 h-1 mx-4 ${
                    step.status === "COMPLETED" ? "bg-green-500" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 pb-8 space-y-6">
        
        {/* Section 1: Demand In */}
        {activeSection === 1 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Demand Input (Before Dispatch)</h2>
            </div>
            <div className="p-4">
              {simState?.manifestPreview ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">✓ Imported</span>
                    <span className="text-sm text-gray-500">Batch: {simState.manifestPreview.batchChecksum}</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{simState.manifestPreview.totalRows}</div>
                      <div className="text-sm text-gray-500">Total Rows</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{simState.manifestPreview.scheduledTrips}</div>
                      <div className="text-sm text-gray-500">Scheduled Trips</div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{simState.manifestPreview.canceledTrips}</div>
                      <div className="text-sm text-gray-500">Canceled</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">{simState.manifestPreview.willCallCount}</div>
                      <div className="text-xs text-gray-500">Will-Call</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium">{simState.manifestPreview.wheelchairCount}</div>
                      <div className="text-xs text-gray-500">Wheelchair</div>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-amber-600">{simState.manifestPreview.missingTimeCount}</div>
                      <div className="text-xs text-gray-500">Missing Time</div>
                    </div>
                  </div>
                  
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span className="font-medium">Nothing Dropped</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {simState.manifestPreview.totalRows} / {simState.manifestPreview.totalRows} rows accounted
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setActiveSection(2)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Continue to Shadow Run →
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-4xl mb-4">📄</div>
                  <p className="text-gray-500">Upload a broker manifest to begin</p>
                  <p className="text-sm text-gray-400 mt-2">Supports PDF (Modivcare) and CSV (MTM, A2C)</p>
                  <button className="mt-4 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-purple-400 hover:text-purple-600">
                    Drop file here or click to upload
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Section 2: Shadow Run */}
        {activeSection === 2 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">IDS Shadow Dispatch (Proposed Plan)</h2>
            </div>
            <div className="p-4">
              {simState?.shadowSummary ? (
                <div className="space-y-4">
                  {/* Controls */}
                  <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={useLocks}
                        onChange={(e) => setUseLocks(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Use Locks</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allowOptions}
                        onChange={(e) => setAllowOptions(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Allow Options</span>
                    </label>
                  </div>
                  
                  {/* KPI Cards */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{simState.shadowSummary.predOnTimePct}%</div>
                      <div className="text-sm text-gray-500">Predicted On-time</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-700">{simState.shadowSummary.predDeadheadMiles} mi</div>
                      <div className="text-sm text-gray-500">Predicted Deadhead</div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-700">${simState.shadowSummary.predDriverPay.toLocaleString()}</div>
                      <div className="text-sm text-gray-500">Predicted Pay</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-700">{simState.shadowSummary.unassignedCount}</div>
                      <div className="text-sm text-gray-500">Unassigned</div>
                    </div>
                  </div>
                  
                  {/* Map Replay CTA */}
                  <button
                    onClick={() => navigate(`/ids/shadow-runs/${simState.shadowRunId}/map`)}
                    className="w-full p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl">🗺️</span>
                      <span className="font-medium">Open Map Replay</span>
                    </div>
                  </button>
                  
                  {/* Vehicle Summary Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Vehicle</th>
                          <th className="px-4 py-2 text-left">Driver</th>
                          <th className="px-4 py-2 text-right">Trips</th>
                          <th className="px-4 py-2 text-right">Miles</th>
                          <th className="px-4 py-2 text-right">On-time</th>
                          <th className="px-4 py-2 text-right">Deadhead</th>
                          <th className="px-4 py-2 text-right">Pay</th>
                          <th className="px-4 py-2 text-left">Flags</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simState.shadowSummary.vehicleSummary.map((v) => (
                          <tr key={v.vehicleId} className="border-t hover:bg-gray-50 cursor-pointer">
                            <td className="px-4 py-2 font-medium">{v.vehicleId}</td>
                            <td className="px-4 py-2">{v.driverName}</td>
                            <td className="px-4 py-2 text-right">{v.trips}</td>
                            <td className="px-4 py-2 text-right">{v.miles}</td>
                            <td className="px-4 py-2 text-right">{v.predOnTime}%</td>
                            <td className="px-4 py-2 text-right">{v.deadhead} mi</td>
                            <td className="px-4 py-2 text-right">${v.pay.toFixed(2)}</td>
                            <td className="px-4 py-2">
                              {v.flags.map((f) => (
                                <span key={f} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded mr-1">{f}</span>
                              ))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  <button
                    onClick={() => setActiveSection(3)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Continue to Actual Import →
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Import demand first to run IDS</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Section 3: Actual In */}
        {activeSection === 3 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Actual Results (After Dispatch)</h2>
            </div>
            <div className="p-4">
              {simState?.actualSummary ? (
                <div className="space-y-4">
                  {/* Badges */}
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">✓ PHI Stripped</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm rounded">✓ Nothing Dropped</span>
                  </div>
                  
                  {/* Summary */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-700">{simState.actualSummary.completedTrips}</div>
                      <div className="text-sm text-gray-500">Completed</div>
                    </div>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-700">{simState.actualSummary.canceledTrips}</div>
                      <div className="text-sm text-gray-500">Canceled</div>
                    </div>
                    <div className="p-4 bg-amber-50 rounded-lg">
                      <div className="text-2xl font-bold text-amber-700">{simState.actualSummary.noShowTrips}</div>
                      <div className="text-sm text-gray-500">No-Shows</div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-700">{simState.actualSummary.latePickups}</div>
                      <div className="text-sm text-gray-500">Late Pickups</div>
                    </div>
                  </div>
                  
                  {/* Quality Checks */}
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-3">Quality Checks</h3>
                    <div className="space-y-2">
                      {simState.actualSummary.qualityChecks.map((check) => (
                        <div key={check.name} className="flex items-center justify-between">
                          <span className="text-sm">{check.name}</span>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            check.passed ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                          }`}>
                            {check.passed ? "PASS" : "MISSING"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => setActiveSection(4)}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    Continue to Compare & Proof →
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Upload completed trips export to compare</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Section 4: Compare + Proof Pack */}
        {activeSection === 4 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">Proof of Impact (IDS vs Actual)</h2>
            </div>
            <div className="p-4">
              {simState?.compareResults ? (
                <div className="space-y-6">
                  {/* Compare KPI Cards */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">On-time %</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-green-600">{simState.compareResults.predOnTimePct}%</span>
                        <span className="text-gray-400">vs</span>
                        <span className="text-xl font-bold text-red-600">{simState.compareResults.actualOnTimePct}%</span>
                      </div>
                      <div className="text-sm text-green-600 mt-1">+{simState.compareResults.onTimeDelta}% with IDS</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">Deadhead Miles</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-green-600">{simState.compareResults.predDeadheadMiles}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="text-xl font-bold text-red-600">{simState.compareResults.actualDeadheadMiles}</span>
                      </div>
                      <div className="text-sm text-green-600 mt-1">{simState.compareResults.deadheadDelta} mi saved</div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">Driver Pay</div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-green-600">${simState.compareResults.predDriverPay.toLocaleString()}</span>
                        <span className="text-gray-400">vs</span>
                        <span className="text-xl font-bold text-red-600">${simState.compareResults.actualDriverPay.toLocaleString()}</span>
                      </div>
                      <div className="text-sm text-green-600 mt-1">${Math.abs(simState.compareResults.driverPayDelta).toFixed(2)} saved</div>
                    </div>
                  </div>
                  
                  {/* Estimated Savings */}
                  <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                    <div className="text-center">
                      <div className="text-sm text-gray-500 mb-1">Estimated Savings (Conservative)</div>
                      <div className="text-4xl font-bold text-green-700">${simState.compareResults.estimatedSavingsUsd.toFixed(2)}</div>
                      <div className="text-sm text-gray-500 mt-2">per day</div>
                    </div>
                    <div className="mt-4 space-y-1">
                      {simState.compareResults.savingsBreakdown.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.label}</span>
                          <span className="font-medium">${item.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Top 5 Causes */}
                  <div>
                    <h3 className="font-medium mb-3">Top 5 Causes of Difference</h3>
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left">Cause</th>
                          <th className="px-4 py-2 text-right">Count</th>
                          <th className="px-4 py-2 text-center">Severity</th>
                          <th className="px-4 py-2 text-left">Impact</th>
                        </tr>
                      </thead>
                      <tbody>
                        {simState.compareResults.topCauses.map((cause, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-4 py-2">{cause.cause}</td>
                            <td className="px-4 py-2 text-right">{cause.count}</td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                cause.severity === "HIGH" ? "bg-red-100 text-red-800" :
                                cause.severity === "MEDIUM" ? "bg-amber-100 text-amber-800" :
                                "bg-gray-100 text-gray-800"
                              }`}>{cause.severity}</span>
                            </td>
                            <td className="px-4 py-2 text-gray-600">{cause.impact}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Per-Driver Delta Table */}
                  <div>
                    <h3 className="font-medium mb-3">Per-Driver Delta</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Driver</th>
                            <th className="px-4 py-2 text-right">Trips (P/A/Δ)</th>
                            <th className="px-4 py-2 text-right">Miles (P/A/Δ)</th>
                            <th className="px-4 py-2 text-right">Pay (P/A/Δ)</th>
                            <th className="px-4 py-2 text-right">Late Δ</th>
                            <th className="px-4 py-2 text-left">Flags</th>
                          </tr>
                        </thead>
                        <tbody>
                          {simState.compareResults.driverDeltas.map((d) => (
                            <tr key={d.driverName} className="border-t hover:bg-gray-50 cursor-pointer">
                              <td className="px-4 py-2 font-medium">{d.driverName}</td>
                              <td className="px-4 py-2 text-right">
                                {d.predTrips}/{d.actualTrips}/
                                <span className={d.tripsDelta >= 0 ? "text-green-600" : "text-red-600"}>
                                  {d.tripsDelta > 0 ? "+" : ""}{d.tripsDelta}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                {d.predMiles}/{d.actualMiles}/
                                <span className={d.milesDelta <= 0 ? "text-green-600" : "text-red-600"}>
                                  {d.milesDelta > 0 ? "+" : ""}{d.milesDelta}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right">
                                ${d.predPay.toFixed(0)}/${d.actualPay.toFixed(0)}/
                                <span className={d.payDelta <= 0 ? "text-green-600" : "text-red-600"}>
                                  ${Math.abs(d.payDelta).toFixed(0)}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right text-red-600">+{d.latePickupsDelta}</td>
                              <td className="px-4 py-2">
                                {d.flags.map((f) => (
                                  <span key={f} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded mr-1">{f}</span>
                                ))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  {/* Generate Proof Pack CTA */}
                  <div className="flex items-center gap-4">
                    <select
                      value={narrativeStyle}
                      onChange={(e) => setNarrativeStyle(e.target.value as "INTERNAL" | "CLIENT")}
                      className="px-3 py-2 border rounded-lg"
                    >
                      <option value="CLIENT">Client Tone</option>
                      <option value="INTERNAL">Internal Tone</option>
                    </select>
                    <button
                      onClick={handleGenerateProofPack}
                      className="flex-1 p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 font-medium"
                    >
                      Generate Proof Pack
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">Complete previous steps to see comparison</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
