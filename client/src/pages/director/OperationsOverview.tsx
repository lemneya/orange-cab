import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  LayoutDashboard, 
  Car, 
  Users, 
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wrench,
  Navigation,
  Phone,
  FileText,
  Calendar,
  Activity
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function OperationsOverview() {
  const [, setLocation] = useLocation();
  const [period, setPeriod] = useState<string>("today");

  // Mock data - comprehensive operations overview
  const fleetStatus = {
    total: 60,
    active: 40,
    inGarage: 8,
    lot: 7,
    retired: 5,
    wheelchairs: 12
  };

  const driverStatus = {
    total: 40,
    onDuty: 38,
    available: 8,
    onTrip: 25,
    onBreak: 5
  };

  const todayMetrics = {
    tripsScheduled: 156,
    tripsCompleted: 89,
    tripsInProgress: 38,
    tripsPending: 23,
    tripsCancelled: 6,
    completionRate: 93.7,
    onTimeRate: 96.2
  };

  const financialMetrics = {
    todayRevenue: 3920.00,
    weekRevenue: 27440.00,
    monthRevenue: 145680.00,
    pendingBilling: 28500.00,
    pendingPayroll: 78500.00
  };

  const alerts = [
    { id: 1, type: "urgent", module: "Fleet", message: "Vehicle #1015 needs immediate repair - brake issue", time: "10 min ago" },
    { id: 2, type: "warning", module: "HR", message: "3 driver certifications expiring this week", time: "1 hour ago" },
    { id: 3, type: "warning", module: "Billing", message: "12 trips need time adjustment before submission", time: "2 hours ago" },
    { id: 4, type: "info", module: "Dispatch", message: "23 trips pending driver assignment", time: "30 min ago" },
  ];

  const garageStatus = {
    baysTotal: 3,
    baysOccupied: 2,
    mechanicsOnDuty: 2,
    activeRepairs: 5,
    pendingRepairs: 3
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "urgent":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Clock className="h-5 w-5 text-blue-500" />;
    }
  };

  const getAlertBg = (type: string) => {
    switch (type) {
      case "urgent":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-amber-50 border-amber-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operations Overview</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of all company operations
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Live View
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert) => (
                <div key={alert.id} className={`flex items-center justify-between p-3 rounded-lg border ${getAlertBg(alert.type)}`}>
                  <div className="flex items-center gap-3">
                    {getAlertIcon(alert.type)}
                    <div>
                      <Badge variant="outline" className="mr-2">{alert.module}</Badge>
                      <span className="text-sm">{alert.message}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{alert.time}</span>
                    <Button size="sm" variant="ghost">View</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Today's Revenue</p>
                <p className="text-3xl font-bold text-orange-600">${financialMetrics.todayRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-green-600">+8.5%</span>
                </div>
              </div>
              <DollarSign className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trips Completed</p>
                <p className="text-3xl font-bold">{todayMetrics.tripsCompleted}</p>
                <p className="text-sm text-muted-foreground">of {todayMetrics.tripsScheduled} scheduled</p>
              </div>
              <Navigation className="h-10 w-10 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-3xl font-bold text-green-600">{todayMetrics.completionRate}%</p>
              </div>
              <CheckCircle className="h-10 w-10 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On-Time Rate</p>
                <p className="text-3xl font-bold text-blue-600">{todayMetrics.onTimeRate}%</p>
              </div>
              <Clock className="h-10 w-10 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Status Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Fleet Status */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/fleet/status")}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5 text-orange-500" />
              Fleet Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Active on Road</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600">{fleetStatus.active}</span>
                  <Progress value={(fleetStatus.active/fleetStatus.total)*100} className="w-20 h-2" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">In Garage</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-600">{fleetStatus.inGarage}</span>
                  <Progress value={(fleetStatus.inGarage/fleetStatus.total)*100} className="w-20 h-2" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Lot Vehicles</span>
                <span className="font-bold">{fleetStatus.lot}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Wheelchair Units</span>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">{fleetStatus.wheelchairs}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Driver Status */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/dispatch/tracking")}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-blue-500" />
              Driver Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">On Trip</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-green-600">{driverStatus.onTrip}</span>
                  <Progress value={(driverStatus.onTrip/driverStatus.total)*100} className="w-20 h-2" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Available</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-blue-600">{driverStatus.available}</span>
                  <Progress value={(driverStatus.available/driverStatus.total)*100} className="w-20 h-2" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">On Break</span>
                <span className="font-bold text-amber-600">{driverStatus.onBreak}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Total On Duty</span>
                <Badge variant="default" className="bg-green-500">{driverStatus.onDuty}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Garage Status */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setLocation("/garage/bays")}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wrench className="h-5 w-5 text-amber-500" />
              Garage Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Bays Occupied</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{garageStatus.baysOccupied}/{garageStatus.baysTotal}</span>
                  <Progress value={(garageStatus.baysOccupied/garageStatus.baysTotal)*100} className="w-20 h-2" />
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Mechanics On Duty</span>
                <span className="font-bold text-green-600">{garageStatus.mechanicsOnDuty}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Active Repairs</span>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700">{garageStatus.activeRepairs}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Pending Repairs</span>
                <Badge variant="outline">{garageStatus.pendingRepairs}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Today's Trip Progress</CardTitle>
          <CardDescription>Real-time trip completion status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-muted-foreground">
                {todayMetrics.tripsCompleted + todayMetrics.tripsInProgress} / {todayMetrics.tripsScheduled} trips
              </span>
            </div>
            <Progress value={((todayMetrics.tripsCompleted + todayMetrics.tripsInProgress)/todayMetrics.tripsScheduled)*100} className="h-4" />
            <div className="grid grid-cols-5 gap-4 pt-2">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{todayMetrics.tripsCompleted}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{todayMetrics.tripsInProgress}</p>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{todayMetrics.tripsPending}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{todayMetrics.tripsCancelled}</p>
                <p className="text-xs text-muted-foreground">Cancelled</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{todayMetrics.tripsScheduled}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Financial Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
          <CardDescription>Revenue and pending payments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-muted-foreground">Today</p>
              <p className="text-xl font-bold text-green-600">${financialMetrics.todayRevenue.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <p className="text-sm text-muted-foreground">This Week</p>
              <p className="text-xl font-bold text-blue-600">${financialMetrics.weekRevenue.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <p className="text-sm text-muted-foreground">This Month</p>
              <p className="text-xl font-bold text-orange-600">${financialMetrics.monthRevenue.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
              <p className="text-sm text-muted-foreground">Pending Billing</p>
              <p className="text-xl font-bold text-amber-600">${financialMetrics.pendingBilling.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <p className="text-sm text-muted-foreground">Pending Payroll</p>
              <p className="text-xl font-bold text-purple-600">${financialMetrics.pendingPayroll.toLocaleString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
