/**
 * OC-SIM-0: Proof Pack Viewer
 * Route: /simulator/packs/:id
 * 
 * Shareable proof pack with KPIs, narrative, and evidence
 * This is the sales deliverable: "Here's the proof of what IDS can do for you."
 */

import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";

// ============================================
// TYPES
// ============================================

interface ProofPack {
  id: string;
  packId: string;
  opcoName: string;
  brokerAccountName: string;
  serviceDate: string;
  title: string;
  status: "GENERATING" | "READY" | "FAILED";
  
  // KPIs
  kpis: {
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
    scheduledTrips: number;
    completedTrips: number;
    latePickups: number;
  };
  
  // Narrative
  narrativeMarkdown: string;
  narrativeStyle: "INTERNAL" | "CLIENT";
  
  // Evidence
  snapshotChecksum: string;
  importAuditIds: string[];
  
  // Metadata
  createdAt: string;
  expiresAt?: string;
}

// ============================================
// MOCK DATA
// ============================================

const MOCK_PACK: ProofPack = {
  id: "1",
  packId: "PP-20260116-001",
  opcoName: "Sahrawi",
  brokerAccountName: "Modivcare - Sahrawi",
  serviceDate: "2026-01-09",
  title: "One-Day Proof: January 9, 2026",
  status: "READY",
  kpis: {
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
    scheduledTrips: 148,
    completedTrips: 142,
    latePickups: 18,
  },
  narrativeMarkdown: `## Executive Summary

On January 9, 2026, the Intelligent Dispatch System (IDS) was run in shadow mode against the actual dispatch decisions made by Sahrawi for the Modivcare contract. The results demonstrate clear operational improvements that IDS would have achieved.

### Key Findings

**On-Time Performance**: IDS predicted a 94.2% on-time rate compared to the actual 87.3% achieved. This 6.9 percentage point improvement would reduce late pickup penalties and improve member satisfaction scores.

**Deadhead Reduction**: IDS optimized routes to achieve 187 deadhead miles versus the actual 312 miles driven. This 125-mile reduction translates to fuel savings and reduced vehicle wear.

**Driver Pay Optimization**: Through better route clustering and trip sequencing, IDS predicted driver pay of $2,847.50 compared to actual pay of $3,124.00. This $276.50 savings comes from more efficient trip assignments, not reduced driver compensation per trip.

### Estimated Daily Savings

| Category | Amount |
|----------|--------|
| Deadhead reduction (125 mi × $1.25) | $156.25 |
| Payroll optimization | $276.50 |
| Penalty risk reduction (est.) | $54.50 |
| **Total** | **$487.25** |

### Top Improvement Areas

1. **Late pickup windows** (12 instances) - IDS would have flagged these trips for earlier dispatch
2. **Lock constraint overrides** (8 instances) - Better vehicle-driver matching would reduce manual overrides
3. **Wheelchair vehicle scarcity** (5 instances) - Proactive WC vehicle positioning would improve coverage

### Conclusion

Based on this one-day analysis, implementing IDS for the Sahrawi-Modivcare operation could yield approximately **$487 in daily savings**, or roughly **$126,620 annually** (assuming 260 operating days).

This proof pack was generated from verified import data with checksums preserved for audit purposes.`,
  narrativeStyle: "CLIENT",
  snapshotChecksum: "sha256:abc123def456789...",
  importAuditIds: ["MI-001", "AI-001"],
  createdAt: "2026-01-16T10:20:00Z",
};

// ============================================
// COMPONENT
// ============================================

