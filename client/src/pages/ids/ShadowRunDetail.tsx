import { useRoute, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MapPin,
  Route,
  Shield
} from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function ShadowRunDetail() {
  const [, params] = useRoute("/ids/shadow-runs/:id");
  const [, setLocation] = useLocation();
  
  const runId = params?.id ? parseInt(params.id, 10) : 0;
  
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/ids/shadow-runs")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              Shadow Run #{shadowRun.id}
            </h1>
            <p className="text-muted-foreground mt-1">
              {shadowRun.runDate} • Completed in {result?.solveTimeMs || 0}ms
            </p>
          </div>
        </div>
        <Badge 
          variant={shadowRun.lockViolations === 0 ? "secondary" : "destructive"}
          className="text-lg px-4 py-2"
        >
          {shadowRun.lockViolations === 0 ? (
            <><CheckCircle2 className="h-4 w-4 mr-2" /> No Lock Violations</>
          ) : (
            <><AlertTriangle className="h-4 w-4 mr-2" /> {shadowRun.lockViolations} Lock Violations</>
          )}
        </Badge>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time %</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(summary?.averageOnTimePercentage || 0)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Predicted on-time arrivals
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gap-Fill Wins</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              +{summary?.gapFillWins || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Empty seats captured
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lock Violations</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${shadowRun.lockViolations === 0 ? 'text-green-600' : 'text-red-600'}`}>
              {shadowRun.lockViolations}
            </div>
            <p className="text-xs text-muted-foreground">
              Must be 0 for production
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Predicted Pay</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(summary?.totalPredictedEarnings || 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total driver earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assignment Rate</CardTitle>
            <Truck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary ? Math.round((summary.assignedTrips / summary.totalTrips) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {summary?.assignedTrips || 0} / {summary?.totalTrips || 0} trips
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Routes and Unassigned */}
      <Tabs defaultValue="routes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="routes" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            Driver Routes ({routes.length})
          </TabsTrigger>
          <TabsTrigger value="unassigned" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Unassigned Trips ({unassignedTripIds.length})
          </TabsTrigger>
          <TabsTrigger value="summary" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Summary
          </TabsTrigger>
        </TabsList>

        {/* Routes Tab */}
        <TabsContent value="routes">
          <Card>
            <CardHeader>
              <CardTitle>Driver Routes</CardTitle>
              <CardDescription>
                Optimized trip assignments by driver
              </CardDescription>
            </CardHeader>
            <CardContent>
              {routes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No routes generated
                </div>
              ) : (
                <div className="space-y-6">
                  {routes.map((route) => (
                    <div key={route.driverId} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-full">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">Driver #{route.driverId}</h3>
                            <p className="text-sm text-muted-foreground">
                              Vehicle #{route.vehicleId}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Trips</div>
                            <div className="font-semibold">{route.totalTrips}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Miles</div>
                            <div className="font-semibold">{route.totalMiles}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Hours</div>
                            <div className="font-semibold">{route.totalHours.toFixed(1)}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Earnings</div>
                            <div className="font-semibold text-green-600">
                              ${route.predictedEarnings.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Route Stops */}
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Order</TableHead>
                            <TableHead>Trip ID</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Pickup Time</TableHead>
                            <TableHead>Dropoff Time</TableHead>
                            <TableHead>On-Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {route.assignments.map((assignment) => (
                            <TableRow key={assignment.tripId}>
                              <TableCell>
                                <Badge variant="outline">#{assignment.routeOrder}</Badge>
                              </TableCell>
                              <TableCell className="font-mono">
                                Trip #{assignment.tripId}
                              </TableCell>
                              <TableCell>
                                <Badge variant={assignment.isGapFill ? "secondary" : "default"}>
                                  {assignment.isGapFill ? "Gap-Fill" : "Template"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(assignment.predictedPickupTime).toLocaleTimeString()}
                              </TableCell>
                              <TableCell>
                                {new Date(assignment.predictedDropoffTime).toLocaleTimeString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={assignment.predictedArrivalMinutes <= 0 ? "secondary" : "destructive"}>
                                  {assignment.predictedArrivalMinutes <= 0 ? "On Time" : `+${assignment.predictedArrivalMinutes}min`}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Route Summary */}
                      <div className="flex gap-4 mt-4 pt-4 border-t">
                        <Badge variant="outline">
                          {route.templateTrips} Template Trips
                        </Badge>
                        <Badge variant="secondary">
                          +{route.gapFillTrips} Gap-Fills
                        </Badge>
                        <Badge variant={route.onTimePercentage >= 90 ? "secondary" : "outline"}>
                          {route.onTimePercentage}% On-Time
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Unassigned Tab */}
        <TabsContent value="unassigned">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Unassigned Trips
              </CardTitle>
              <CardDescription>
                Trips that could not be assigned to any driver
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unassignedTripIds.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p className="text-muted-foreground">All trips were successfully assigned!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unassignedTripIds.map((tripId) => (
                    <div 
                      key={tripId}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                        <span className="font-mono">Trip #{tripId}</span>
                      </div>
                      <Badge variant="outline">Unassigned</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle>Run Summary</CardTitle>
              <CardDescription>
                Complete details of this shadow run
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Input</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Trips</span>
                      <span className="font-medium">{shadowRun.inputTripsCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Available Drivers</span>
                      <span className="font-medium">{shadowRun.inputDriversCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Locked Trips</span>
                      <span className="font-medium">{shadowRun.lockedTripsCount}</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Output</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assigned Trips</span>
                      <span className="font-medium">{summary?.assignedTrips || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unassigned Trips</span>
                      <span className="font-medium">{summary?.unassignedTrips || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Vehicles Used</span>
                      <span className="font-medium">{summary?.totalVehiclesUsed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Solve Time</span>
                      <span className="font-medium">{result?.solveTimeMs || 0}ms</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {result?.warnings && result.warnings.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold mb-4">Warnings</h3>
                  <div className="space-y-2">
                    {result.warnings.map((warning, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-amber-600">
                        <AlertTriangle className="h-4 w-4" />
                        <span>{warning}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
