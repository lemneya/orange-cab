import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "../../lib/trpc";
import {
  DollarSign,
  Clock,
  XCircle,
  Navigation,
  Wallet,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  FileText,
  Truck,
  Wrench,
  Zap,
  Users,
  MapPin,
  Calendar,
} from "lucide-react";

// Types
type NamedRow = { id: string; name: string };
interface KPICard {
  id: string;
  title: string;
  value: string;
  subtext: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

interface Alert {
  id: string;
  severity: "HIGH" | "MED";
  type: string;
  headline: string;
  deepLink: string;
  module: string;
}

interface TimelineHour {
  hour: number;
  demandPressure: number;
  riskPressure: number;
  willCallCount: number;
  wchCount: number;
  tightWindowCount: number;
}

// Date presets
const DATE_PRESETS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "This Week", value: "this_week" },
  { label: "Last 7 Days", value: "last_7_days" },
];

export default function OwnerCockpit() {
  // State
  const [selectedOpco, setSelectedOpco] = useState<string>("all");
  const [selectedBrokerAccount, setSelectedBrokerAccount] = useState<string>("all");
  const [datePreset, setDatePreset] = useState("today");
  const [activeTab, setActiveTab] = useState<string>("loss");
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [showPackModal, setShowPackModal] = useState(false);
  const [selectedKPIDrawer, setSelectedKPIDrawer] = useState<string | null>(null);
  const [narrativeStyle, setNarrativeStyle] = useState<"internal" | "client">("internal");

  // Queries
  const { data: opcos } = useQuery({
    queryKey: ["admin", "opcos"],
    queryFn: () => trpc.admin.getOpcos.query(),
  });

  const { data: brokerAccounts } = useQuery({
    queryKey: ["admin", "brokerAccounts"],
    queryFn: () => trpc.admin.getBrokerAccounts.query(),
  });

  // Mock snapshot data (in production, this comes from owner.getSnapshot)
  const snapshot = useMemo(() => ({
    opcoId: selectedOpco,
    opcoName: opcos?.find(o => o.id === selectedOpco)?.name || "All Companies",
    brokerAccountId: selectedBrokerAccount === "all" ? null : selectedBrokerAccount,
    brokerAccountName: brokerAccounts?.find(b => b.id === selectedBrokerAccount)?.name || null,
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    generatedAt: new Date().toISOString(),
    
    revenueEstimate: 12450.00,
    revenueDeltaPct: 8.5,
    expenses: 9875.32,
    margin: 2574.68,
    marginPct: 20.7,
    
    tripsTotal: 156,
    tripsCompleted: 142,
    tripsCanceled: 8,
    tripsNoShow: 4,
    tripsNoCover: 2,
    demandDataAvailable: true,
    
    onTimePct: 94.2,
    lateCount: 9,
    onTimeDeltaPct: 1.5,
    
    deadheadMiles: 187,
    deadheadDeltaMiles: -23,
    
    payrollTotal: 6234.50,
    fuelTotal: 2890.82,
    tollTotal: 750.00,
    cashOutTotal: 9875.32,
    
    vehiclesActive: 18,
    vehiclesTotal: 22,
    vehiclesInShop: 3,
    vehiclesDueInspection: 2,
    wchReady: 6,
    
    idsAvailable: true,
    idsOnTimeImprovement: 3.5,
    idsDeadheadSaved: 45,
    idsPaySaved: 890,
    idsLockCompliance: 98.5,
    
    alerts: [
      { id: "1", severity: "HIGH" as const, type: "wch_pressure", headline: "WCH demand exceeds supply by 2 vehicles", deepLink: "/ids/shadow-runs", module: "IDS" },
      { id: "2", severity: "MED" as const, type: "unassigned", headline: "3 trips unassigned for 10:00-11:00 window", deepLink: "/ids/shadow-runs/1?tab=unassigned", module: "IDS" },
      { id: "3", severity: "MED" as const, type: "fuel_anomaly", headline: "V-007 fuel spend 40% above baseline", deepLink: "/payroll/fuel", module: "Payroll" },
    ],
    
    topDrivers: [
      { name: "M. Rodriguez", pay: 892.50, trips: 28 },
      { name: "J. Williams", pay: 845.00, trips: 26 },
      { name: "D. Johnson", pay: 798.25, trips: 24 },
    ],
    
    topCostDrivers: [
      { name: "V-003", type: "Fuel", amount: 456.78 },
      { name: "M. Rodriguez", type: "Payroll", amount: 892.50 },
      { name: "V-007", type: "Fuel", amount: 412.30 },
    ],
    
    lateCauses: [
      { cause: "Late appointment windows", count: 4, severity: "HIGH" },
      { cause: "WCH mismatch", count: 3, severity: "MED" },
      { cause: "Deadhead routing", count: 2, severity: "MED" },
    ],
    
    costLeaks: [
      { type: "Deadhead", amount: 234.50, delta: 12 },
      { type: "Fuel overspend", amount: 156.78, delta: 8 },
      { type: "Low utilization", amount: 89.00, delta: -5 },
    ],
  }), [selectedOpco, selectedBrokerAccount, opcos, brokerAccounts]);

  // Timeline data (4AM - 4PM)
  const timelineData: TimelineHour[] = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => ({
      hour: i + 4,
      demandPressure: Math.random() * 100,
      riskPressure: Math.random() * 60,
      willCallCount: Math.floor(Math.random() * 5),
      wchCount: Math.floor(Math.random() * 8),
      tightWindowCount: Math.floor(Math.random() * 3),
    }));
  }, []);

  // KPI Cards
  const kpiCards: KPICard[] = [
    {
      id: "revenue",
      title: "Revenue (Estimated)",
      value: `$${snapshot.revenueEstimate.toLocaleString()}`,
      subtext: `Δ ${snapshot.revenueDeltaPct > 0 ? "+" : ""}${snapshot.revenueDeltaPct}% vs last period`,
      trend: snapshot.revenueDeltaPct > 0 ? "up" : "down",
      icon: <DollarSign className="w-6 h-6" />,
      color: "bg-green-500",
      onClick: () => setSelectedKPIDrawer("revenue"),
    },
    {
      id: "ontime",
      title: "On-Time %",
      value: `${snapshot.onTimePct}%`,
      subtext: `Late pickups: ${snapshot.lateCount}`,
      trend: snapshot.onTimeDeltaPct > 0 ? "up" : "down",
      trendValue: `${snapshot.onTimeDeltaPct > 0 ? "+" : ""}${snapshot.onTimeDeltaPct}%`,
      icon: <Clock className="w-6 h-6" />,
      color: snapshot.onTimePct >= 95 ? "bg-green-500" : snapshot.onTimePct >= 90 ? "bg-amber-500" : "bg-red-500",
      onClick: () => { setActiveTab("late"); setSelectedKPIDrawer(null); },
    },
    {
      id: "demand_loss",
      title: "Demand Loss",
      value: snapshot.demandDataAvailable ? `${((snapshot.tripsCanceled + snapshot.tripsNoCover) / snapshot.tripsTotal * 100).toFixed(1)}%` : "—",
      subtext: snapshot.demandDataAvailable ? `No-cover: ${snapshot.tripsNoCover}` : "Demand data pending",
      icon: <XCircle className="w-6 h-6" />,
      color: "bg-red-500",
      onClick: () => { setActiveTab("loss"); setSelectedKPIDrawer(null); },
    },
    {
      id: "deadhead",
      title: "Deadhead Miles",
      value: `${snapshot.deadheadMiles}`,
      subtext: `Δ ${snapshot.deadheadDeltaMiles} mi`,
      trend: snapshot.deadheadDeltaMiles < 0 ? "up" : "down",
      icon: <Navigation className="w-6 h-6" />,
      color: "bg-amber-500",
      onClick: () => setSelectedKPIDrawer("deadhead"),
    },
    {
      id: "cashout",
      title: "Cash-Out",
      value: `$${snapshot.cashOutTotal.toLocaleString()}`,
      subtext: `Payroll $${snapshot.payrollTotal.toLocaleString()} • Fuel/Tolls $${(snapshot.fuelTotal + snapshot.tollTotal).toLocaleString()}`,
      icon: <Wallet className="w-6 h-6" />,
      color: "bg-purple-500",
      onClick: () => setSelectedKPIDrawer("cashout"),
    },
  ];

  // Workbench tabs
  const tabs = [
    { id: "loss", label: "Loss Workbench", icon: <XCircle className="w-4 h-4" /> },
    { id: "late", label: "Late Causes", icon: <Clock className="w-4 h-4" /> },
    { id: "cost", label: "Cost Leaks", icon: <DollarSign className="w-4 h-4" /> },
    { id: "fleet", label: "Fleet Readiness", icon: <Truck className="w-4 h-4" /> },
    { id: "ids", label: "IDS Impact", icon: <Zap className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sticky Top Bar */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Title + Context */}
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Owner Cockpit</h1>
              <div className="flex items-center gap-2">
                <select
                  value={selectedOpco}
                  onChange={(e) => setSelectedOpco(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1"
                >
                  <option value="all">All Companies</option>
                  {opcos?.map((opco) => (
                    <option key={opco.id} value={opco.id}>{opco.name}</option>
                  ))}
                </select>
                <select
                  value={selectedBrokerAccount}
                  onChange={(e) => setSelectedBrokerAccount(e.target.value)}
                  className="text-sm border rounded-md px-2 py-1"
                >
                  <option value="all">All Accounts</option>
                  {brokerAccounts?.map((ba) => (
                    <option key={ba.id} value={ba.id}>{ba.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Center: Date Range */}
            <div className="flex items-center gap-2">
              {DATE_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() => setDatePreset(preset.value)}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    datePreset === preset.value
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500">Last sync: {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm border rounded-md hover:bg-gray-50">
                <Download className="w-4 h-4" />
                Download PDF
              </button>
              <button
                onClick={() => setShowPackModal(true)}
                className="flex items-center gap-1 px-4 py-1.5 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600"
              >
                <FileText className="w-4 h-4" />
                Generate Weekly Pack
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Row 1: KPI Cards */}
        <div className="grid grid-cols-5 gap-4">
          {kpiCards.map((card) => (
            <button
              key={card.id}
              onClick={card.onClick}
              className="bg-white rounded-lg shadow-sm border p-4 text-left hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg ${card.color} text-white`}>
                  {card.icon}
                </div>
                {card.trend && (
                  <div className={`flex items-center text-sm ${card.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {card.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                    {card.trendValue && <span className="ml-1">{card.trendValue}</span>}
                  </div>
                )}
              </div>
              <div className="text-2xl font-bold text-gray-900">{card.value}</div>
              <div className="text-sm text-gray-500 mt-1">{card.subtext}</div>
              <div className="text-xs text-gray-400 mt-2">{card.title}</div>
            </button>
          ))}
        </div>

        {/* Row 2: Red Alerts */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            Red Alerts
          </h2>
          {snapshot.alerts.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-green-600">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-2">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="font-medium">No critical alerts</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {snapshot.alerts.slice(0, 8).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      alert.severity === "HIGH" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {alert.severity}
                    </span>
                    <span className="text-sm text-gray-900">{alert.headline}</span>
                    <span className="text-xs text-gray-500">{alert.module}</span>
                  </div>
                  <a href={alert.deepLink} className="flex items-center gap-1 text-sm text-orange-600 hover:text-orange-700">
                    Open <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Row 3: Today Timeline */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-gray-500" />
              Today Timeline (4AM - 4PM)
            </h2>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-500"></span> Demand</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"></span> Risk</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-purple-500"></span> Will-call</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"></span> WCH</span>
            </div>
          </div>
          <div className="flex gap-1">
            {timelineData.map((hour) => (
              <button
                key={hour.hour}
                onClick={() => setSelectedHour(hour.hour)}
                className={`flex-1 rounded-lg p-2 transition-colors ${
                  selectedHour === hour.hour ? "ring-2 ring-orange-500" : ""
                }`}
              >
                <div className="text-xs text-gray-500 mb-1">{hour.hour}:00</div>
                <div className="space-y-1">
                  <div className="h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500"
                      style={{ width: `${hour.demandPressure}%` }}
                    />
                  </div>
                  <div className="h-4 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-red-500"
                      style={{ width: `${hour.riskPressure}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-1 mt-1 justify-center">
                  {hour.willCallCount > 0 && (
                    <span className="w-4 h-4 text-[10px] bg-purple-100 text-purple-700 rounded flex items-center justify-center">
                      {hour.willCallCount}
                    </span>
                  )}
                  {hour.wchCount > 0 && (
                    <span className="w-4 h-4 text-[10px] bg-amber-100 text-amber-700 rounded flex items-center justify-center">
                      {hour.wchCount}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Row 4: Ops Workbench */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="border-b">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? "border-orange-500 text-orange-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-4">
            {activeTab === "loss" && <LossWorkbench snapshot={snapshot} />}
            {activeTab === "late" && <LateCauses snapshot={snapshot} />}
            {activeTab === "cost" && <CostLeaks snapshot={snapshot} />}
            {activeTab === "fleet" && <FleetReadiness snapshot={snapshot} />}
            {activeTab === "ids" && <IDSImpact snapshot={snapshot} />}
          </div>
        </div>

        {/* Row 5: AI Narrative */}
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              What to do now
            </h2>
            <div className="flex items-center gap-3">
              <div className="flex rounded-md overflow-hidden border">
                <button
                  onClick={() => setNarrativeStyle("internal")}
                  className={`px-3 py-1 text-sm ${narrativeStyle === "internal" ? "bg-purple-500 text-white" : "bg-white text-gray-700"}`}
                >
                  Internal
                </button>
                <button
                  onClick={() => setNarrativeStyle("client")}
                  className={`px-3 py-1 text-sm ${narrativeStyle === "client" ? "bg-purple-500 text-white" : "bg-white text-gray-700"}`}
                >
                  Client
                </button>
              </div>
              <button className="flex items-center gap-1 px-3 py-1.5 text-sm bg-purple-500 text-white rounded-md hover:bg-purple-600">
                <RefreshCw className="w-4 h-4" />
                Generate
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Executive Summary</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">•</span>
                  Revenue on track at ${snapshot.revenueEstimate.toLocaleString()} (+{snapshot.revenueDeltaPct}% vs baseline)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500 mt-0.5">•</span>
                  On-time at {snapshot.onTimePct}% — {snapshot.lateCount} late pickups need attention
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">•</span>
                  WCH pressure: demand exceeds supply by 2 vehicles in 10AM-12PM window
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  Deadhead down {Math.abs(snapshot.deadheadDeltaMiles)} miles vs last period
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-500 mt-0.5">•</span>
                  IDS simulation shows potential +{snapshot.idsOnTimeImprovement}% on-time improvement
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Action List</h3>
              <div className="space-y-2">
                {[
                  { owner: "Owner", action: "Review WCH capacity for tomorrow's demand" },
                  { owner: "Dispatch", action: "Reassign 3 unassigned trips in 10:00 window" },
                  { owner: "Payroll", action: "Flag V-007 fuel anomaly for driver review" },
                  { owner: "Garage", action: "Expedite V-012 repair (WCH needed)" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-700 rounded">
                      {item.owner}
                    </span>
                    <span className="text-sm text-gray-700">{item.action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t text-xs text-gray-400">
            Generated from snapshot checksum: {snapshot.generatedAt.slice(0, 10)}-{Math.random().toString(36).slice(2, 10)}
          </div>
        </div>
      </div>

      {/* Pack Generator Modal */}
      {showPackModal && (
        <PackGeneratorModal
          onClose={() => setShowPackModal(false)}
          opcos={opcos || []}
          brokerAccounts={brokerAccounts || []}
        />
      )}

      {/* KPI Drawer */}
      {selectedKPIDrawer && (
        <KPIDrawer
          type={selectedKPIDrawer}
          snapshot={snapshot}
          onClose={() => setSelectedKPIDrawer(null)}
        />
      )}
    </div>
  );
}

// Workbench Tab Components
function LossWorkbench({ snapshot }: { snapshot: any }) {
  if (!snapshot.demandDataAvailable) {
    return (
      <div className="p-8 text-center text-amber-600 bg-amber-50 rounded-lg">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
        <p className="font-medium">Demand snapshot not available yet</p>
        <p className="text-sm text-amber-500">Showing served-workload only</p>
      </div>
    );
  }

  const data = [
    { broker: "Modivcare-Sahrawi", scheduled: 85, completed: 78, canceled: 4, noShow: 2, noCover: 1, estLost: 450, topCause: "Late cancel" },
    { broker: "Modivcare-Metrix", scheduled: 71, completed: 64, canceled: 4, noShow: 2, noCover: 1, estLost: 380, topCause: "No WCH" },
  ];

  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left p-3">Broker Account</th>
          <th className="text-right p-3">Scheduled</th>
          <th className="text-right p-3">Completed</th>
          <th className="text-right p-3">Canceled</th>
          <th className="text-right p-3">No-Show</th>
          <th className="text-right p-3">No-Cover</th>
          <th className="text-right p-3">Est. $ Lost</th>
          <th className="text-left p-3">Top Cause</th>
          <th className="p-3"></th>
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="p-3 font-medium">{row.broker}</td>
            <td className="p-3 text-right">{row.scheduled}</td>
            <td className="p-3 text-right text-green-600">{row.completed}</td>
            <td className="p-3 text-right text-red-600">{row.canceled}</td>
            <td className="p-3 text-right text-amber-600">{row.noShow}</td>
            <td className="p-3 text-right text-red-600">{row.noCover}</td>
            <td className="p-3 text-right font-medium">${row.estLost}</td>
            <td className="p-3 text-gray-500">{row.topCause}</td>
            <td className="p-3">
              <button className="text-orange-600 hover:text-orange-700">View</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LateCauses({ snapshot }: { snapshot: any }) {
  return (
    <div className="space-y-4">
      <div className="h-16 bg-gray-100 rounded flex items-end px-2 gap-1">
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            className="flex-1 bg-red-400 rounded-t"
            style={{ height: `${Math.random() * 100}%` }}
          />
        ))}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">Cause</th>
            <th className="text-right p-3">Count</th>
            <th className="text-center p-3">Severity</th>
            <th className="text-left p-3">Suggested Fix</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {snapshot.lateCauses.map((cause: any, i: number) => (
            <tr key={i} className="border-t hover:bg-gray-50">
              <td className="p-3 font-medium">{cause.cause}</td>
              <td className="p-3 text-right">{cause.count}</td>
              <td className="p-3 text-center">
                <span className={`px-2 py-0.5 text-xs rounded ${
                  cause.severity === "HIGH" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {cause.severity}
                </span>
              </td>
              <td className="p-3 text-gray-500">Adjust pickup windows</td>
              <td className="p-3">
                <button className="text-orange-600 hover:text-orange-700">View Map</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CostLeaks({ snapshot }: { snapshot: any }) {
  return (
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>
          <th className="text-left p-3">Leak Type</th>
          <th className="text-right p-3">Amount</th>
          <th className="text-right p-3">Δ vs Baseline</th>
          <th className="text-left p-3">Top Driver/Vehicle</th>
          <th className="text-left p-3">Fix Suggestion</th>
          <th className="p-3"></th>
        </tr>
      </thead>
      <tbody>
        {snapshot.costLeaks.map((leak: any, i: number) => (
          <tr key={i} className="border-t hover:bg-gray-50">
            <td className="p-3 font-medium">{leak.type}</td>
            <td className="p-3 text-right">${leak.amount.toFixed(2)}</td>
            <td className={`p-3 text-right ${leak.delta > 0 ? "text-red-600" : "text-green-600"}`}>
              {leak.delta > 0 ? "+" : ""}{leak.delta}%
            </td>
            <td className="p-3 text-gray-500">V-003</td>
            <td className="p-3 text-gray-500">Optimize routing</td>
            <td className="p-3">
              <button className="text-orange-600 hover:text-orange-700">Open</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FleetReadiness({ snapshot }: { snapshot: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Active", value: `${snapshot.vehiclesActive}/${snapshot.vehiclesTotal}`, color: "green" },
          { label: "In Shop", value: snapshot.vehiclesInShop, color: "red" },
          { label: "Due Inspection", value: snapshot.vehiclesDueInspection, color: "amber" },
          { label: "WCH Ready", value: snapshot.wchReady, color: "blue" },
        ].map((stat, i) => (
          <div key={i} className={`p-3 rounded-lg bg-${stat.color}-50 border border-${stat.color}-200`}>
            <div className={`text-2xl font-bold text-${stat.color}-600`}>{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">Vehicle</th>
            <th className="text-center p-3">Status</th>
            <th className="text-right p-3">Days Down</th>
            <th className="text-left p-3">Next Due</th>
            <th className="text-left p-3">Notes</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {[
            { unit: "V-003", status: "Active", daysDown: 0, nextDue: "Jan 20", notes: "" },
            { unit: "V-007", status: "In Shop", daysDown: 2, nextDue: "—", notes: "Brake repair" },
            { unit: "V-012", status: "In Shop", daysDown: 1, nextDue: "—", notes: "WCH lift issue" },
          ].map((v, i) => (
            <tr key={i} className="border-t hover:bg-gray-50">
              <td className="p-3 font-medium">{v.unit}</td>
              <td className="p-3 text-center">
                <span className={`px-2 py-0.5 text-xs rounded ${
                  v.status === "Active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {v.status}
                </span>
              </td>
              <td className="p-3 text-right">{v.daysDown}</td>
              <td className="p-3">{v.nextDue}</td>
              <td className="p-3 text-gray-500">{v.notes}</td>
              <td className="p-3">
                <button className="text-orange-600 hover:text-orange-700">Open</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IDSImpact({ snapshot }: { snapshot: any }) {
  if (!snapshot.idsAvailable) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Zap className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>No IDS shadow runs available for this period</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "On-Time Improvement", value: `+${snapshot.idsOnTimeImprovement}%`, color: "green" },
          { label: "Deadhead Saved", value: `${snapshot.idsDeadheadSaved} mi`, color: "blue" },
          { label: "Pay Saved", value: `$${snapshot.idsPaySaved}`, color: "purple" },
          { label: "Lock Compliance", value: `${snapshot.idsLockCompliance}%`, color: "amber" },
        ].map((stat, i) => (
          <div key={i} className="p-3 rounded-lg bg-gray-50 border">
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-3">Date</th>
            <th className="text-left p-3">Shadow Run</th>
            <th className="text-right p-3">Pred On-Time</th>
            <th className="text-right p-3">Actual On-Time</th>
            <th className="text-right p-3">Deadhead Δ</th>
            <th className="text-right p-3">Pay Δ</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-t hover:bg-gray-50">
            <td className="p-3">Jan 15</td>
            <td className="p-3"><a href="/ids/shadow-runs/1" className="text-orange-600">Run #1</a></td>
            <td className="p-3 text-right">96.5%</td>
            <td className="p-3 text-right">94.2%</td>
            <td className="p-3 text-right text-green-600">-45 mi</td>
            <td className="p-3 text-right text-green-600">-$890</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Pack Generator Modal
function PackGeneratorModal({ onClose, opcos, brokerAccounts }: { onClose: () => void; opcos: any[]; brokerAccounts: any[] }) {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [sections, setSections] = useState({
    opsSummary: true,
    payroll: true,
    fuelTolls: true,
    idsCompare: true,
    fleetReadiness: true,
  });
  const [style, setStyle] = useState<"internal" | "client">("internal");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    // Simulate generation
    await new Promise(r => setTimeout(r, 2000));
    setGenerating(false);
    onClose();
    // Navigate to pack viewer
    window.location.href = "/owner/packs/1";
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Generate Weekly Pack</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="flex-1 border rounded-md px-3 py-2"
              />
              <span className="flex items-center text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="flex-1 border rounded-md px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Include Sections</label>
            <div className="space-y-2">
              {Object.entries(sections).map(([key, value]) => (
                <label key={key} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setSections({ ...sections, [key]: e.target.checked })}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm text-gray-700">
                    {key === "opsSummary" ? "Ops Summary" :
                     key === "fuelTolls" ? "Fuel/Tolls" :
                     key === "idsCompare" ? "IDS Compare" :
                     key === "fleetReadiness" ? "Fleet Readiness" :
                     key.charAt(0).toUpperCase() + key.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Output Style</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={style === "internal"}
                  onChange={() => setStyle("internal")}
                  className="border-gray-300"
                />
                <span className="text-sm text-gray-700">Internal Pack</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  checked={style === "client"}
                  onChange={() => setStyle("client")}
                  className="border-gray-300"
                />
                <span className="text-sm text-gray-700">Client Proof Pack</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-4 py-2 text-sm bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate Pack"}
          </button>
        </div>
      </div>
    </div>
  );
}

// KPI Drawer
function KPIDrawer({ type, snapshot, onClose }: { type: string; snapshot: any; onClose: () => void }) {
  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white shadow-xl z-50 overflow-y-auto">
      <div className="p-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          {type === "revenue" ? "Revenue Breakdown" :
           type === "deadhead" ? "Deadhead Analysis" :
           type === "cashout" ? "Cash-Out Details" : "Details"}
        </h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
      </div>
      <div className="p-4">
        {type === "revenue" && (
          <div className="space-y-4">
            <div className="text-3xl font-bold text-green-600">${snapshot.revenueEstimate.toLocaleString()}</div>
            <div className="space-y-2">
              {snapshot.topDrivers.map((d: any, i: number) => (
                <div key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>{d.name}</span>
                  <span className="font-medium">${d.pay.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {type === "deadhead" && (
          <div className="space-y-4">
            <div className="text-3xl font-bold text-amber-600">{snapshot.deadheadMiles} mi</div>
            <p className="text-sm text-gray-600">
              Deadhead is {snapshot.deadheadDeltaMiles < 0 ? "down" : "up"} {Math.abs(snapshot.deadheadDeltaMiles)} miles vs last period.
            </p>
            <button className="w-full py-2 bg-orange-500 text-white rounded-md">
              Open Map Replay
            </button>
          </div>
        )}
        {type === "cashout" && (
          <div className="space-y-4">
            <div className="text-3xl font-bold text-purple-600">${snapshot.cashOutTotal.toLocaleString()}</div>
            <div className="space-y-2">
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Payroll</span>
                <span className="font-medium">${snapshot.payrollTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Fuel</span>
                <span className="font-medium">${snapshot.fuelTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between p-2 bg-gray-50 rounded">
                <span>Tolls</span>
                <span className="font-medium">${snapshot.tollTotal.toLocaleString()}</span>
              </div>
            </div>
            <h4 className="font-medium mt-4">Top 10 Cost Drivers</h4>
            <div className="space-y-2">
              {snapshot.topCostDrivers.map((d: any, i: number) => (
                <div key={i} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>{d.name} <span className="text-gray-500 text-xs">({d.type})</span></span>
                  <span className="font-medium">${d.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