export default function ProofPackViewer() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [showEvidence, setShowEvidence] = useState(false);
  
  // In production, fetch from API
  const pack = MOCK_PACK;
  
  const handleDownloadPDF = () => {
    // TODO: Implement PDF export
    alert("PDF export coming soon");
  };
  
  const handleCopyLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard");
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                <button onClick={() => navigate("/simulator/day")} className="hover:text-purple-600">
                  ← Simulator
                </button>
                <span>/</span>
                <span>Proof Pack</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">{pack.title}</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Copy Link
              </button>
              <button
                onClick={handlePrint}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Print
              </button>
              <button
                onClick={handleDownloadPDF}
                className="px-4 py-2 text-sm text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        
        {/* Header Card */}
        <div className="bg-white rounded-lg shadow p-6 print:shadow-none print:border">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">{pack.title}</div>
              <div className="text-gray-500 mt-1">
                {pack.opcoName} • {pack.brokerAccountName}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Pack ID</div>
              <div className="font-mono text-sm">{pack.packId}</div>
              <div className="text-xs text-gray-400 mt-1">
                Generated {new Date(pack.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Savings Hero */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg shadow p-8 text-white text-center">
          <div className="text-sm opacity-80 mb-2">Estimated Daily Savings</div>
          <div className="text-5xl font-bold">${pack.kpis.estimatedSavingsUsd.toFixed(2)}</div>
          <div className="text-sm opacity-80 mt-2">
            ~${(pack.kpis.estimatedSavingsUsd * 260).toLocaleString()} annually (260 days)
          </div>
        </div>
        
        {/* KPI Comparison Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4 print:shadow-none print:border">
            <div className="text-sm text-gray-500 mb-2">On-Time Performance</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">{pack.kpis.predOnTimePct}%</span>
              <span className="text-gray-400">vs</span>
              <span className="text-2xl font-bold text-gray-600">{pack.kpis.actualOnTimePct}%</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              +{pack.kpis.onTimeDelta}% improvement
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${pack.kpis.predOnTimePct}%` }} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 print:shadow-none print:border">
            <div className="text-sm text-gray-500 mb-2">Deadhead Miles</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">{pack.kpis.predDeadheadMiles}</span>
              <span className="text-gray-400">vs</span>
              <span className="text-2xl font-bold text-gray-600">{pack.kpis.actualDeadheadMiles}</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              {Math.abs(pack.kpis.deadheadDelta)} miles saved
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${(pack.kpis.predDeadheadMiles / pack.kpis.actualDeadheadMiles) * 100}%` }} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4 print:shadow-none print:border">
            <div className="text-sm text-gray-500 mb-2">Driver Pay</div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-green-600">${pack.kpis.predDriverPay.toLocaleString()}</span>
              <span className="text-gray-400">vs</span>
              <span className="text-2xl font-bold text-gray-600">${pack.kpis.actualDriverPay.toLocaleString()}</span>
            </div>
            <div className="text-sm text-green-600 mt-1">
              ${Math.abs(pack.kpis.driverPayDelta).toFixed(2)} optimized
            </div>
            <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${(pack.kpis.predDriverPay / pack.kpis.actualDriverPay) * 100}%` }} />
            </div>
          </div>
        </div>
        
        {/* Narrative */}
        <div className="bg-white rounded-lg shadow p-6 print:shadow-none print:border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Analysis Report</h2>
            <span className={`px-2 py-1 text-xs rounded ${
              pack.narrativeStyle === "CLIENT" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800"
            }`}>
              {pack.narrativeStyle} TONE
            </span>
          </div>
          <div className="prose prose-sm max-w-none">
            {pack.narrativeMarkdown.split('\n').map((line, idx) => {
              if (line.startsWith('## ')) {
                return <h2 key={idx} className="text-xl font-bold mt-6 mb-3">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={idx} className="text-lg font-semibold mt-4 mb-2">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={idx} className="font-bold">{line.replace(/\*\*/g, '')}</p>;
              }
              if (line.startsWith('|')) {
                // Simple table rendering
                return <pre key={idx} className="text-sm bg-gray-50 p-2 rounded">{line}</pre>;
              }
              if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                return <li key={idx} className="ml-4">{line.replace(/^\d+\. /, '')}</li>;
              }
              if (line.trim() === '') {
                return <br key={idx} />;
              }
              return <p key={idx} className="mb-2">{line}</p>;
            })}
          </div>
        </div>
        
        {/* Evidence Section */}
        <div className="bg-white rounded-lg shadow print:shadow-none print:border">
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="w-full p-4 flex items-center justify-between text-left"
          >
            <div>
              <h2 className="font-semibold">Evidence & Audit Trail</h2>
              <p className="text-sm text-gray-500">Checksums and import references</p>
            </div>
            <span className="text-gray-400">{showEvidence ? "▲" : "▼"}</span>
          </button>
          
          {showEvidence && (
            <div className="p-4 border-t space-y-4">
              <div>
                <div className="text-sm text-gray-500 mb-1">Snapshot Checksum</div>
                <code className="text-xs bg-gray-100 px-2 py-1 rounded">{pack.snapshotChecksum}</code>
              </div>
              
              <div>
                <div className="text-sm text-gray-500 mb-1">Import Audit IDs</div>
                <div className="flex gap-2">
                  {pack.importAuditIds.map((id) => (
                    <code key={id} className="text-xs bg-gray-100 px-2 py-1 rounded">{id}</code>
                  ))}
                </div>
              </div>
              
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-green-600">✓</span>
                  <span className="font-medium text-green-800">PHI Stripped</span>
                </div>
                <p className="text-sm text-green-700 mt-1">
                  This proof pack contains only aggregate KPIs and no protected health information.
                </p>
              </div>
              
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-blue-600">ℹ</span>
                  <span className="font-medium text-blue-800">SSOT Guarantee</span>
                </div>
                <p className="text-sm text-blue-700 mt-1">
                  All narrative content was generated from the snapshot JSON only. 
                  No external data sources were used.
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="text-center text-sm text-gray-400 py-4">
          <p>Generated by Orange Cab OS • Intelligent Dispatch System</p>
          <p className="mt-1">Pack ID: {pack.packId}</p>
        </div>
      </div>
    </div>
  );
}
