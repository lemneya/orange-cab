import { useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  ArrowLeft,
  Clock,
  Users,
  Truck,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Route,
  Shield,
  Download,
  RefreshCw,
  Search,
  Lock,
  AlertCircle,
  Timer,
  ChevronRight,
  MapPin
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface RouteDrawerData {
  driverId: number;
  driverName: string;
  vehicleId: number;
  totalTrips: number;
  totalMiles: number;
  totalHours: number;
  predictedEarnings: number;
  onTimePercentage: number;
  deadheadMiles: number;
  assignments: Array<{
    tripId: number;
    routeOrder: number;
    predictedPickupTime: string;
    predictedDropoffTime: string;
    predictedArrivalMinutes: number;
    isGapFill: boolean;
    mobilityType?: string;
  }>;
}

interface UnassignedDrawerData {
  tripId: number;
  pickupWindow: string;
  pickupLocation: string;
  dropoffLocation: string;
  mobilityType: string;
  reason: string;
  suggestedDrivers?: string[];
}

interface PayDrawerData {
  driverId: number;
  driverName: string;
  trips: number;
  miles: number;
  rateRule: string;
  basePay: number;
  bonuses: number;
  deductions: number;
  netPay: number;
}

export default function ShadowRunDetail() {
  const [, params] = useRoute("/ids/shadow-runs/:id");
  const [, setLocation] = useLocation();
  
  const runId = params?.id ? parseInt(params.id, 10) : 0;
  
  // State for filters and toggles - Default to Exceptions Only ON per blueprint
  const [exceptionsOnly, setExceptionsOnly] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Drawer states
  const [routeDrawerOpen, setRouteDrawerOpen] = useState(false);
  const [routeDrawerData, setRouteDrawerData] = useState<RouteDrawerData | null>(null);
  const [unassignedDrawerOpen, setUnassignedDrawerOpen] = useState(false);
  const [unassignedDrawerData, setUnassignedDrawerData] = useState<UnassignedDrawerData | null>(null);
  const [payDrawerOpen, setPayDrawerOpen] = useState(false);
  const [payDrawerData, setPayDrawerData] = useState<PayDrawerData | null>(null);
  
  const { data: shadowRun, isLoading } = trpc.ids.getShadowRun.useQuery(
    { id: runId },
    { enabled: runId > 0 }
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading shadow run...</div>
      </div>
    );
  }

  if (!shadowRun) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-muted-foreground">Shadow run not found</div>
        <Button variant="outline" onClick={() => setLocation("/ids/shadow-runs")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Shadow Runs
        </Button>
      </div>
    );
  }

  const result = shadowRun.result;
  const summary = result?.summary;
  const routes = result?.routes || [];
  const unassignedTripIds = result?.unassignedTripIds || [];
  
  // Calculate derived metrics
  const totalScheduled = summary?.totalTrips || 0;
  const assignedTrips = summary?.assignedTrips || 0;
  const unassignedCount = unassignedTripIds.length;
  const onTimePercentage = Math.round(summary?.averageOnTimePercentage || 0);
  const lockViolations = shadowRun.lockViolations || 0;
  
  // Calculate estimated deadhead (15% of total miles as estimate)
  const totalMiles = routes.reduce((sum, r) => sum + r.totalMiles, 0);
  const estimatedDeadhead = Math.round(totalMiles * 0.15);
  
  // Mock driver names for display
  const driverNames = ['John Smith', 'Maria Garcia', 'James Wilson', 'Sarah Johnson', 'Michael Brown', 
                       'Emily Davis', 'Robert Miller', 'Jennifer Taylor', 'David Anderson', 'Lisa Thomas'];
  
  // Filter routes based on exceptions only and search
  const filteredRoutes = routes.filter(route => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const driverName = driverNames[(route.driverId - 1) % driverNames.length].toLowerCase();
      if (!route.driverId.toString().includes(query) && 
          !route.vehicleId.toString().includes(query) &&
          !driverName.includes(query)) {
        return false;
      }
    }
    if (exceptionsOnly) {
      // Show only routes with flags
      const hasFlags = route.onTimePercentage < 95 || 
                       route.totalMiles > 100 ||
                       route.templateTrips > 0;
      return hasFlags;
    }
    return true;
  });

  // Mock template locks data
  const templateLocks = routes.flatMap(route => 
    route.assignments
      .filter(a => a.isGapFill === false && route.templateTrips > 0)
      .slice(0, route.templateTrips)
      .map(a => ({
        templateId: `TPL-${a.tripId}`,
        driverId: route.driverId,
        driverName: driverNames[(route.driverId - 1) % driverNames.length],
        tripsLocked: 1,
        lockType: 'Hard' as const,
        source: 'Dispatcher' as const,
        notes: 'Regular route assignment',
        status: 'Respected' as const
      }))
  );

  // Unassigned trip reasons (controlled vocabulary)
  const unassignedReasons = [
    'No available wheelchair unit',
    'Time window conflict',
    'Driver shift end constraint',
    'Template lock prevents assignment',
    'Vehicle unavailable (maintenance/lot)',
    'Insufficient capacity'
  ];

  const openRouteDrawer = (route: typeof routes[0]) => {
    const deadhead = Math.round(route.totalMiles * 0.15);
    setRouteDrawerData({
      driverId: route.driverId,
      driverName: driverNames[(route.driverId - 1) % driverNames.length],
      vehicleId: route.vehicleId,
      totalTrips: route.totalTrips,
      totalMiles: route.totalMiles,
      totalHours: route.totalHours,
      predictedEarnings: route.predictedEarnings,
      onTimePercentage: route.onTimePercentage,
      deadheadMiles: deadhead,
      assignments: route.assignments.map(a => ({
        tripId: a.tripId,
        routeOrder: a.routeOrder,
        predictedPickupTime: a.predictedPickupTime,
        predictedDropoffTime: a.predictedDropoffTime,
        predictedArrivalMinutes: a.predictedArrivalMinutes,
        isGapFill: a.isGapFill,
        mobilityType: 'Standard'
      }))
    });
    setRouteDrawerOpen(true);
  };

  const openUnassignedDrawer = (tripId: number, index: number) => {
    setUnassignedDrawerData({
      tripId,
      pickupWindow: '08:00 - 08:30',
      pickupLocation: '123 Main St, Arlington VA',
      dropoffLocation: '456 Oak Ave, Falls Church VA',
      mobilityType: index % 3 === 0 ? 'Wheelchair' : 'Standard',
      reason: unassignedReasons[index % unassignedReasons.length],
      suggestedDrivers: ['John Smith (DRV-003)', 'Maria Garcia (DRV-007)', 'James Wilson (DRV-012)']
    });
    setUnassignedDrawerOpen(true);
  };

  const openPayDrawer = (route: typeof routes[0]) => {
    setPayDrawerData({
      driverId: route.driverId,
      driverName: driverNames[(route.driverId - 1) % driverNames.length],
      trips: route.totalTrips,
      miles: route.totalMiles,
      rateRule: 'per-mile',
      basePay: route.totalMiles * 2,
      bonuses: route.earningsBreakdown?.bonuses || 0,
      deductions: route.earningsBreakdown?.deductions || 0,
      netPay: route.predictedEarnings
    });
    setPayDrawerOpen(true);
  };

  // On-time percentage color coding
  const getOnTimeColor = (pct: number) => {
    if (pct >= 95) return 'bg-green-100 text-green-700';
    if (pct >= 90) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  return (
    <div className="space-y-6">
      {/* 0) Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IDS Shadow Run</h1>
          <p className="text-slate-500 mt-1">
            Shadow optimization results (read-only) • Service Date: {shadowRun.runDate} • Algorithm: Greedy Baseline
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setLocation("/ids/shadow-runs")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Shadow Runs
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <RefreshCw className="mr-2 h-4 w-4" />
            Re-run Shadow
          </Button>
          <Button variant="outline" disabled>
            Compare to Actual
          </Button>
        </div>
      </div>

      {/* 1) KPI Cards Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trips Assigned</CardTitle>
            <Route className="h-5 w-5 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{assignedTrips}</div>
            <p className="text-xs text-slate-500">of {totalScheduled} scheduled</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted On-Time</CardTitle>
            <Clock className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{onTimePercentage}%</div>
            <p className="text-xs text-slate-500">within pickup windows</p>
          </CardContent>
        </Card>

        <Card 
          className={`bg-gradient-to-br cursor-pointer transition-colors ${
            unassignedCount > 0 
              ? 'from-red-50 to-white dark:from-red-950/20 hover:from-red-100' 
              : 'from-slate-50 to-white dark:from-slate-950/20'
          }`}
          onClick={() => document.getElementById('unassigned-tab')?.click()}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <AlertTriangle className={`h-5 w-5 ${unassignedCount > 0 ? 'text-red-500' : 'text-slate-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${unassignedCount > 0 ? 'text-red-600' : ''}`}>
              {unassignedCount}
            </div>
            <p className="text-xs text-slate-500">needs dispatch review</p>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${
          lockViolations > 0 
            ? 'from-red-100 to-red-50 dark:from-red-950/40 border-red-300' 
            : 'from-emerald-50 to-white dark:from-emerald-950/20'
        }`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lock Violations</CardTitle>
            <Shield className={`h-5 w-5 ${lockViolations > 0 ? 'text-red-500' : 'text-emerald-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${lockViolations > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {lockViolations}
            </div>
            <p className="text-xs text-slate-500">template locks respected</p>
          </CardContent>
        </Card>
      </div>

      {/* Mini KPI Strip */}
      <div className="flex items-center gap-6 px-4 py-2 bg-slate-50 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-slate-500">Gap-Fill Wins:</span>
          <span className="font-semibold text-green-600">+{summary?.gapFillWins || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-slate-500" />
          <span className="text-slate-500">Est. Deadhead:</span>
          <span className="font-semibold">{estimatedDeadhead} mi</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-500" />
          <span className="text-slate-500">Drivers Used:</span>
          <span className="font-semibold">{routes.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-slate-500" />
          <span className="text-slate-500">Runtime:</span>
          <span className="font-semibold">{(result?.solveTimeMs || 0) / 1000}s</span>
        </div>
      </div>

      {/* 2) Run Summary Panel */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left column - metadata */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-slate-500">Run ID</div>
                <div className="font-medium">#{shadowRun.id}</div>
                <div className="text-slate-500">Service Date</div>
                <div className="font-medium">{shadowRun.runDate}</div>
                <div className="text-slate-500">Created At</div>
                <div className="font-medium">{shadowRun.runTimestamp}</div>
                <div className="text-slate-500">Created By</div>
                <div className="font-medium">System</div>
                <div className="text-slate-500">Input Source</div>
                <div className="font-medium">CSV Upload</div>
                <div className="text-slate-500">Driver / Vehicle / Trip Count</div>
                <div className="font-medium">{shadowRun.inputDriversCount} / {routes.length} / {shadowRun.inputTripsCount}</div>
                <div className="text-slate-500">Runtime</div>
                <div className="font-medium">{result?.solveTimeMs || 0}ms</div>
              </div>
            </div>

            {/* Right column - controls + status */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Shadow</Badge>
                <div className="flex items-center gap-2">
                  <Switch 
                    id="exceptions-only" 
                    checked={exceptionsOnly}
                    onCheckedChange={setExceptionsOnly}
                  />
                  <Label htmlFor="exceptions-only" className="text-sm">Exceptions Only</Label>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder="Search driver, trip id, template id…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-purple-50 text-purple-700">
                  <Lock className="h-3 w-3 mr-1" />
                  LOCKED ROUTES: {templateLocks.length}
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  LOW ON-TIME: {routes.filter(r => r.onTimePercentage < 95).length} drivers
                </Badge>
                <Badge variant="outline" className="bg-orange-50 text-orange-700">
                  <Truck className="h-3 w-3 mr-1" />
                  HIGH DEADHEAD: {routes.filter(r => r.totalMiles > 100).length} drivers
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 3) Main Content Tabs */}
      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Routes
          </TabsTrigger>
          <TabsTrigger value="unassigned" id="unassigned-tab" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Unassigned ({unassignedCount})
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

        {/* Tab A - Routes */}
        <TabsContent value="routes">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Routes</h3>
                <p className="text-sm text-slate-500">Driver route assignments with optimization results</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Routes CSV
              </Button>
            </div>

            {/* Routes Table - Exact Payroll styling */}
            <div className="rounded-xl border bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full">
                  <thead className="border-b bg-white">
                    <tr className="h-11 text-xs text-slate-500">
                      <th className="px-3 text-left w-[220px] font-medium">Driver</th>
                      <th className="px-3 text-left w-[110px] font-medium">Vehicle</th>
                      <th className="px-3 text-left w-[70px] font-medium">Trips</th>
                      <th className="px-3 text-left w-[110px] font-medium">Miles (est.)</th>
                      <th className="px-3 text-left w-[130px] font-medium">Start–End</th>
                      <th className="px-3 text-left w-[100px] font-medium">On-Time</th>
                      <th className="px-3 text-left w-[130px] font-medium">Deadhead</th>
                      <th className="px-3 text-left w-[140px] font-medium">Pred Pay</th>
                      <th className="px-3 text-left w-[240px] font-medium">Flags</th>
                      <th className="px-3 text-right w-[90px] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-3 py-8 text-center text-slate-500">
                          {exceptionsOnly ? 'No routes with exceptions. Toggle "Exceptions Only" off to see all routes.' : 'No routes found.'}
                        </td>
                      </tr>
                    ) : (
                      filteredRoutes.map((route) => {
                        const driverName = driverNames[(route.driverId - 1) % driverNames.length];
                        const hasOnTimeRisk = route.onTimePercentage < 95;
                        const hasHighDeadhead = route.totalMiles > 100;
                        const hasLocks = route.templateTrips > 0;
                        const deadhead = Math.round(route.totalMiles * 0.15);
                        const isWheelchair = route.vehicleId % 3 === 0;
                        
                        return (
                          <tr 
                            key={route.driverId} 
                            className="h-12 text-sm text-slate-900 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => openRouteDrawer(route)}
                          >
                            {/* Driver cell (two-line) */}
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <div className="min-w-0">
                                  <div className="font-medium truncate">{driverName}</div>
                                  <div className="text-xs text-slate-500 truncate">DRV-{String(route.driverId).padStart(3, '0')} • 1099 • 04:00–16:00</div>
                                </div>
                              </div>
                            </td>
                            {/* Vehicle cell (unit + mobility pill) */}
                            <td className="px-3 py-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">#{route.vehicleId}</span>
                                {isWheelchair && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-purple-100 text-purple-700">WC</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2">{route.totalTrips}</td>
                            <td className="px-3 py-2">{route.totalMiles}</td>
                            <td className="px-3 py-2">
                              {route.assignments[0]?.predictedPickupTime?.split('T')[1]?.substring(0, 5) || 'N/A'} – 
                              {route.assignments[route.assignments.length - 1]?.predictedDropoffTime?.split('T')[1]?.substring(0, 5) || 'N/A'}
                            </td>
                            {/* On-time pill with color coding */}
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${getOnTimeColor(route.onTimePercentage)}`}>
                                {route.onTimePercentage}%
                              </span>
                            </td>
                            <td className="px-3 py-2">{deadhead} mi</td>
                            <td className="px-3 py-2 font-semibold text-green-600">${route.predictedEarnings.toFixed(2)}</td>
                            {/* Flags cell */}
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-1 max-h-[40px] overflow-hidden">
                                {hasLocks && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">Lock-Sensitive</span>
                                )}
                                {hasOnTimeRisk && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">On-Time Risk</span>
                                )}
                                {hasHighDeadhead && (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-orange-100 text-orange-700">High Deadhead</span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button className="text-sm font-medium text-slate-700 hover:text-slate-900">View</button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Tab B - Unassigned Trips */}
        <TabsContent value="unassigned">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Unassigned Trips</h3>
                <p className="text-sm text-slate-500">Trips that could not be assigned - requires dispatch review</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Unassigned CSV
              </Button>
            </div>

            {unassignedTripIds.length === 0 ? (
              <div className="rounded-xl border bg-white p-12 text-center">
                <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">All trips assigned!</p>
                <p className="text-slate-500">No unassigned trips in this shadow run.</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full">
                    <thead className="border-b bg-white">
                      <tr className="h-11 text-xs text-slate-500">
                        <th className="px-3 text-left w-[140px] font-medium">Trip ID</th>
                        <th className="px-3 text-left w-[110px] font-medium">Mobility</th>
                        <th className="px-3 text-left w-[140px] font-medium">Pickup Window</th>
                        <th className="px-3 text-left w-[220px] font-medium">Pickup</th>
                        <th className="px-3 text-left w-[220px] font-medium">Dropoff</th>
                        <th className="px-3 text-left w-[220px] font-medium">Reason</th>
                        <th className="px-3 text-left w-[220px] font-medium">Suggested Fix</th>
                        <th className="px-3 text-right w-[90px] font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unassignedTripIds.map((tripId, index) => {
                        const reason = unassignedReasons[index % unassignedReasons.length];
                        const isWheelchair = reason.includes('wheelchair');
                        return (
                          <tr 
                            key={tripId}
                            className="h-12 text-sm text-slate-900 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                            onClick={() => openUnassignedDrawer(tripId, index)}
                          >
                            <td className="px-3 py-2 font-medium">TRP-{tripId}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded-full text-xs ${isWheelchair ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                                {isWheelchair ? 'Wheelchair' : 'Standard'}
                              </span>
                            </td>
                            <td className="px-3 py-2">08:00 – 08:30</td>
                            <td className="px-3 py-2 truncate max-w-[220px]">123 Main St, Arlington VA</td>
                            <td className="px-3 py-2 truncate max-w-[220px]">456 Oak Ave, Falls Church VA</td>
                            <td className="px-3 py-2">
                              <span className="text-red-600">{reason}</span>
                            </td>
                            <td className="px-3 py-2">
                              <span className="text-blue-600">Try Driver #3</span>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <button className="text-sm font-medium text-slate-700 hover:text-slate-900">View</button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab C - Template Locks */}
        <TabsContent value="locks">
          <div className="space-y-4">
            {lockViolations > 0 && (
              <div className="bg-red-100 border border-red-200 rounded-lg px-4 py-3">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Lock violations must be 0 before any production pilot.</span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Template Locks</h3>
                <p className="text-sm text-slate-500">Driver-trip locks that must be respected by optimization</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Locks CSV
              </Button>
            </div>

            {templateLocks.length === 0 ? (
              <div className="rounded-xl border bg-white p-12 text-center">
                <Lock className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">No template locks defined for this run</p>
              </div>
            ) : (
              <div className="rounded-xl border bg-white overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full">
                    <thead className="border-b bg-white">
                      <tr className="h-11 text-xs text-slate-500">
                        <th className="px-3 text-left w-[140px] font-medium">Template ID</th>
                        <th className="px-3 text-left w-[220px] font-medium">Driver</th>
                        <th className="px-3 text-left w-[110px] font-medium">Lock Type</th>
                        <th className="px-3 text-left w-[110px] font-medium">Trips Locked</th>
                        <th className="px-3 text-left w-[160px] font-medium">Source</th>
                        <th className="px-3 text-left w-[320px] font-medium">Notes</th>
                        <th className="px-3 text-left w-[120px] font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {templateLocks.map((lock, index) => (
                        <tr key={index} className="h-12 text-sm text-slate-900 hover:bg-slate-50 border-b last:border-b-0">
                          <td className="px-3 py-2 font-medium">{lock.templateId}</td>
                          <td className="px-3 py-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{lock.driverName}</div>
                              <div className="text-xs text-slate-500">DRV-{String(lock.driverId).padStart(3, '0')}</div>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${lock.lockType === 'Hard' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
                              {lock.lockType}
                            </span>
                          </td>
                          <td className="px-3 py-2">{lock.tripsLocked}</td>
                          <td className="px-3 py-2">{lock.source}</td>
                          <td className="px-3 py-2 text-slate-500 truncate max-w-[320px]">{lock.notes}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs ${lock.status === 'Respected' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {lock.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab D - Predicted Pay (Payroll parity) */}
        <TabsContent value="pay">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Predicted Driver Pay</h3>
                <p className="text-sm text-slate-500">Estimated earnings based on shadow optimization</p>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Predicted Pay CSV
              </Button>
            </div>

            <div className="rounded-xl border bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full">
                  <thead className="border-b bg-white">
                    <tr className="h-11 text-xs text-slate-500">
                      <th className="px-3 text-left w-[220px] font-medium">Driver</th>
                      <th className="px-3 text-left w-[70px] font-medium">Trips</th>
                      <th className="px-3 text-left w-[110px] font-medium">Miles</th>
                      <th className="px-3 text-left w-[140px] font-medium">Rate Rule</th>
                      <th className="px-3 text-left w-[120px] font-medium">Gross (pred)</th>
                      <th className="px-3 text-left w-[120px] font-medium">Adjustments</th>
                      <th className="px-3 text-left w-[120px] font-medium">Deductions</th>
                      <th className="px-3 text-left w-[130px] font-medium">Net (pred)</th>
                      <th className="px-3 text-left w-[220px] font-medium">Flags</th>
                      <th className="px-3 text-right w-[90px] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {routes.map((route) => {
                      const driverName = driverNames[(route.driverId - 1) % driverNames.length];
                      const hasUnusualPay = route.predictedEarnings > 100 || route.predictedEarnings < 20;
                      const gross = route.earningsBreakdown?.baseEarnings || route.totalMiles * 2;
                      const adjustments = route.earningsBreakdown?.bonuses || 0;
                      const deductions = route.earningsBreakdown?.deductions || 0;
                      
                      return (
                        <tr 
                          key={route.driverId}
                          className="h-12 text-sm text-slate-900 hover:bg-slate-50 cursor-pointer border-b last:border-b-0"
                          onClick={() => openPayDrawer(route)}
                        >
                          <td className="px-3 py-2">
                            <div className="min-w-0">
                              <div className="font-medium truncate">{driverName}</div>
                              <div className="text-xs text-slate-500">DRV-{String(route.driverId).padStart(3, '0')}</div>
                            </div>
                          </td>
                          <td className="px-3 py-2">{route.totalTrips}</td>
                          <td className="px-3 py-2">{route.totalMiles}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">per-mile</span>
                          </td>
                          <td className="px-3 py-2">${gross.toFixed(2)}</td>
                          <td className="px-3 py-2 text-green-600">+${adjustments.toFixed(2)}</td>
                          <td className="px-3 py-2 text-red-600">-${deductions.toFixed(2)}</td>
                          <td className="px-3 py-2 font-semibold">${route.predictedEarnings.toFixed(2)}</td>
                          <td className="px-3 py-2">
                            <div className="flex flex-wrap gap-1 max-h-[40px] overflow-hidden">
                              {hasUnusualPay && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700">Unusual Pay</span>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button className="text-sm font-medium text-slate-700 hover:text-slate-900">View</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Row */}
            <div className="flex justify-end pt-4">
              <div className="text-right">
                <div className="text-sm text-slate-500">Total Predicted Payout</div>
                <div className="text-2xl font-bold text-green-600">
                  ${(summary?.totalPredictedEarnings || 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Route Drawer - 520px width */}
      <Sheet open={routeDrawerOpen} onOpenChange={setRouteDrawerOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px] overflow-y-auto">
          {routeDrawerData && (
            <>
              <SheetHeader>
                <SheetTitle>Route — {routeDrawerData.driverName} (Vehicle #{routeDrawerData.vehicleId})</SheetTitle>
                <SheetDescription>Detailed route information and stop timeline</SheetDescription>
              </SheetHeader>

              {/* Mini KPI Cards (3) */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-xs text-slate-500">On-Time %</div>
                  <div className="text-xl font-bold">{routeDrawerData.onTimePercentage}%</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-xs text-slate-500">Deadhead (est.)</div>
                  <div className="text-xl font-bold">{routeDrawerData.deadheadMiles} mi</div>
                </div>
                <div className="rounded-lg border bg-white p-3">
                  <div className="text-xs text-slate-500">Predicted Pay</div>
                  <div className="text-xl font-bold text-green-600">${routeDrawerData.predictedEarnings.toFixed(2)}</div>
                </div>
              </div>

              {/* Stops Timeline Table (dense) */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Stops Timeline</h4>
                <div className="rounded-lg border bg-white overflow-hidden">
                  <table className="w-full">
                    <thead className="border-b bg-slate-50">
                      <tr className="h-9 text-xs text-slate-500">
                        <th className="px-2 text-left w-[50px] font-medium">Seq</th>
                        <th className="px-2 text-left w-[90px] font-medium">Type</th>
                        <th className="px-2 text-left w-[140px] font-medium">Trip</th>
                        <th className="px-2 text-left w-[140px] font-medium">Window</th>
                        <th className="px-2 text-left w-[90px] font-medium">ETA</th>
                        <th className="px-2 text-left w-[80px] font-medium">Slack</th>
                        <th className="px-2 text-left w-[120px] font-medium">Lock</th>
                      </tr>
                    </thead>
                    <tbody>
                      {routeDrawerData.assignments.flatMap((stop, index) => [
                        // Pickup row
                        <tr key={`${stop.tripId}-pickup`} className="h-10 text-sm border-b last:border-b-0">
                          <td className="px-2 py-1">{index * 2 + 1}</td>
                          <td className="px-2 py-1">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">Pickup</span>
                          </td>
                          <td className="px-2 py-1 font-medium">TRP-{stop.tripId}</td>
                          <td className="px-2 py-1">{stop.predictedPickupTime?.split('T')[1]?.substring(0, 5) || 'N/A'}</td>
                          <td className="px-2 py-1">{stop.predictedPickupTime?.split('T')[1]?.substring(0, 5) || 'N/A'}</td>
                          <td className="px-2 py-1">
                            <span className={stop.predictedArrivalMinutes > 0 ? 'text-amber-600' : 'text-green-600'}>
                              {stop.predictedArrivalMinutes > 0 ? `+${stop.predictedArrivalMinutes}` : stop.predictedArrivalMinutes}
                            </span>
                          </td>
                          <td className="px-2 py-1">
                            {stop.isGapFill ? (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">Gap-Fill</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>,
                        // Dropoff row
                        <tr key={`${stop.tripId}-dropoff`} className="h-10 text-sm border-b last:border-b-0 bg-slate-50/50">
                          <td className="px-2 py-1">{index * 2 + 2}</td>
                          <td className="px-2 py-1">
                            <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700">Dropoff</span>
                          </td>
                          <td className="px-2 py-1 font-medium">TRP-{stop.tripId}</td>
                          <td className="px-2 py-1">{stop.predictedDropoffTime?.split('T')[1]?.substring(0, 5) || 'N/A'}</td>
                          <td className="px-2 py-1">{stop.predictedDropoffTime?.split('T')[1]?.substring(0, 5) || 'N/A'}</td>
                          <td className="px-2 py-1">—</td>
                          <td className="px-2 py-1">—</td>
                        </tr>
                      ])}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Unassigned Trip Drawer */}
      <Sheet open={unassignedDrawerOpen} onOpenChange={setUnassignedDrawerOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px]">
          {unassignedDrawerData && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Unassigned Trip — TRP-{unassignedDrawerData.tripId}
                </SheetTitle>
                <SheetDescription>Trip details and constraint information</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-500">Pickup Window</div>
                    <div className="font-medium">{unassignedDrawerData.pickupWindow}</div>
                  </div>
                  <div>
                    <div className="text-slate-500">Mobility Type</div>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${unassignedDrawerData.mobilityType === 'Wheelchair' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'}`}>
                      {unassignedDrawerData.mobilityType}
                    </span>
                  </div>
                  <div>
                    <div className="text-slate-500">Pickup Location</div>
                    <div className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {unassignedDrawerData.pickupLocation}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-500">Dropoff Location</div>
                    <div className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {unassignedDrawerData.dropoffLocation}
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="text-sm font-medium text-red-700">Constraint Blocking Assignment</div>
                  <div className="mt-1 text-red-600">{unassignedDrawerData.reason}</div>
                </div>

                {unassignedDrawerData.suggestedDrivers && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-sm font-medium text-blue-700">Best 3 Drivers to Try (Shadow Suggestion)</div>
                    <div className="mt-2 space-y-2">
                      {unassignedDrawerData.suggestedDrivers.map((driver, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <ChevronRight className="h-4 w-4 text-blue-500" />
                          <span>{driver}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Pay Drawer */}
      <Sheet open={payDrawerOpen} onOpenChange={setPayDrawerOpen}>
        <SheetContent className="w-[520px] sm:max-w-[520px]">
          {payDrawerData && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Driver Pay — {payDrawerData.driverName}
                </SheetTitle>
                <SheetDescription>Predicted pay breakdown</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm text-slate-500">Pay Rule Applied</div>
                  <div className="font-medium mt-1">
                    <span className="px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-700">{payDrawerData.rateRule}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-500">Miles × Rate</span>
                    <span className="font-medium">{payDrawerData.miles} × $2.00 = ${payDrawerData.basePay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-500">Bonuses/Adjustments</span>
                    <span className="font-medium text-green-600">+${payDrawerData.bonuses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-slate-500">Deductions</span>
                    <span className="font-medium text-red-600">-${payDrawerData.deductions.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-3">
                    <span className="font-semibold">Final Predicted</span>
                    <span className="text-xl font-bold text-green-600">${payDrawerData.netPay.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
