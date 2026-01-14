import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Car, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  UserCheck,
  Wrench,
  Navigation,
  DollarSign,
  Clock,
  TrendingUp,
  Calendar,
  Phone,
  FileText,
  Truck,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: vehicleStats, isLoading: vehicleLoading } = trpc.vehicles.stats.useQuery();
  const { data: driverStats, isLoading: driverLoading } = trpc.drivers.stats.useQuery();

  const isLoading = vehicleLoading || driverLoading;

  // Mock data for demonstration - these would come from real API calls
  const fleetSummary = {
    total: 60,
    active: 40,
    lot: 8,
    repair: 7,
    retiring: 3,
    retired: 2,
    wheelchairs: 12
  };

  const todayStats = {
    scheduledTrips: 156,
    completedTrips: 89,
    inProgress: 23,
    noShows: 4,
    driversOnDuty: 38,
    pendingBilling: 234,
    weeklyRevenue: 45670
  };

  const alerts = [
    { type: "warning", message: "5 vehicles due for state inspection this week", module: "Fleet" },
    { type: "urgent", message: "2 repair orders marked as urgent", module: "Garage" },
    { type: "info", message: "3 driver licenses expiring in 30 days", module: "HR" },
    { type: "warning", message: "12 unpaid tolls pending review", module: "Office" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations Dashboard</h1>
          <p className="text-muted-foreground">
            Orange Cab NEMT - Real-time operations overview
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Alert Banner */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Action Required ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.type === "urgent" ? "destructive" : "secondary"} className="text-xs">
                      {alert.module}
                    </Badge>
                    <span>{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Operations */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Activity className="h-5 w-5 text-orange-500" />
          Today's Operations
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Trips</CardTitle>
              <Navigation className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayStats.scheduledTrips}</div>
              <div className="flex items-center gap-2 mt-2">
                <Progress value={(todayStats.completedTrips / todayStats.scheduledTrips) * 100} className="h-2" />
                <span className="text-xs text-muted-foreground">{Math.round((todayStats.completedTrips / todayStats.scheduledTrips) * 100)}%</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {todayStats.completedTrips} completed, {todayStats.inProgress} in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Drivers On Duty</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{todayStats.driversOnDuty}</div>
              <p className="text-xs text-muted-foreground">
                of 40 scheduled (4AM - 4PM shift)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Billing</CardTitle>
              <FileText className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{todayStats.pendingBilling}</div>
              <p className="text-xs text-muted-foreground">
                Trips awaiting submission to ModivCare
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${todayStats.weeklyRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                Estimated from completed trips
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fleet Status */}
      <div>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Truck className="h-5 w-5 text-orange-500" />
          Fleet Status
        </h2>
        <div className="grid gap-4 md:grid-cols-6">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/fleet/vehicles")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Fleet</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{vehicleStats?.total || fleetSummary.total}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {fleetSummary.wheelchairs} wheelchair accessible
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-green-200" onClick={() => setLocation("/fleet/status")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On Road</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{fleetSummary.active}</div>
              <p className="text-xs text-muted-foreground">Active vehicles</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/fleet/status")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Lot</CardTitle>
              <Car className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{fleetSummary.lot}</div>
              <p className="text-xs text-muted-foreground">Available backup</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow border-amber-200" onClick={() => setLocation("/garage/repairs")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Repair</CardTitle>
              <Wrench className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">{fleetSummary.repair}</div>
              <p className="text-xs text-muted-foreground">Being serviced</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/fleet/status")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retiring</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{fleetSummary.retiring}</div>
              <p className="text-xs text-muted-foreground">Being phased out</p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/fleet/status")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Retired</CardTitle>
              <Car className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-500">{fleetSummary.retired}</div>
              <p className="text-xs text-muted-foreground">Out of service</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Driver Stats & Garage Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Driver Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Driver Overview
            </CardTitle>
            <CardDescription>1099 Independent Contractors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Drivers</span>
                  <span className="font-medium">{driverStats?.total || 40}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <span className="font-medium text-green-600">{driverStats?.active || 38}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">On Leave</span>
                  <span className="font-medium text-amber-600">2</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">With Vehicle</span>
                  <span className="font-medium">{driverStats?.assigned || 36}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">License Expiring</span>
                  <span className="font-medium text-amber-600">{driverStats?.licenseExpiring || 3}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Pending Apps</span>
                  <span className="font-medium text-blue-600">5</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => setLocation("/hr/drivers")}>
                View All Drivers
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Garage Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-500" />
              Garage Status
            </CardTitle>
            <CardDescription>3 Bays, 2 Full-time Mechanics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((bay) => (
                  <div key={bay} className={`p-3 rounded-lg text-center ${bay <= 2 ? 'bg-amber-100' : 'bg-green-100'}`}>
                    <div className="text-xs text-muted-foreground">Bay {bay}</div>
                    <div className={`text-sm font-medium ${bay <= 2 ? 'text-amber-700' : 'text-green-700'}`}>
                      {bay <= 2 ? 'Occupied' : 'Available'}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Open Repair Orders</span>
                  <span className="font-medium">7</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Urgent Priority</span>
                  <span className="font-medium text-red-600">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Waiting for Parts</span>
                  <span className="font-medium text-amber-600">3</span>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Button variant="outline" className="w-full" onClick={() => setLocation("/garage/repairs")}>
                View Repair Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for daily operations
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-6">
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setLocation("/dispatch/trips")}
          >
            <Navigation className="h-5 w-5" />
            <span className="text-xs">Manage Trips</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setLocation("/garage/repairs/new")}
          >
            <Wrench className="h-5 w-5" />
            <span className="text-xs">New Repair Order</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setLocation("/office/calls")}
          >
            <Phone className="h-5 w-5" />
            <span className="text-xs">Log Call</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setLocation("/billing/batches")}
          >
            <DollarSign className="h-5 w-5" />
            <span className="text-xs">Submit Billing</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setLocation("/hr/applications")}
          >
            <Users className="h-5 w-5" />
            <span className="text-xs">Applications</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 flex-col gap-2"
            onClick={() => setLocation("/admin/overview")}
          >
            <Activity className="h-5 w-5" />
            <span className="text-xs">Director View</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
