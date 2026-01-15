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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Brain,
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
  Eye,
  Lock,
  AlertCircle,
  Timer,
  ChevronRight
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface RouteDrawerData {
  driverId: number;
  vehicleId: number;
  totalTrips: number;
  totalMiles: number;
  totalHours: number;
  predictedEarnings: number;
  onTimePercentage: number;
  assignments: Array<{
    tripId: number;
    routeOrder: number;
    predictedPickupTime: string;
    predictedDropoffTime: string;
    predictedArrivalMinutes: number;
    isGapFill: boolean;
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
  
  // State for filters and toggles
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [driverFilter, setDriverFilter] = useState("all");
  const [vehicleFilter, setVehicleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
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
  
  // Filter routes based on exceptions only and search
  const filteredRoutes = routes.filter(route => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (!route.driverId.toString().includes(query) && 
          !route.vehicleId.toString().includes(query)) {
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

  // Mock template locks data (would come from API)
  const templateLocks = routes.flatMap(route => 
    route.assignments
      .filter(a => a.isGapFill === false && route.templateTrips > 0)
      .slice(0, route.templateTrips)
      .map(a => ({
        templateId: `TPL-${a.tripId}`,
        driverId: route.driverId,
        tripsLocked: 1,
        lockType: 'Hard' as const,
        source: 'Dispatcher' as const,
        notes: 'Regular route',
        status: 'Respected' as const
      }))
  );

  const openRouteDrawer = (route: typeof routes[0]) => {
    setRouteDrawerData({
      driverId: route.driverId,
      vehicleId: route.vehicleId,
      totalTrips: route.totalTrips,
      totalMiles: route.totalMiles,
      totalHours: route.totalHours,
      predictedEarnings: route.predictedEarnings,
      onTimePercentage: route.onTimePercentage,
      assignments: route.assignments.map(a => ({
        tripId: a.tripId,
        routeOrder: a.routeOrder,
        predictedPickupTime: a.predictedPickupTime,
        predictedDropoffTime: a.predictedDropoffTime,
        predictedArrivalMinutes: a.predictedArrivalMinutes,
        isGapFill: a.isGapFill
      }))
    });
    setRouteDrawerOpen(true);
  };

  const openUnassignedDrawer = (tripId: number) => {
    setUnassignedDrawerData({
      tripId,
      pickupWindow: '08:00 - 08:30',
      pickupLocation: '123 Main St',
      dropoffLocation: '456 Oak Ave',
      mobilityType: 'Standard',
      reason: 'Time window conflict',
      suggestedDrivers: ['Driver #3', 'Driver #7', 'Driver #12']
    });
    setUnassignedDrawerOpen(true);
  };

  const openPayDrawer = (route: typeof routes[0]) => {
    setPayDrawerData({
      driverId: route.driverId,
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

  // Unassigned trip reasons (mock data with controlled vocabulary)
  const unassignedReasons = [
    'No available wheelchair unit',
    'Time window conflict',
    'Driver shift end constraint',
    'Template lock prevents assignment',
    'Vehicle unavailable (maintenance/lot)',
    'Insufficient capacity'
  ];

  return (
    <div className="space-y-6">
      {/* 0) Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">IDS Shadow Run</h1>
          <p className="text-muted-foreground mt-1">
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
            <p className="text-xs text-muted-foreground">
              of {totalScheduled} scheduled
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted On-Time</CardTitle>
            <Clock className="h-5 w-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{onTimePercentage}%</div>
            <p className="text-xs text-muted-foreground">
              within pickup windows
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`bg-gradient-to-br cursor-pointer transition-colors ${
            unassignedCount > 0 
              ? 'from-red-50 to-white dark:from-red-950/20 hover:from-red-100' 
              : 'from-gray-50 to-white dark:from-gray-950/20'
          }`}
          onClick={() => document.getElementById('unassigned-tab')?.click()}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
            <AlertTriangle className={`h-5 w-5 ${unassignedCount > 0 ? 'text-red-500' : 'text-gray-400'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${unassignedCount > 0 ? 'text-red-600' : ''}`}>
              {unassignedCount}
            </div>
            <p className="text-xs text-muted-foreground">
              needs dispatch review
            </p>
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
            <p className="text-xs text-muted-foreground">
              template locks respected
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Mini KPI Strip */}
      <div className="flex items-center gap-6 px-4 py-2 bg-muted/50 rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          <span className="text-muted-foreground">Gap-Fill Wins:</span>
          <span className="font-semibold text-green-600">+{summary?.gapFillWins || 0}</span>
        </div>
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Est. Deadhead:</span>
          <span className="font-semibold">{estimatedDeadhead} mi</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Drivers Used:</span>
          <span className="font-semibold">{routes.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Runtime:</span>
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
                <div className="text-muted-foreground">Run ID</div>
                <div className="font-medium">#{shadowRun.id}</div>
                <div className="text-muted-foreground">Service Date</div>
                <div className="font-medium">{shadowRun.runDate}</div>
                <div className="text-muted-foreground">Run Timestamp</div>
                <div className="font-medium">{shadowRun.runTimestamp}</div>
                <div className="text-muted-foreground">Created By</div>
                <div className="font-medium">System</div>
                <div className="text-muted-foreground">Input Source</div>
                <div className="font-medium">CSV Upload</div>
                <div className="text-muted-foreground">Driver / Vehicle / Trip Count</div>
                <div className="font-medium">{shadowRun.inputDriversCount} / {routes.length} / {shadowRun.inputTripsCount}</div>
                <div className="text-muted-foreground">Runtime</div>
                <div className="font-medium">{result?.solveTimeMs || 0}ms</div>
              </div>
            </div>

            {/* Right column - controls + status */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  Shadow
                </Badge>
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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search driver, trip id, template id…"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-purple-50 dark:bg-purple-950/20">
                  <Lock className="h-3 w-3 mr-1" />
                  LOCKED ROUTES: {templateLocks.length}
                </Badge>
                <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950/20">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  LOW ON-TIME: {routes.filter(r => r.onTimePercentage < 95).length} drivers
                </Badge>
                <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950/20">
                  <Truck className="h-3 w-3 mr-1" />
                  HIGH MILEAGE: {routes.filter(r => r.totalMiles > 100).length} drivers
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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Routes</CardTitle>
                <CardDescription>Driver route assignments with optimization results</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Routes CSV
              </Button>
            </CardHeader>
            <CardContent>
              {/* Filters Row */}
              <div className="flex items-center gap-4 mb-4">
                <Select value={driverFilter} onValueChange={setDriverFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Drivers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Drivers</SelectItem>
                    <SelectItem value="flagged">Only With Flags</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                  <SelectTrigger className="w-[180px]">
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
                    <SelectItem value="ontime-risk">On-Time Risk</SelectItem>
                    <SelectItem value="lock-sensitive">Lock-Sensitive</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Routes Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead className="text-right">Trips</TableHead>
                    <TableHead className="text-right">Miles (est.)</TableHead>
                    <TableHead>Start–End</TableHead>
                    <TableHead className="text-right">On-Time %</TableHead>
                    <TableHead className="text-right">Gap-Fill</TableHead>
                    <TableHead className="text-right">Predicted Pay</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map((route) => {
                    const hasOnTimeRisk = route.onTimePercentage < 95;
                    const hasHighMileage = route.totalMiles > 100;
                    const hasLocks = route.templateTrips > 0;
                    
                    return (
                      <TableRow 
                        key={route.driverId} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openRouteDrawer(route)}
                      >
                        <TableCell className="font-medium">
                          Driver #{route.driverId}
                        </TableCell>
                        <TableCell>Vehicle #{route.vehicleId}</TableCell>
                        <TableCell className="text-right">{route.totalTrips}</TableCell>
                        <TableCell className="text-right">{route.totalMiles}</TableCell>
                        <TableCell>
                          {route.assignments[0]?.predictedPickupTime?.split('T')[1]?.substring(0, 5) || 'N/A'} – 
                          {route.assignments[route.assignments.length - 1]?.predictedDropoffTime?.split('T')[1]?.substring(0, 5) || 'N/A'}
                        </TableCell>
                        <TableCell className={`text-right ${hasOnTimeRisk ? 'text-yellow-600 font-semibold' : ''}`}>
                          {route.onTimePercentage}%
                        </TableCell>
                        <TableCell className="text-right text-green-600">
                          +{route.gapFillTrips}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ${route.predictedEarnings.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {hasLocks && (
                              <Badge variant="outline" className="text-xs bg-purple-50">Lock-Sensitive</Badge>
                            )}
                            {hasOnTimeRisk && (
                              <Badge variant="outline" className="text-xs bg-yellow-50">On-Time Risk</Badge>
                            )}
                            {hasHighMileage && (
                              <Badge variant="outline" className="text-xs bg-orange-50">High Mileage</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredRoutes.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  {exceptionsOnly ? 'No routes with exceptions' : 'No routes found'}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab B - Unassigned Trips */}
        <TabsContent value="unassigned">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Unassigned Trips</CardTitle>
                <CardDescription>Trips that could not be assigned - requires dispatch review</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Unassigned CSV
              </Button>
            </CardHeader>
            <CardContent>
              {unassignedTripIds.length === 0 ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-lg font-medium">All trips assigned!</p>
                  <p className="text-muted-foreground">No unassigned trips in this shadow run.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Pickup Window</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Dropoff</TableHead>
                      <TableHead>Mobility</TableHead>
                      <TableHead>Required Vehicle</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Suggested Fix</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unassignedTripIds.map((tripId, index) => {
                      const reason = unassignedReasons[index % unassignedReasons.length];
                      return (
                        <TableRow 
                          key={tripId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => openUnassignedDrawer(tripId)}
                        >
                          <TableCell className="font-medium">{tripId}</TableCell>
                          <TableCell>08:00 - 08:30</TableCell>
                          <TableCell className="max-w-[150px] truncate">123 Main St</TableCell>
                          <TableCell className="max-w-[150px] truncate">456 Oak Ave</TableCell>
                          <TableCell>
                            <Badge variant="outline">Standard</Badge>
                          </TableCell>
                          <TableCell>
                            {reason.includes('wheelchair') ? (
                              <Badge variant="secondary">WC Required</Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-red-600 text-sm">{reason}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 text-sm">Try Driver #3</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab C - Template Locks */}
        <TabsContent value="locks">
          <Card>
            {lockViolations > 0 && (
              <div className="bg-red-100 dark:bg-red-950/40 border-b border-red-200 dark:border-red-900 px-6 py-3">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-semibold">Lock violations must be 0 before any production pilot.</span>
                </div>
              </div>
            )}
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Template Locks</CardTitle>
                <CardDescription>Driver-trip locks that must be respected by optimization</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Locks CSV
              </Button>
            </CardHeader>
            <CardContent>
              {templateLocks.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Lock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No template locks defined for this run</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Template ID</TableHead>
                      <TableHead>Driver</TableHead>
                      <TableHead className="text-right">Trips Locked</TableHead>
                      <TableHead>Lock Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {templateLocks.map((lock, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{lock.templateId}</TableCell>
                        <TableCell>Driver #{lock.driverId}</TableCell>
                        <TableCell className="text-right">{lock.tripsLocked}</TableCell>
                        <TableCell>
                          <Badge variant={lock.lockType === 'Hard' ? 'default' : 'secondary'}>
                            {lock.lockType}
                          </Badge>
                        </TableCell>
                        <TableCell>{lock.source}</TableCell>
                        <TableCell className="text-muted-foreground">{lock.notes}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={lock.status === 'Respected' ? 'secondary' : 'destructive'}
                            className={lock.status === 'Respected' ? 'bg-green-100 text-green-700' : ''}
                          >
                            {lock.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab D - Predicted Pay */}
        <TabsContent value="pay">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Predicted Driver Pay</CardTitle>
                <CardDescription>Estimated earnings based on shadow optimization</CardDescription>
              </div>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Predicted Pay CSV
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Driver</TableHead>
                    <TableHead className="text-right">Trips</TableHead>
                    <TableHead className="text-right">Miles</TableHead>
                    <TableHead>Rate Rule</TableHead>
                    <TableHead className="text-right">Gross (pred)</TableHead>
                    <TableHead className="text-right">Adjustments</TableHead>
                    <TableHead className="text-right">Net (pred)</TableHead>
                    <TableHead>Flags</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {routes.map((route) => {
                    const hasUnusualPay = route.predictedEarnings > 100 || route.predictedEarnings < 20;
                    const adjustments = (route.earningsBreakdown?.bonuses || 0) - (route.earningsBreakdown?.deductions || 0);
                    return (
                      <TableRow 
                        key={route.driverId}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => openPayDrawer(route)}
                      >
                        <TableCell className="font-medium">Driver #{route.driverId}</TableCell>
                        <TableCell className="text-right">{route.totalTrips}</TableCell>
                        <TableCell className="text-right">{route.totalMiles}</TableCell>
                        <TableCell>
                          <Badge variant="outline">per-mile</Badge>
                        </TableCell>
                        <TableCell className="text-right">${(route.earningsBreakdown?.baseEarnings || route.totalMiles * 2).toFixed(2)}</TableCell>
                        <TableCell className={`text-right ${adjustments >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {adjustments >= 0 ? '+' : ''}{adjustments.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-green-600">
                          ${route.predictedEarnings.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {hasUnusualPay && (
                            <Badge variant="outline" className="text-xs bg-yellow-50">Unusual Pay</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Totals Row */}
              <div className="flex justify-end mt-4 pt-4 border-t">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total Predicted Payout</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${(summary?.totalPredictedEarnings || 0).toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Route Drawer */}
      <Sheet open={routeDrawerOpen} onOpenChange={setRouteDrawerOpen}>
        <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto">
          {routeDrawerData && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Route — Driver #{routeDrawerData.driverId} (Vehicle #{routeDrawerData.vehicleId})
                </SheetTitle>
                <SheetDescription>
                  Detailed route information and stop timeline
                </SheetDescription>
              </SheetHeader>

              {/* Mini KPI Cards */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">On-Time %</div>
                    <div className="text-xl font-bold">{routeDrawerData.onTimePercentage}%</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Total Miles</div>
                    <div className="text-xl font-bold">{routeDrawerData.totalMiles} mi</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="text-sm text-muted-foreground">Predicted Pay</div>
                    <div className="text-xl font-bold text-green-600">${routeDrawerData.predictedEarnings.toFixed(2)}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Stops Timeline Table */}
              <div className="mt-6">
                <h4 className="font-semibold mb-3">Stops Timeline</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Stop #</TableHead>
                      <TableHead>Trip ID</TableHead>
                      <TableHead>Pickup</TableHead>
                      <TableHead>Dropoff</TableHead>
                      <TableHead>Arrival</TableHead>
                      <TableHead>Gap-Fill</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routeDrawerData.assignments.map((stop, index) => (
                      <TableRow key={stop.tripId}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{stop.tripId}</TableCell>
                        <TableCell>{stop.predictedPickupTime?.split('T')[1]?.substring(0, 5) || 'N/A'}</TableCell>
                        <TableCell>{stop.predictedDropoffTime?.split('T')[1]?.substring(0, 5) || 'N/A'}</TableCell>
                        <TableCell className={stop.predictedArrivalMinutes > 0 ? 'text-yellow-600' : 'text-green-600'}>
                          {stop.predictedArrivalMinutes > 0 ? `+${stop.predictedArrivalMinutes}` : stop.predictedArrivalMinutes} min
                        </TableCell>
                        <TableCell>
                          {stop.isGapFill && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">Gap-Fill</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Unassigned Trip Drawer */}
      <Sheet open={unassignedDrawerOpen} onOpenChange={setUnassignedDrawerOpen}>
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          {unassignedDrawerData && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Unassigned Trip — {unassignedDrawerData.tripId}
                </SheetTitle>
                <SheetDescription>
                  Trip details and constraint information
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Pickup Window</div>
                    <div className="font-medium">{unassignedDrawerData.pickupWindow}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Mobility Type</div>
                    <Badge variant="outline">{unassignedDrawerData.mobilityType}</Badge>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Pickup Location</div>
                    <div className="font-medium">{unassignedDrawerData.pickupLocation}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Dropoff Location</div>
                    <div className="font-medium">{unassignedDrawerData.dropoffLocation}</div>
                  </div>
                </div>

                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg">
                  <div className="text-sm font-medium text-red-700 dark:text-red-400">Constraint Blocking Assignment</div>
                  <div className="mt-1 text-red-600">{unassignedDrawerData.reason}</div>
                </div>

                {unassignedDrawerData.suggestedDrivers && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-400">Best 3 Drivers to Try (Shadow Suggestion)</div>
                    <div className="mt-2 space-y-2">
                      {unassignedDrawerData.suggestedDrivers.map((driver, index) => (
                        <div key={index} className="flex items-center gap-2">
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
        <SheetContent className="w-[500px] sm:max-w-[500px]">
          {payDrawerData && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Driver Pay — Driver #{payDrawerData.driverId}
                </SheetTitle>
                <SheetDescription>
                  Predicted pay breakdown
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground">Pay Rule Applied</div>
                  <div className="font-medium mt-1">
                    <Badge>{payDrawerData.rateRule}</Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Miles × Rate</span>
                    <span className="font-medium">{payDrawerData.miles} × $2.00 = ${payDrawerData.basePay.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Bonuses</span>
                    <span className="font-medium text-green-600">+${payDrawerData.bonuses.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-muted-foreground">Deductions</span>
                    <span className="font-medium text-red-600">-${payDrawerData.deductions.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center py-3 bg-green-50 dark:bg-green-950/20 rounded-lg px-3">
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
