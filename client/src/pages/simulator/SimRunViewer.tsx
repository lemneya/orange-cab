/**
 * OC-SIM-0: Simulation Run Viewer
 * Route: /simulator/runs/:id
 * 
 * Detailed view of a simulation run with all steps and results
 */

import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// ============================================
// TYPES
// ============================================

type StepStatus = "NOT_STARTED" | "READY" | "IN_PROGRESS" | "COMPLETED" | "FAILED";

interface SimRun {
  id: number;
  opcoId: string;
  opcoName: string;
  brokerAccountId: string;
  brokerAccountName: string;
  serviceDate: string;
  status: string;
  demandStep: StepStatus;
  shadowStep: StepStatus;
  actualStep: StepStatus;
  proofStep: StepStatus;
  manifestImportId?: string;
  shadowRunId?: string;
  actualImportId?: string;
  proofPackId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_RUN: SimRun = {
  id: 1,
  opcoId: "SAHRAWI",
  opcoName: "Sahrawi",
  brokerAccountId: "MODIVCARE_SAHRAWI",
  brokerAccountName: "Modivcare - Sahrawi",
  serviceDate: "2026-01-09",
  status: "COMPARE_COMPLETE",
  demandStep: "COMPLETED",
  shadowStep: "COMPLETED",
  actualStep: "COMPLETED",
  proofStep: "READY",
  manifestImportId: "MI-001",
  shadowRunId: "SR-001",
  actualImportId: "AI-001",
  createdAt: "2026-01-16T10:00:00Z",
  updatedAt: "2026-01-16T10:15:00Z",
};

// ============================================
// COMPONENT
// ============================================

export default function SimRunViewer() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<"overview" | "demand" | "shadow" | "actual" | "compare">("overview");
  
  // In production, fetch from API
  const run = MOCK_RUN;
  
  const steps = [
    { id: 1, label: "Demand In", status: run.demandStep, ref: run.manifestImportId },
    { id: 2, label: "Shadow Run", status: run.shadowStep, ref: run.shadowRunId },
    { id: 3, label: "Actual In", status: run.actualStep, ref: run.actualImportId },
    { id: 4, label: "Proof Pack", status: run.proofStep, ref: run.proofPackId },
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
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <button onClick={() => navigate("/simulator/day")} className="hover:text-purple-600">
                  ← Simulator
                </button>
                <span>/</span>
                <span>Run #{id}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">Simulation Run #{id}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Service Date</div>
                <div className="font-medium">{run.serviceDate}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Company</div>
                <div className="font-medium">{run.opcoName}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Account</div>
                <div className="font-medium">{run.brokerAccountName}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Stepper */}
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
                  {step.ref && (
                    <span className="mt-1 text-xs text-gray-400">{step.ref}</span>
                  )}
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
      
      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow">
          <div className="border-b">
            <nav className="flex">
              {["overview", "demand", "shadow", "actual", "compare"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 ${
                    activeTab === tab
                      ? "border-purple-600 text-purple-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>
          
          <div className="p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-4">Run Details</h3>
                    <dl className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Run ID</dt>
                        <dd className="font-medium">{run.id}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Status</dt>
                        <dd className="font-medium">{run.status}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Created</dt>
                        <dd className="font-medium">{new Date(run.createdAt).toLocaleString()}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-gray-500">Updated</dt>
                        <dd className="font-medium">{new Date(run.updatedAt).toLocaleString()}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h3 className="font-medium mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <button
                        onClick={() => navigate(`/ids/shadow-runs/${run.shadowRunId}`)}
                        className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg"
                        disabled={!run.shadowRunId}
                      >
                        View Shadow Run →
                      </button>
                      <button
                        onClick={() => navigate(`/ids/shadow-runs/${run.shadowRunId}/map`)}
                        className="w-full px-4 py-2 text-left text-sm bg-gray-50 hover:bg-gray-100 rounded-lg"
                        disabled={!run.shadowRunId}
                      >
                        Open Map Replay →
                      </button>
                      <button
                        onClick={() => navigate(`/simulator/packs/${run.proofPackId}`)}
                        className="w-full px-4 py-2 text-left text-sm bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg"
                        disabled={!run.proofPackId}
                      >
                        View Proof Pack →
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Timeline */}
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-4">Activity Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                      <div>
                        <div className="text-sm font-medium">Demand imported</div>
                        <div className="text-xs text-gray-500">156 rows, 148 scheduled trips</div>
                      </div>
                      <div className="ml-auto text-xs text-gray-400">10:00 AM</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                      <div>
                        <div className="text-sm font-medium">Shadow run completed</div>
                        <div className="text-xs text-gray-500">94.2% on-time, 187 mi deadhead</div>
                      </div>
                      <div className="ml-auto text-xs text-gray-400">10:05 AM</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                      <div>
                        <div className="text-sm font-medium">Actual results imported</div>
                        <div className="text-xs text-gray-500">142 completed, 18 late pickups</div>
                      </div>
                      <div className="ml-auto text-xs text-gray-400">10:10 AM</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 bg-green-500 rounded-full" />
                      <div>
                        <div className="text-sm font-medium">Comparison complete</div>
                        <div className="text-xs text-gray-500">$487.25 estimated savings</div>
                      </div>
                      <div className="ml-auto text-xs text-gray-400">10:15 AM</div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 mt-2 bg-yellow-500 rounded-full" />
                      <div>
                        <div className="text-sm font-medium">Proof pack ready to generate</div>
                        <div className="text-xs text-gray-500">Click to generate shareable pack</div>
                      </div>
                      <div className="ml-auto text-xs text-gray-400">Pending</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === "demand" && (
              <div className="text-center py-12 text-gray-500">
                <p>Demand import details will be shown here</p>
                <p className="text-sm mt-2">Manifest ID: {run.manifestImportId}</p>
              </div>
            )}
            
            {activeTab === "shadow" && (
              <div className="text-center py-12 text-gray-500">
                <p>Shadow run details will be shown here</p>
                <p className="text-sm mt-2">Shadow Run ID: {run.shadowRunId}</p>
              </div>
            )}
            
            {activeTab === "actual" && (
              <div className="text-center py-12 text-gray-500">
                <p>Actual import details will be shown here</p>
                <p className="text-sm mt-2">Actual Import ID: {run.actualImportId}</p>
              </div>
            )}
            
            {activeTab === "compare" && (
              <div className="text-center py-12 text-gray-500">
                <p>Comparison results will be shown here</p>
                <button
                  onClick={() => navigate("/simulator/day")}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg"
                >
                  View Full Comparison
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
