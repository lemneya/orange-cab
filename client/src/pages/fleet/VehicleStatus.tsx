import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Car, 
  CheckCircle, 
  Wrench, 
  AlertTriangle, 
  XCircle,
  Accessibility,
  TrendingUp,
  Calendar
} from "lucide-react";
import { useLocation } from "wouter";

export default function VehicleStatus() {
  const [, setLocation] = useLocation();

  // Mock data - would come from API
  const fleetStatus = {
    total: 60,
    active: 40,
    lot: 8,
    repair: 7,
    retiring: 3,
    retired: 2,
    wheelchairs: 12,
    wheelchairsActive: 10
  };

  const statusBreakdown = [
    { 
      status: "active", 
      label: "On Road", 
      count: fleetStatus.active, 
      icon: CheckCircle, 
      color: "text-green-500",
      bgColor: "bg-green-50",
      description: "Currently in service"
    },
    { 
      status: "lot", 
      label: "In Lot", 
      count: fleetStatus.lot, 
      icon: Car, 
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      description: "Available backup vehicles"
    },
    { 
      status: "repair", 
      label: "In Repair", 
      count: fleetStatus.repair, 
      icon: Wrench, 
      color: "text-amber-500",
      bgColor: "bg-amber-50",
      description: "Being serviced in garage"
    },
    { 
      status: "retiring", 
      label: "Retiring", 
      count: fleetStatus.retiring, 
      icon: AlertTriangle, 
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      description: "Being phased out"
    },
    { 
      status: "retired", 
      label: "Retired", 
      count: fleetStatus.retired, 
      icon: XCircle, 
      color: "text-gray-400",
      bgColor: "bg-gray-50",
      description: "No longer in service"
    },
  ];

  // Mock vehicle list by status
  const vehiclesByStatus = {
    active: [
      { id: 1, number: "1001", make: "Toyota", model: "Sienna", driver: "John Smith" },
      { id: 2, number: "1002", make: "Honda", model: "Odyssey", driver: "Mike Johnson" },
      { id: 3, number: "1003", make: "Dodge", model: "Caravan", driver: "Sarah Davis" },
    ],
    repair: [
      { id: 4, number: "1015", make: "Toyota", model: "Sienna", issue: "Brake service", bay: 1 },
      { id: 5, number: "1022", make: "Honda", model: "Odyssey", issue: "Transmission", bay: 2 },
    ],
    lot: [
      { id: 6, number: "1030", make: "Nissan", model: "Quest", lastUsed: "2 days ago" },
      { id: 7, number: "1031", make: "Toyota", model: "Sienna", lastUsed: "1 week ago" },
    ]
  };

  const upcomingExpirations = [
    { vehicle: "1005", type: "State Inspection", date: "Jan 20, 2026", daysLeft: 7 },
    { vehicle: "1012", type: "Registration", date: "Jan 25, 2026", daysLeft: 12 },
    { vehicle: "1018", type: "State Inspection", date: "Jan 28, 2026", daysLeft: 15 },
    { vehicle: "1023", type: "City Inspection", date: "Feb 1, 2026", daysLeft: 19 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicle Status Overview</h1>
          <p className="text-muted-foreground">
            Real-time status of your {fleetStatus.total} vehicle fleet
          </p>
        </div>
        <Button onClick={() => setLocation("/fleet/vehicles")} variant="outline">
          View Full List
        </Button>
      </div>

      {/* Fleet Utilization */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-500" />
            Fleet Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Active Vehicles</span>
                <span className="font-medium">{fleetStatus.active} / {fleetStatus.total - fleetStatus.retired} available</span>
              </div>
              <Progress value={(fleetStatus.active / (fleetStatus.total - fleetStatus.retired)) * 100} className="h-3" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{Math.round((fleetStatus.active / (fleetStatus.total - fleetStatus.retired)) * 100)}%</div>
                <div className="text-xs text-muted-foreground">Utilization Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{fleetStatus.wheelchairs}</div>
                <div className="text-xs text-muted-foreground">Wheelchair Vehicles</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-600">{fleetStatus.repair}</div>
                <div className="text-xs text-muted-foreground">In Repair</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{fleetStatus.lot}</div>
                <div className="text-xs text-muted-foreground">Backup Available</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        {statusBreakdown.map((item) => (
          <Card 
            key={item.status} 
            className={`cursor-pointer hover:shadow-md transition-shadow ${item.bgColor}`}
            onClick={() => setLocation(`/fleet/vehicles?status=${item.status}`)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{item.label}</p>
                  <p className="text-3xl font-bold">{item.count}</p>
                </div>
                <item.icon className={`h-8 w-8 ${item.color}`} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{item.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Sections */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Vehicles in Repair */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-amber-500" />
              Currently in Repair
            </CardTitle>
            <CardDescription>Vehicles being serviced in garage</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {vehiclesByStatus.repair.map((vehicle) => (
                <div 
                  key={vehicle.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted"
                  onClick={() => setLocation(`/fleet/vehicles/${vehicle.id}`)}
                >
                  <div>
                    <div className="font-medium">#{vehicle.number}</div>
                    <div className="text-sm text-muted-foreground">{vehicle.make} {vehicle.model}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline">Bay {vehicle.bay}</Badge>
                    <div className="text-sm text-muted-foreground mt-1">{vehicle.issue}</div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setLocation("/garage/repairs")}>
                View All Repairs
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Expirations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-orange-500" />
              Upcoming Expirations
            </CardTitle>
            <CardDescription>Documents expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingExpirations.map((item, index) => (
                <div 
                  key={index} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <div className="font-medium">Vehicle #{item.vehicle}</div>
                    <div className="text-sm text-muted-foreground">{item.type}</div>
                  </div>
                  <div className="text-right">
                    <Badge variant={item.daysLeft <= 7 ? "destructive" : "secondary"}>
                      {item.daysLeft} days
                    </Badge>
                    <div className="text-sm text-muted-foreground mt-1">{item.date}</div>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setLocation("/fleet/documents")}>
                View All Documents
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Wheelchair Fleet */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Accessibility className="h-5 w-5 text-blue-500" />
            Wheelchair Accessible Fleet
          </CardTitle>
          <CardDescription>
            {fleetStatus.wheelchairsActive} of {fleetStatus.wheelchairs} wheelchair vehicles currently active
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-blue-50 text-center">
              <div className="text-2xl font-bold text-blue-600">{fleetStatus.wheelchairs}</div>
              <div className="text-sm text-muted-foreground">Total Wheelchair Vehicles</div>
            </div>
            <div className="p-4 rounded-lg bg-green-50 text-center">
              <div className="text-2xl font-bold text-green-600">{fleetStatus.wheelchairsActive}</div>
              <div className="text-sm text-muted-foreground">Currently Active</div>
            </div>
            <div className="p-4 rounded-lg bg-amber-50 text-center">
              <div className="text-2xl font-bold text-amber-600">1</div>
              <div className="text-sm text-muted-foreground">In Repair</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50 text-center">
              <div className="text-2xl font-bold text-gray-600">1</div>
              <div className="text-sm text-muted-foreground">In Lot</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
