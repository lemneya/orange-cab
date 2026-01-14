import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Navigation, 
  Search, 
  Filter, 
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  User,
  Car,
  RefreshCw,
  Send
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function TripManagement() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data - would come from MediRoute API
  const trips = [
    {
      id: 1,
      tripId: "MR-2026-001234",
      memberId: "MOD-12345",
      memberName: "Mary Johnson",
      pickupTime: "2026-01-13 08:00",
      pickupAddress: "123 Main St, Virginia Beach, VA",
      dropoffAddress: "Sentara Hospital, 1060 First Colonial Rd",
      tripType: "medical",
      vehicleType: "standard",
      assignedDriver: "John Smith",
      assignedVehicle: "1001",
      status: "in_progress",
      eta: "08:15"
    },
    {
      id: 2,
      tripId: "MR-2026-001235",
      memberId: "MOD-12346",
      memberName: "Robert Williams",
      pickupTime: "2026-01-13 08:30",
      pickupAddress: "456 Oak Ave, Norfolk, VA",
      dropoffAddress: "VA Medical Center, 6720 E Virginia Beach Blvd",
      tripType: "dialysis",
      vehicleType: "wheelchair",
      assignedDriver: "Mike Johnson",
      assignedVehicle: "1002",
      status: "assigned",
      eta: null
    },
    {
      id: 3,
      tripId: "MR-2026-001236",
      memberId: "MOD-12347",
      memberName: "Sarah Davis",
      pickupTime: "2026-01-13 09:00",
      pickupAddress: "789 Pine St, Hampton, VA",
      dropoffAddress: "Hampton VA Medical Center",
      tripType: "medical",
      vehicleType: "standard",
      assignedDriver: null,
      assignedVehicle: null,
      status: "pending",
      eta: null
    },
    {
      id: 4,
      tripId: "MR-2026-001237",
      memberId: "MOD-12348",
      memberName: "James Brown",
      pickupTime: "2026-01-13 07:30",
      pickupAddress: "321 Elm St, Newport News, VA",
      dropoffAddress: "Riverside Regional Medical Center",
      tripType: "dialysis",
      vehicleType: "standard",
      assignedDriver: "Sarah Davis",
      assignedVehicle: "1003",
      status: "completed",
      eta: null,
      completedTime: "08:45"
    },
    {
      id: 5,
      tripId: "MR-2026-001238",
      memberId: "MOD-12349",
      memberName: "Emily Wilson",
      pickupTime: "2026-01-13 09:30",
      pickupAddress: "555 Beach Rd, Virginia Beach, VA",
      dropoffAddress: "Bon Secours DePaul Medical Center",
      tripType: "medical",
      vehicleType: "wheelchair",
      assignedDriver: null,
      assignedVehicle: null,
      status: "pending",
      eta: null
    },
  ];

  const stats = {
    totalToday: 156,
    pending: 23,
    assigned: 45,
    inProgress: 38,
    completed: 50,
    cancelled: 0
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { label: "Pending", variant: "outline", className: "border-amber-300 text-amber-700" },
      assigned: { label: "Assigned", variant: "secondary", className: "bg-blue-100 text-blue-700" },
      in_progress: { label: "In Progress", variant: "default", className: "bg-green-500" },
      completed: { label: "Completed", variant: "default", className: "bg-gray-500" },
      cancelled: { label: "Cancelled", variant: "destructive", className: "" },
      no_show: { label: "No Show", variant: "destructive", className: "" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const getVehicleTypeBadge = (type: string) => {
    return type === "wheelchair" ? (
      <Badge variant="secondary" className="bg-purple-100 text-purple-700">Wheelchair</Badge>
    ) : (
      <Badge variant="outline">Standard</Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trip Management</h1>
          <p className="text-muted-foreground">
            Manage and dispatch MediRoute trips from ModivCare
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync MediRoute
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Send className="mr-2 h-4 w-4" />
            Dispatch Selected
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Today</p>
                <p className="text-2xl font-bold">{stats.totalToday}</p>
              </div>
              <Navigation className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Assigned</p>
                <p className="text-2xl font-bold text-blue-600">{stats.assigned}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-green-600">{stats.inProgress}</p>
              </div>
              <Car className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Alert */}
      {stats.pending > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <h3 className="font-semibold text-amber-700">{stats.pending} Trips Need Assignment</h3>
                <p className="text-sm text-amber-600">
                  These trips are pending driver assignment. Dispatch them to available drivers.
                </p>
              </div>
              <Button variant="outline" className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100">
                View Pending
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                  placeholder="Search by trip ID, member, or address..."
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
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="wheelchair">Wheelchair</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="today">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Trips Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip ID</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Pickup Time</TableHead>
                <TableHead>Pickup Location</TableHead>
                <TableHead>Destination</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium">{trip.tripId}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.memberName}</div>
                      <div className="text-xs text-muted-foreground">{trip.memberId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      {new Date(trip.pickupTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="truncate">{trip.pickupAddress}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[150px]">
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="h-4 w-4 text-red-500 flex-shrink-0" />
                      <span className="truncate">{trip.dropoffAddress}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getVehicleTypeBadge(trip.vehicleType)}</TableCell>
                  <TableCell>
                    {trip.assignedDriver || <span className="text-amber-600">Unassigned</span>}
                  </TableCell>
                  <TableCell>
                    {trip.assignedVehicle ? `#${trip.assignedVehicle}` : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {trip.status === "pending" && (
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                          Assign
                        </Button>
                      )}
                      {trip.status === "assigned" && (
                        <Button size="sm" variant="outline">
                          Dispatch
                        </Button>
                      )}
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MediRoute Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle>MediRoute Integration</CardTitle>
          <CardDescription>Real-time connection with ModivCare's MediRoute system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="font-medium text-green-700">API Connected</span>
              </div>
              <p className="text-sm text-muted-foreground">Last sync: 2 min ago</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Trips This Week</p>
              <p className="text-2xl font-bold">892</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Completion Rate</p>
              <p className="text-2xl font-bold text-green-600">98.5%</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">On-Time Rate</p>
              <p className="text-2xl font-bold text-blue-600">96.2%</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
