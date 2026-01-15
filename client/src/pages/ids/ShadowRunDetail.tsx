import { useState, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { 
  ArrowLeft, Download, RefreshCw, GitCompare, Route, AlertTriangle, 
  Lock, DollarSign, Clock, MapPin, Users, Truck, Timer, TrendingUp,
  CheckCircle, XCircle, AlertCircle, Info
} from "lucide-react";

// Flag types per spec
type FlagType = 'LOCK_SENSITIVE' | 'ON_TIME_RISK' | 'HIGH_DEADHEAD' | 'UNUSUAL_PAY' | 'CAPACITY_RISK' | 'DATA_MISSING' | 'LOCK_VIOLATION';

const FLAG_CONFIG: Record<FlagType, { label: string; type: 'info' | 'warn' | 'danger'; color: string }> = {
  LOCK_SENSITIVE: { label: 'LOCK SENSITIVE', type: 'info', color: 'bg-blue-100 text-blue-800' },
  ON_TIME_RISK: { label: 'ON-TIME RISK', type: 'warn', color: 'bg-amber-100 text-amber-800' },
  HIGH_DEADHEAD: { label: 'HIGH DEADHEAD', type: 'warn', color: 'bg-amber-100 text-amber-800' },
  UNUSUAL_PAY: { label: 'UNUSUAL PAY', type: 'warn', color: 'bg-amber-100 text-amber-800' },
  CAPACITY_RISK: { label: 'CAPACITY RISK', type: 'warn', color: 'bg-amber-100 text-amber-800' },
  DATA_MISSING: { label: 'DATA MISSING', type: 'danger', color: 'bg-red-100 text-red-800' },
  LOCK_VIOLATION: { label: 'LOCK VIOLATION', type: 'danger', color: 'bg-red-100 text-red-800' },
};

// Reason codes per spec
const REASON_CODES = [
  'NO_WHEELCHAIR_AVAILABLE',
  'TIME_WINDOW_CONFLICT', 
  'SHIFT_END_CONSTRAINT',
  'TEMPLATE_LOCK_BLOCKED',
  'VEHICLE_UNAVAILABLE',
  'CAPACITY_CONSTRAINT',
  'DATA_INCOMPLETE',
] as const;

// Mock data for demo
const mockShadowRun = {
  id: 1,
  serviceDate: "2026-01-15",
  algorithm: { name: "Greedy Baseline", version: "1.0" },
  createdAt: "2026-01-15T13:27:21.251Z",
  createdBy: "System",
  input: { sourceType: "CSV Upload", sourceRef: "mediroute-2026-01-15.csv", sourceBatchId: "batch-001" },
  counts: {
    tripsAssigned: 25,
    tripsTotal: 25,
    tripsUnassigned: 0,
    driversConsidered: 15,
    driversUsed: 10,
    vehiclesConsidered: 15,
    vehiclesUsed: 10,
    lockedTemplates: 0,
  },
  kpis: {
    onTimePct: 100,
    lockViolations: 0,
    gapFillWins: 25,
    estimatedDeadheadMiles: 38,
    runtimeSeconds: 0.005,
  },
  flagsSummary: {
    driversWithFlags: 0,
    unassignedCritical: 0,
  },
};

const mockRoutes = [
  { driverId: "DRV-001", driverName: "John Smith", contractType: "1099", shift: "04:00–16:00", vehicleId: 1, isWheelchair: false, trips: 3, miles: 30, startTime: "11:45", endTime: "19:15", onTimePct: 100, deadheadMiles: 5, predictedPay: 60, flags: [] as FlagType[] },
  { driverId: "DRV-002", driverName: "Maria Garcia", contractType: "1099", shift: "04:00–16:00", vehicleId: 2, isWheelchair: false, trips: 3, miles: 30, startTime: "12:15", endTime: "19:30", onTimePct: 100, deadheadMiles: 5, predictedPay: 60, flags: [] as FlagType[] },
  { driverId: "DRV-003", driverName: "James Wilson", contractType: "1099", shift: "04:00–16:00", vehicleId: 3, isWheelchair: true, trips: 3, miles: 30, startTime: "12:45", endTime: "19:45", onTimePct: 100, deadheadMiles: 5, predictedPay: 60, flags: [] as FlagType[] },
  { driverId: "DRV-004", driverName: "Sarah Johnson", contractType: "1099", shift: "04:00–16:00", vehicleId: 4, isWheelchair: false, trips: 3, miles: 30, startTime: "13:00", endTime: "20:15", onTimePct: 100, deadheadMiles: 5, predictedPay: 60, flags: [] as FlagType[] },
  { driverId: "DRV-005", driverName: "Michael Brown", contractType: "1099", shift: "04:00–16:00", vehicleId: 5, isWheelchair: false, trips: 3, miles: 30, startTime: "13:15", endTime: "20:30", onTimePct: 100, deadheadMiles: 5, predictedPay: 60, flags: [] as FlagType[] },
  { driverId: "DRV-006", driverName: "Emily Davis", contractType: "1099", shift: "04:00–16:00", vehicleId: 6, isWheelchair: true, trips: 2, miles: 20, startTime: "13:45", endTime: "17:30", onTimePct: 100, deadheadMiles: 3, predictedPay: 40, flags: [] as FlagType[] },
  { driverId: "DRV-007", driverName: "Robert Miller", contractType: "1099", shift: "04:00–16:00", vehicleId: 7, isWheelchair: false, trips: 2, miles: 20, startTime: "14:00", endTime: "17:45", onTimePct: 100, deadheadMiles: 3, predictedPay: 40, flags: [] as FlagType[] },
  { driverId: "DRV-008", driverName: "Jennifer Taylor", contractType: "1099", shift: "04:00–16:00", vehicleId: 8, isWheelchair: false, trips: 2, miles: 20, startTime: "14:15", endTime: "18:15", onTimePct: 100, deadheadMiles: 3, predictedPay: 40, flags: [] as FlagType[] },
  { driverId: "DRV-009", driverName: "David Anderson", contractType: "1099", shift: "04:00–16:00", vehicleId: 9, isWheelchair: true, trips: 2, miles: 20, startTime: "14:45", endTime: "18:30", onTimePct: 100, deadheadMiles: 3, predictedPay: 40, flags: [] as FlagType[] },
  { driverId: "DRV-010", driverName: "Lisa Thomas", contractType: "1099", shift: "04:00–16:00", vehicleId: 10, isWheelchair: false, trips: 2, miles: 20, startTime: "15:00", endTime: "18:45", onTimePct: 100, deadheadMiles: 3, predictedPay: 40, flags: [] as FlagType[] },
];

const mockStops = [
  { seq: 1, type: "Pickup", tripId: "TRP-1", window: "11:45", eta: "11:45", slack: 0, lock: "Gap-Fill" },
  { seq: 2, type: "Dropoff", tripId: "TRP-1", window: "12:15", eta: "12:15", slack: null, lock: null },
  { seq: 3, type: "Pickup", tripId: "TRP-11", window: "15:15", eta: "15:15", slack: 0, lock: "Gap-Fill" },
  { seq: 4, type: "Dropoff", tripId: "TRP-11", window: "15:45", eta: "15:45", slack: null, lock: null },
  { seq: 5, type: "Pickup", tripId: "TRP-21", window: "18:45", eta: "18:45", slack: 0, lock: "Gap-Fill" },
  { seq: 6, type: "Dropoff", tripId: "TRP-21", window: "19:15", eta: "19:15", slack: null, lock: null },
];

const mockUnassignedTrips: any[] = [];
const mockLocks: any[] = [];

export default function ShadowRunDetail() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("routes");
  const [exceptionsOnly, setExceptionsOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoute, setSelectedRoute] = useState<typeof mockRoutes[0] | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  // Filters
  const [driverFilter, setDriverFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Filter routes based on Exceptions Only toggle and filters
  const filteredRoutes = useMemo(() => {
    let routes = mockRoutes;
    
    // Exceptions Only logic per spec
    if (exceptionsOnly) {
      routes = routes.filter(r => 
        r.flags.length > 0 || 
        r.onTimePct < 95 || 
        r.deadheadMiles > 10
      );
    }
    
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      routes = routes.filter(r => 
        r.driverName.toLowerCase().includes(q) ||
        r.driverId.toLowerCase().includes(q) ||
        r.vehicleId.toString().includes(q)
      );
    }
    
    // Driver filter
    if (driverFilter === "flags") {
      routes = routes.filter(r => r.flags.length > 0);
    }
    
    // Vehicle filter
    if (vehicleFilter === "wheelchair") {
      routes = routes.filter(r => r.isWheelchair);
    }
    
    // Status filter
    if (statusFilter === "on-time-risk") {
      routes = routes.filter(r => r.onTimePct < 95);
    } else if (statusFilter === "high-deadhead") {
      routes = routes.filter(r => r.deadheadMiles > 10);
    } else if (statusFilter === "lock-sensitive") {
      routes = routes.filter(r => r.flags.includes('LOCK_SENSITIVE'));
    }
    
    return routes;
  }, [exceptionsOnly, searchQuery, driverFilter, vehicleFilter, statusFilter]);

  // On-time color per spec
  const getOnTimeColor = (pct: number) => {
    if (pct >= 95) return "text-green-600 bg-green-50";
    if (pct >= 90) return "text-amber-600 bg-amber-50";
    return "text-red-600 bg-red-50";
  };

  // KPI card tint colors
  const getOnTimeKpiTint = (pct: number) => {
    if (pct >= 95) return "bg-green-50 border-green-200";
    if (pct >= 90) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const openRouteDrawer = (route: typeof mockRoutes[0]) => {
    setSelectedRoute(route);
    setDrawerOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">IDS Shadow Run</h1>
          <p className="text-muted-foreground">
            Shadow optimization results (read-only) • Service Date: {mockShadowRun.serviceDate} • Algorithm: {mockShadowRun.algorithm.name} v{mockShadowRun.algorithm.version}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation("/ids/shadow-runs")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shadow Runs
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <RefreshCw className="h-4 w-4 mr-2" />
            Re-run Shadow
          </Button>
          <Button variant="outline" disabled>
            <GitCompare className="h-4 w-4 mr-2" />
            Compare to Actual
          </Button>
        </div>
      </div>

      {/* KPI Cards Row (4 cards) */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Trips Assigned</p>
                <p className="text-3xl font-bold">{mockShadowRun.counts.tripsAssigned}</p>
                <p className="text-xs text-muted-foreground">of {mockShadowRun.counts.tripsTotal} scheduled</p>
              </div>
              <Route className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={getOnTimeKpiTint(mockShadowRun.kpis.onTimePct)}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Predicted On-Time</p>
                <p className={`text-3xl font-bold ${mockShadowRun.kpis.onTimePct >= 95 ? 'text-green-600' : mockShadowRun.kpis.onTimePct >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                  {mockShadowRun.kpis.onTimePct}%
                </p>
                <p className="text-xs text-muted-foreground">within pickup windows</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className={mockShadowRun.counts.tripsUnassigned > 0 ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-200"}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unassigned</p>
                <p className={`text-3xl font-bold ${mockShadowRun.counts.tripsUnassigned > 0 ? 'text-red-600' : ''}`}>
                  {mockShadowRun.counts.tripsUnassigned}
                </p>
                <p className="text-xs text-muted-foreground">needs dispatch review</p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${mockShadowRun.counts.tripsUnassigned > 0 ? 'text-red-500' : 'text-gray-400'}`} />
            </div>
          </CardContent>
        </Card>
        
        <Card className={mockShadowRun.kpis.lockViolations > 0 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lock Violations</p>
                <p className={`text-3xl font-bold ${mockShadowRun.kpis.lockViolations > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {mockShadowRun.kpis.lockViolations}
                </p>
                <p className="text-xs text-muted-foreground">template locks respected</p>
              </div>
              {mockShadowRun.kpis.lockViolations === 0 ? (
                <CheckCircle className="h-8 w-8 text-green-500" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini KPI Strip */}
      <div className="flex items-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span>Gap-Fill Wins: <strong className="text-green-600">+{mockShadowRun.kpis.gapFillWins}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          <span>Est. Deadhead: <strong>{mockShadowRun.kpis.estimatedDeadheadMiles} mi</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          <span>Drivers Used: <strong>{mockShadowRun.counts.driversUsed}</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4" />
          <span>Runtime: <strong>{mockShadowRun.kpis.runtimeSeconds}s</strong></span>
        </div>
      </div>

      {/* Run Summary Panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-8">
            {/* Left - Metadata */}
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Run ID</span>
                <span className="font-medium">#{mockShadowRun.id}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Service Date</span>
                <span className="font-medium">{mockShadowRun.serviceDate}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Created At</span>
                <span className="font-medium">{mockShadowRun.createdAt}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Created By</span>
                <span className="font-medium">{mockShadowRun.createdBy}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Input Source</span>
                <span className="font-medium">{mockShadowRun.input.sourceType}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Drivers</span>
                <span className="font-medium">{mockShadowRun.counts.driversUsed} / {mockShadowRun.counts.driversConsidered}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Vehicles</span>
                <span className="font-medium">{mockShadowRun.counts.vehiclesUsed} / {mockShadowRun.counts.vehiclesConsidered}</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <span className="text-muted-foreground">Runtime</span>
                <span className="font-medium">{mockShadowRun.kpis.runtimeSeconds * 1000}ms</span>
              </div>
            </div>
            
            {/* Right - Controls */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge className="bg-purple-100 text-purple-800">Shadow</Badge>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="exceptions-only" 
                    checked={exceptionsOnly} 
                    onCheckedChange={setExceptionsOnly}
                  />
                  <Label htmlFor="exceptions-only">Exceptions Only</Label>
                </div>
              </div>
              
              <Input 
                placeholder="Search driver, trip id, template id…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  <Lock className="h-3 w-3 mr-1" />
                  LOCKED ROUTES: {mockShadowRun.counts.lockedTemplates}
                </Badge>
                <Badge variant="outline" className="text-amber-600 border-amber-300">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  ROUTES WITH FLAGS: {mockShadowRun.flagsSummary.driversWithFlags}
                </Badge>
                <Badge variant="outline" className="text-red-600 border-red-300">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  UNASSIGNED CRITICAL: {mockShadowRun.flagsSummary.unassignedCritical}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="unassigned" id="unassigned-tab" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Unassigned ({mockUnassignedTrips.length})
          </TabsTrigger>
          <TabsTrigger value="locks" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Template Locks
          </TabsTrigger>
          <TabsTrigger value="pay" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Predicted Pay
          </TabsTrigger>
        </TabsList>

        {/* Routes Tab */}
        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Routes</CardTitle>
                  <CardDescription>Driver route assignments with optimization results</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Routes CSV
                </Button>
              </div>
              
              {/* Filters Row per spec */}
              <div className="flex items-center gap-4 mt-4">
                <Input 
                  placeholder="Search by driver, vehicle, trip…"
                  className="w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Select value={driverFilter} onValueChange={setDriverFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Drivers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drivers</SelectItem>
                    <SelectItem value="flags">Only With Flags</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Vehicles" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vehicles</SelectItem>
                    <SelectItem value="wheelchair">Wheelchair Only</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="on-time-risk">On-Time Risk</SelectItem>
                    <SelectItem value="high-deadhead">High Deadhead</SelectItem>
                    <SelectItem value="lock-sensitive">Lock Sensitive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[220px] py-3 font-medium">Driver</th>
                      <th className="w-[110px] py-3 font-medium">Vehicle</th>
                      <th className="w-[70px] py-3 font-medium text-right">Trips</th>
                      <th className="w-[110px] py-3 font-medium text-right">Miles (est.)</th>
                      <th className="w-[130px] py-3 font-medium">Start–End</th>
                      <th className="w-[100px] py-3 font-medium text-center">On-Time</th>
                      <th className="w-[130px] py-3 font-medium text-right">Deadhead</th>
                      <th className="w-[140px] py-3 font-medium text-right">Pred Pay</th>
                      <th className="w-[240px] py-3 font-medium">Flags</th>
                      <th className="w-[90px] py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="py-8 text-center text-muted-foreground">
                          {exceptionsOnly 
                            ? 'No routes with exceptions. Toggle "Exceptions Only" off to see all routes.'
                            : 'No routes found matching your filters.'}
                        </td>
                      </tr>
                    ) : (
                      filteredRoutes.map((route) => (
                        <tr key={route.driverId} className="border-b hover:bg-muted/50 cursor-pointer" onClick={() => openRouteDrawer(route)}>
                          <td className="w-[220px] py-3">
                            <div>
                              <div className="font-medium">{route.driverName}</div>
                              <div className="text-xs text-muted-foreground">
                                {route.driverId} • {route.contractType} • {route.shift}
                              </div>
                            </div>
                          </td>
                          <td className="w-[110px] py-3">
                            <div className="flex items-center gap-2">
                              <span>#{route.vehicleId}</span>
                              {route.isWheelchair && (
                                <Badge className="bg-purple-100 text-purple-800 text-xs">WC</Badge>
                              )}
                            </div>
                          </td>
                          <td className="w-[70px] py-3 text-right">{route.trips}</td>
                          <td className="w-[110px] py-3 text-right">{route.miles}</td>
                          <td className="w-[130px] py-3">{route.startTime} – {route.endTime}</td>
                          <td className="w-[100px] py-3 text-center">
                            <Badge className={getOnTimeColor(route.onTimePct)}>
                              {route.onTimePct}%
                            </Badge>
                          </td>
                          <td className="w-[130px] py-3 text-right">{route.deadheadMiles} mi</td>
                          <td className="w-[140px] py-3 text-right font-semibold text-green-600">
                            ${route.predictedPay.toFixed(2)}
                          </td>
                          <td className="w-[240px] py-3">
                            <div className="flex flex-wrap gap-1">
                              {route.flags.map((flag) => (
                                <Badge key={flag} className={`text-xs ${FLAG_CONFIG[flag].color}`}>
                                  {FLAG_CONFIG[flag].label}
                                </Badge>
                              ))}
                            </div>
                          </td>
                          <td className="w-[90px] py-3">
                            <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openRouteDrawer(route); }}>
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unassigned Tab */}
        <TabsContent value="unassigned">
          <Card>
            <CardHeader>
              <CardTitle>Unassigned Trips</CardTitle>
              <CardDescription>Trips that could not be assigned - exceptions workbench</CardDescription>
            </CardHeader>
            <CardContent>
              {mockUnassignedTrips.length === 0 ? (
                <div className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">All Trips Assigned</h3>
                  <p className="text-muted-foreground">No unassigned trips in this shadow run.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="w-[140px] py-3 font-medium">Trip ID</th>
                        <th className="w-[110px] py-3 font-medium">Mobility</th>
                        <th className="w-[140px] py-3 font-medium">Pickup Window</th>
                        <th className="w-[220px] py-3 font-medium">Pickup</th>
                        <th className="w-[220px] py-3 font-medium">Dropoff</th>
                        <th className="w-[220px] py-3 font-medium">Reason</th>
                        <th className="w-[220px] py-3 font-medium">Suggested Fix</th>
                        <th className="w-[90px] py-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Unassigned trips would render here */}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Template Locks Tab */}
        <TabsContent value="locks">
          <Card>
            <CardHeader>
              <CardTitle>Template Locks</CardTitle>
              <CardDescription>Trust layer - driver/trip assignments that must be respected</CardDescription>
            </CardHeader>
            <CardContent>
              {mockShadowRun.kpis.lockViolations > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 flex items-center gap-2 text-red-800">
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Lock violations must be 0 before production pilot.</span>
                </div>
              )}
              
              {mockLocks.length === 0 ? (
                <div className="py-12 text-center">
                  <Lock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Template Locks</h3>
                  <p className="text-muted-foreground">No template locks defined for this shadow run.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="w-[140px] py-3 font-medium">Template ID</th>
                        <th className="w-[220px] py-3 font-medium">Driver</th>
                        <th className="w-[110px] py-3 font-medium">Lock Type</th>
                        <th className="w-[110px] py-3 font-medium">Trips Locked</th>
                        <th className="w-[160px] py-3 font-medium">Source</th>
                        <th className="w-[320px] py-3 font-medium">Notes</th>
                        <th className="w-[120px] py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Locks would render here */}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Predicted Pay Tab */}
        <TabsContent value="pay">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Predicted Pay</CardTitle>
                  <CardDescription>Driver earnings based on optimized routes - Payroll parity</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export Pay CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="w-[220px] py-3 font-medium">Driver</th>
                      <th className="w-[70px] py-3 font-medium text-right">Trips</th>
                      <th className="w-[110px] py-3 font-medium text-right">Miles</th>
                      <th className="w-[140px] py-3 font-medium">Rate Rule</th>
                      <th className="w-[120px] py-3 font-medium text-right">Gross</th>
                      <th className="w-[120px] py-3 font-medium text-right">Adjustments</th>
                      <th className="w-[120px] py-3 font-medium text-right">Deductions</th>
                      <th className="w-[130px] py-3 font-medium text-right">Net</th>
                      <th className="w-[220px] py-3 font-medium">Flags</th>
                      <th className="w-[90px] py-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockRoutes.map((route) => (
                      <tr key={route.driverId} className="border-b hover:bg-muted/50">
                        <td className="w-[220px] py-3">
                          <div>
                            <div className="font-medium">{route.driverName}</div>
                            <div className="text-xs text-muted-foreground">
                              {route.driverId} • {route.contractType}
                            </div>
                          </div>
                        </td>
                        <td className="w-[70px] py-3 text-right">{route.trips}</td>
                        <td className="w-[110px] py-3 text-right">{route.miles}</td>
                        <td className="w-[140px] py-3">$2.00/mi</td>
                        <td className="w-[120px] py-3 text-right">${route.predictedPay.toFixed(2)}</td>
                        <td className="w-[120px] py-3 text-right text-green-600">$0.00</td>
                        <td className="w-[120px] py-3 text-right text-red-600">$0.00</td>
                        <td className="w-[130px] py-3 text-right font-bold text-green-600">
                          ${route.predictedPay.toFixed(2)}
                        </td>
                        <td className="w-[220px] py-3">
                          <div className="flex flex-wrap gap-1">
                            {route.flags.filter(f => f === 'UNUSUAL_PAY').map((flag) => (
                              <Badge key={flag} className={`text-xs ${FLAG_CONFIG[flag].color}`}>
                                {FLAG_CONFIG[flag].label}
                              </Badge>
                            ))}
                          </div>
                        </td>
                        <td className="w-[90px] py-3">
                          <Button variant="ghost" size="sm">View</Button>
                        </td>
                      </tr>
                    ))}
                    {/* Total row */}
                    <tr className="bg-muted/50 font-semibold">
                      <td className="py-3">Total ({mockRoutes.length} drivers)</td>
                      <td className="py-3 text-right">{mockRoutes.reduce((sum, r) => sum + r.trips, 0)}</td>
                      <td className="py-3 text-right">{mockRoutes.reduce((sum, r) => sum + r.miles, 0)}</td>
                      <td className="py-3"></td>
                      <td className="py-3 text-right">${mockRoutes.reduce((sum, r) => sum + r.predictedPay, 0).toFixed(2)}</td>
                      <td className="py-3 text-right text-green-600">$0.00</td>
                      <td className="py-3 text-right text-red-600">$0.00</td>
                      <td className="py-3 text-right text-green-600">${mockRoutes.reduce((sum, r) => sum + r.predictedPay, 0).toFixed(2)}</td>
                      <td className="py-3"></td>
                      <td className="py-3"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Route Detail Drawer - 520px per spec */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px]">
          <SheetHeader>
            <SheetTitle>Route — {selectedRoute?.driverName} (Vehicle #{selectedRoute?.vehicleId})</SheetTitle>
            <SheetDescription>Detailed route information and stop timeline</SheetDescription>
          </SheetHeader>
          
          {selectedRoute && (
            <div className="mt-6 space-y-6">
              {/* Mini KPI Cards (3) */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">On-Time %</p>
                    <p className={`text-xl font-bold ${selectedRoute.onTimePct >= 95 ? 'text-green-600' : selectedRoute.onTimePct >= 90 ? 'text-amber-600' : 'text-red-600'}`}>
                      {selectedRoute.onTimePct}%
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Deadhead (est.)</p>
                    <p className="text-xl font-bold">{selectedRoute.deadheadMiles} mi</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <p className="text-xs text-muted-foreground">Predicted Pay</p>
                    <p className="text-xl font-bold text-green-600">${selectedRoute.predictedPay.toFixed(2)}</p>
                  </CardContent>
                </Card>
              </div>
              
              {/* Stops Timeline Table */}
              <div>
                <h4 className="font-medium mb-3">Stops Timeline</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="w-[50px] py-2 font-medium">Seq</th>
                        <th className="w-[90px] py-2 font-medium">Type</th>
                        <th className="w-[140px] py-2 font-medium">Trip</th>
                        <th className="w-[140px] py-2 font-medium">Window</th>
                        <th className="w-[90px] py-2 font-medium">ETA</th>
                        <th className="w-[80px] py-2 font-medium">Slack</th>
                        <th className="w-[120px] py-2 font-medium">Lock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockStops.map((stop) => (
                        <tr key={stop.seq} className="border-b">
                          <td className="w-[50px] py-2">{stop.seq}</td>
                          <td className="w-[90px] py-2">
                            <Badge className={stop.type === 'Pickup' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                              {stop.type}
                            </Badge>
                          </td>
                          <td className="w-[140px] py-2">{stop.tripId}</td>
                          <td className="w-[140px] py-2">{stop.window}</td>
                          <td className="w-[90px] py-2">{stop.eta}</td>
                          <td className="w-[80px] py-2">{stop.slack !== null ? stop.slack : '—'}</td>
                          <td className="w-[120px] py-2">
                            {stop.lock ? (
                              <Badge variant="outline" className="text-xs">{stop.lock}</Badge>
                            ) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Issues Box - only if issues exist */}
              {selectedRoute.flags.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-800 mb-2">Issues</h4>
                  <ul className="text-sm text-amber-700 space-y-1">
                    {selectedRoute.flags.map((flag) => (
                      <li key={flag} className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {FLAG_CONFIG[flag].label}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <Button variant="outline" className="w-full" onClick={() => setDrawerOpen(false)}>
                Close
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
