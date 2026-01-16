import { useState } from "react";
import { useParams, Link } from "wouter";
import {
  ArrowLeft,
  Download,
  Share2,
  FileText,
  BarChart3,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Truck,
  Clock,
  Users,
  CheckCircle,
  Copy,
} from "lucide-react";

type Tab = "summary" | "kpis" | "narrative" | "evidence";

export default function PackViewer() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<Tab>("summary");
  const [copied, setCopied] = useState(false);

  // Mock pack data
  const pack = {
    id,
    name: "Weekly Ops Pack",
    opcoName: "Sahrawi Transportation",
    brokerAccountName: "Modivcare-Sahrawi",
    startDate: "2026-01-09",
    endDate: "2026-01-15",
    style: "INTERNAL" as const,
    status: "READY" as const,
    createdBy: "Demo Admin",
    createdAt: "2026-01-15T10:30:00Z",
    snapshotChecksum: "a7b3c9d2e1f4",
  };

  // Mock KPIs
  const kpis = {
    revenue: 8300,
    revenueChange: 5.2,
    expenses: 7147.32,
    expensesChange: -2.1,
    netMargin: 1152.68,
    marginPct: 13.9,
    trips: 368,
    tripsCompleted: 332,
    onTimeRate: 91.2,
    onTimeChange: 3.5,
    deadhead: 1240,
    deadheadChange: -8.2,
    fuelCost: 2847.50,
    fuelChange: 1.3,
    driverPay: 4299.82,
    driverPayChange: 0.8,
  };

  // Mock narrative
  const narrative = `# Weekly Operations Summary

**Period**: January 9–15, 2026  
**Company**: Sahrawi Transportation  
**Broker Account**: Modivcare-Sahrawi

## Executive Summary

This week showed strong operational performance with **91.2% on-time rate** (+3.5% vs prior week) and **$1,152.68 net margin** (13.9% margin).

### Key Wins
- On-time performance improved by 3.5 percentage points
- Deadhead miles reduced by 8.2% through better route optimization
- Zero lock violations across all shadow runs

### Areas for Improvement
- Driver D003 (Martinez) had 4 late pickups — recommend schedule review
- Vehicle V007 fuel efficiency below fleet average — maintenance check needed
- MTM account showing higher cancellation rate (12%) vs Modivcare (6%)

## Recommended Actions

1. **Dispatch**: Lock top 12 standing templates in Zone A by Monday
2. **Fleet**: Schedule V007 for fuel system inspection
3. **Ops**: Review D003 schedule for window conflicts

---
*Generated from snapshot: a7b3c9d2e1f4*  
*Model: LFM2-2.6B-EXP | Prompt v1.0*`;

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "summary", label: "Summary", icon: <FileText className="w-4 h-4" /> },
    { id: "kpis", label: "KPIs", icon: <BarChart3 className="w-4 h-4" /> },
    { id: "narrative", label: "Narrative", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "evidence", label: "Evidence", icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/owner/packs" className="text-gray-500 hover:text-gray-700">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{pack.name}</h1>
                <p className="text-sm text-gray-500">
                  {pack.opcoName} • {pack.startDate} — {pack.endDate}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
                <Share2 className="w-4 h-4" />
                Share
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600">
                <Download className="w-4 h-4" />
                Export PDF
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-t-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-gray-100 text-orange-600 border-b-2 border-orange-500"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {activeTab === "summary" && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Net Margin</div>
                  <DollarSign className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  ${kpis.netMargin.toLocaleString()}
                </div>
                <div className="text-sm text-green-600">{kpis.marginPct}% margin</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">On-Time Rate</div>
                  <Clock className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {kpis.onTimeRate}%
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingUp className="w-3 h-3" />
                  +{kpis.onTimeChange}% vs prior
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Trips Completed</div>
                  <Users className="w-5 h-5 text-purple-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {kpis.tripsCompleted}
                </div>
                <div className="text-sm text-gray-500">of {kpis.trips} scheduled</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm border">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">Deadhead Miles</div>
                  <Truck className="w-5 h-5 text-amber-500" />
                </div>
                <div className="text-2xl font-bold text-gray-900 mt-1">
                  {kpis.deadhead.toLocaleString()}
                </div>
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <TrendingDown className="w-3 h-3" />
                  {kpis.deadheadChange}% vs prior
                </div>
              </div>
            </div>

            {/* Narrative Preview */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">AI Narrative Summary</h3>
              <div className="prose prose-sm max-w-none">
                <p className="text-gray-700">
                  This week showed strong operational performance with <strong>91.2% on-time rate</strong> (+3.5% vs prior week) 
                  and <strong>$1,152.68 net margin</strong> (13.9% margin). Key wins include improved on-time performance 
                  and 8.2% reduction in deadhead miles.
                </p>
              </div>
              <button
                onClick={() => setActiveTab("narrative")}
                className="mt-4 text-sm text-orange-600 hover:underline"
              >
                Read full narrative →
              </button>
            </div>
          </div>
        )}

        {activeTab === "kpis" && (
          <div className="space-y-6">
            {/* Revenue & Expenses */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Financial Overview</h3>
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Revenue</div>
                  <div className="text-2xl font-bold text-gray-900">${kpis.revenue.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingUp className="w-3 h-3" />
                    +{kpis.revenueChange}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Expenses</div>
                  <div className="text-2xl font-bold text-gray-900">${kpis.expenses.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-sm text-green-600">
                    <TrendingDown className="w-3 h-3" />
                    {kpis.expensesChange}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Net Margin</div>
                  <div className="text-2xl font-bold text-green-600">${kpis.netMargin.toLocaleString()}</div>
                  <div className="text-sm text-gray-500">{kpis.marginPct}% margin</div>
                </div>
              </div>
            </div>

            {/* Operations */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Operations</h3>
              <div className="grid grid-cols-4 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Trips</div>
                  <div className="text-xl font-bold text-gray-900">{kpis.trips}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Completed</div>
                  <div className="text-xl font-bold text-gray-900">{kpis.tripsCompleted}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">On-Time Rate</div>
                  <div className="text-xl font-bold text-gray-900">{kpis.onTimeRate}%</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Deadhead Miles</div>
                  <div className="text-xl font-bold text-gray-900">{kpis.deadhead.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Costs */}
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Driver Pay</div>
                  <div className="text-xl font-bold text-gray-900">${kpis.driverPay.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <TrendingUp className="w-3 h-3" />
                    +{kpis.driverPayChange}%
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Fuel Cost</div>
                  <div className="text-xl font-bold text-gray-900">${kpis.fuelCost.toLocaleString()}</div>
                  <div className="flex items-center gap-1 text-sm text-amber-600">
                    <TrendingUp className="w-3 h-3" />
                    +{kpis.fuelChange}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "narrative" && (
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">AI-Generated Narrative</h3>
              <button
                onClick={handleCopy}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded"
              >
                <Copy className="w-4 h-4" />
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-700 bg-gray-50 p-4 rounded-lg">
                {narrative}
              </pre>
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-gray-400">
              Snapshot checksum: {pack.snapshotChecksum} • Generated {new Date(pack.createdAt).toLocaleString()}
            </div>
          </div>
        )}

        {activeTab === "evidence" && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Evidence Trail</h3>
              <p className="text-sm text-gray-500 mb-4">
                All data sources and calculations used to generate this pack are logged for audit purposes.
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900">Report Snapshot</div>
                      <div className="text-sm text-gray-500">Checksum: {pack.snapshotChecksum}</div>
                    </div>
                  </div>
                  <button className="text-sm text-orange-600 hover:underline">View JSON</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900">Payroll Data</div>
                      <div className="text-sm text-gray-500">368 trips, 12 drivers</div>
                    </div>
                  </div>
                  <button className="text-sm text-orange-600 hover:underline">View Source</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900">IDS Shadow Runs</div>
                      <div className="text-sm text-gray-500">7 runs, 0 lock violations</div>
                    </div>
                  </div>
                  <button className="text-sm text-orange-600 hover:underline">View Runs</button>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <div>
                      <div className="font-medium text-gray-900">Fuel/Toll Imports</div>
                      <div className="text-sm text-gray-500">2 imports, 847 transactions</div>
                    </div>
                  </div>
                  <button className="text-sm text-orange-600 hover:underline">View Imports</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border">
              <h3 className="font-semibold text-gray-900 mb-4">Narrative Generation Log</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">10:30:01</span>
                  <span>Started narrative generation</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">10:30:02</span>
                  <span>Extracted 42 tokens from snapshot</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">10:30:05</span>
                  <span>LLM response received (3.2s)</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">10:30:05</span>
                  <span>Validated 18 placeholders — all in allowlist</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <span className="text-gray-400">10:30:05</span>
                  <span>PHI check passed — 0 patterns detected</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-gray-400">10:30:06</span>
                  <span>✓ Narrative generated successfully</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
