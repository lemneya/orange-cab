import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MapPin, 
  Search, 
  Filter, 
  Clock,
  Car,
  User,
  Navigation,
  Phone,
  MessageSquare,
  RefreshCw
} from "lucide-react";
import { useState } from "react";

export default function DriverTracking() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data - would come from MediRoute/GPS API
  const activeDrivers = [
    {
      id: 1,
      name: "John Smith",
      phone: "(757) 555-0101",
      vehicleNumber: "1001",
      status: "on_trip",
      currentTrip: "MR-2026-001234",
      location: "Virginia Beach, VA",
      lastUpdate: "2 min ago",
      tripsCompleted: 3,
      tripsRemaining: 5,
      eta: "08:15"
    },
    {
      id: 2,
      name: "Mike Johnson",
      phone: "(757) 555-0102",
      vehicleNumber: "1002",
      status: "en_route",
      currentTrip: "MR-2026-001235",
      location: "Norfolk, VA",
      lastUpdate: "1 min ago",
      tripsCompleted: 2,
      tripsRemaining: 6,
      eta: "08:25"
    },
    {
      id: 3,
      name: "Sarah Davis",
      phone: "(757) 555-0103",
      vehicleNumber: "1003",
      status: "available",
      currentTrip: null,
      location: "Hampton, VA",
      lastUpdate: "30 sec ago",
      tripsCompleted: 4,
      tripsRemaining: 4,
      eta: null
    },
    {
      id: 4,
      name: "David Wilson",
      phone: "(757) 555-0104",
      vehicleNumber: "1005",
      status: "on_trip",
      currentTrip: "MR-2026-001240",
      location: "Newport News, VA",
      lastUpdate: "3 min ago",
      tripsCompleted: 5,
      tripsRemaining: 3,
      eta: "08:45"
    },
    {
      id: 5,
      name: "Emily Brown",
      phone: "(757) 555-0105",
      vehicleNumber: "1008",
      status: "break",
      currentTrip: null,
      location: "Chesapeake, VA",
      lastUpdate: "5 min ago",
      tripsCompleted: 3,
      tripsRemaining: 5,
      eta: null
    },
  ];

  const stats = {
    totalActive: 38,
    onTrip: 25,
    available: 8,
    enRoute: 3,
    onBreak: 2
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      on_trip: { label: "On Trip", variant: "default", className: "bg-green-500" },
      en_route: { label: "En Route", variant: "secondary", className: "bg-blue-100 text-blue-700" },
      available: { label: "Available", variant: "default", className: "bg-emerald-500" },
      break: { label: "On Break", variant: "outline", className: "text-amber-600 border-amber-300" },
      offline: { label: "Offline", variant: "secondary", className: "" },
    };
    const c = config[status] || config.offline;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Tracking</h1>
          <p className="text-muted-foreground">
            Real-time driver locations and status from MediRoute
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold">{stats.totalActive}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Trip</p>
                <p className="text-2xl font-bold text-green-600">{stats.onTrip}</p>
              </div>
              <Car className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">En Route</p>
                <p className="text-2xl font-bold text-blue-600">{stats.enRoute}</p>
              </div>
              <Navigation className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-emerald-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-emerald-600">{stats.available}</p>
              </div>
              <User className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Break</p>
                <p className="text-2xl font-bold text-amber-600">{stats.onBreak}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Map Placeholder */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-orange-500" />
              Live Map
            </CardTitle>
            <CardDescription>Real-time driver locations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed">
              <div className="text-center">
                <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Map Integration</p>
                <p className="text-sm text-muted-foreground">Google Maps / MediRoute GPS Feed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common dispatch operations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              <MessageSquare className="mr-2 h-4 w-4" />
              Send Group Message
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Navigation className="mr-2 h-4 w-4" />
              Reassign Trip
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Phone className="mr-2 h-4 w-4" />
              Contact Driver
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync All Drivers
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by driver name or vehicle..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="on_trip">On Trip</SelectItem>
                <SelectItem value="en_route">En Route</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="break">On Break</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                <SelectItem value="vb">Virginia Beach</SelectItem>
                <SelectItem value="nfk">Norfolk</SelectItem>
                <SelectItem value="hpt">Hampton</SelectItem>
                <SelectItem value="nn">Newport News</SelectItem>
                <SelectItem value="ches">Chesapeake</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Driver List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {activeDrivers.map((driver) => (
          <Card key={driver.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium">{driver.name}</h3>
                    <p className="text-sm text-muted-foreground">Vehicle #{driver.vehicleNumber}</p>
                  </div>
                </div>
                {getStatusBadge(driver.status)}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{driver.location}</span>
                  <span className="text-muted-foreground">• {driver.lastUpdate}</span>
                </div>

                {driver.currentTrip && (
                  <div className="p-2 rounded bg-muted/50">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Current Trip:</span>
                      <span className="font-medium">{driver.currentTrip}</span>
                    </div>
                    {driver.eta && (
                      <div className="flex items-center justify-between text-sm mt-1">
                        <span className="text-muted-foreground">ETA:</span>
                        <span className="font-medium text-green-600">{driver.eta}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <div>
                    <span className="text-muted-foreground">Completed: </span>
                    <span className="font-medium">{driver.tripsCompleted}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Remaining: </span>
                    <span className="font-medium">{driver.tripsRemaining}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Phone className="h-4 w-4 mr-1" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <MessageSquare className="h-4 w-4 mr-1" />
                    Text
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
