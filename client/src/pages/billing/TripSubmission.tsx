import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  Send, 
  Search, 
  Filter, 
  Clock,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  FileText,
  RefreshCw
} from "lucide-react";
import { useState } from "react";

export default function TripSubmission() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedTrips, setSelectedTrips] = useState<number[]>([]);

  // Mock data - would come from MediRoute/ModivCare API
  const trips = [
    {
      id: 1,
      tripId: "MR-2026-001234",
      memberId: "MOD-12345",
      memberName: "Mary Johnson",
      serviceDate: "2026-01-12",
      pickupTime: "08:00",
      dropoffTime: "08:35",
      actualPickup: "08:02",
      actualDropoff: "08:38",
      tripType: "medical",
      rate: 44.00,
      status: "ready",
      needsAdjustment: false
    },
    {
      id: 2,
      tripId: "MR-2026-001235",
      memberId: "MOD-12346",
      memberName: "Robert Williams",
      serviceDate: "2026-01-12",
      pickupTime: "08:30",
      dropoffTime: "09:15",
      actualPickup: "08:45",
      actualDropoff: "09:30",
      tripType: "dialysis",
      rate: 52.00,
      status: "needs_adjustment",
      needsAdjustment: true,
      adjustmentReason: "Late pickup - traffic delay"
    },
    {
      id: 3,
      tripId: "MR-2026-001236",
      memberId: "MOD-12347",
      memberName: "Sarah Davis",
      serviceDate: "2026-01-12",
      pickupTime: "09:00",
      dropoffTime: "09:45",
      actualPickup: "09:00",
      actualDropoff: "09:42",
      tripType: "medical",
      rate: 44.00,
      status: "ready",
      needsAdjustment: false
    },
    {
      id: 4,
      tripId: "MR-2026-001237",
      memberId: "MOD-12348",
      memberName: "James Brown",
      serviceDate: "2026-01-12",
      pickupTime: "07:30",
      dropoffTime: "08:15",
      actualPickup: "07:28",
      actualDropoff: "08:10",
      tripType: "dialysis",
      rate: 52.00,
      status: "submitted",
      needsAdjustment: false
    },
    {
      id: 5,
      tripId: "MR-2026-001238",
      memberId: "MOD-12349",
      memberName: "Emily Wilson",
      serviceDate: "2026-01-12",
      pickupTime: "09:30",
      dropoffTime: "10:15",
      actualPickup: "09:55",
      actualDropoff: "10:40",
      tripType: "medical",
      rate: 44.00,
      status: "needs_adjustment",
      needsAdjustment: true,
      adjustmentReason: "Significant time variance"
    },
  ];

  const stats = {
    readyToSubmit: 45,
    needsAdjustment: 12,
    submitted: 89,
    totalValue: 6840.00
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      ready: { label: "Ready", variant: "default", className: "bg-green-500" },
      needs_adjustment: { label: "Needs Adjustment", variant: "secondary", className: "bg-amber-100 text-amber-700" },
      submitted: { label: "Submitted", variant: "secondary", className: "bg-blue-100 text-blue-700" },
      paid: { label: "Paid", variant: "default", className: "bg-gray-500" },
      rejected: { label: "Rejected", variant: "destructive", className: "" },
    };
    const c = config[status] || config.ready;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const toggleSelectAll = () => {
    const readyTrips = trips.filter(t => t.status === "ready").map(t => t.id);
    if (selectedTrips.length === readyTrips.length) {
      setSelectedTrips([]);
    } else {
      setSelectedTrips(readyTrips);
    }
  };

  const toggleTrip = (tripId: number) => {
    setSelectedTrips(prev => 
      prev.includes(tripId) 
        ? prev.filter(id => id !== tripId)
        : [...prev, tripId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trip Submission</h1>
          <p className="text-muted-foreground">
            Submit completed trips to ModivCare billing portal
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Sync from MediRoute
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600"
            disabled={selectedTrips.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Selected ({selectedTrips.length})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ready to Submit</p>
                <p className="text-2xl font-bold text-green-600">{stats.readyToSubmit}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Needs Adjustment</p>
                <p className="text-2xl font-bold text-amber-600">{stats.needsAdjustment}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Submitted Today</p>
                <p className="text-2xl font-bold text-blue-600">{stats.submitted}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Value</p>
                <p className="text-2xl font-bold text-orange-600">${stats.totalValue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Adjustment Alert */}
      {stats.needsAdjustment > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <div>
                <h3 className="font-semibold text-amber-700">{stats.needsAdjustment} Trips Need Time Adjustment</h3>
                <p className="text-sm text-amber-600">
                  These trips have time variances that need to be adjusted before submission to ModivCare.
                </p>
              </div>
              <Button variant="outline" className="ml-auto border-amber-300 text-amber-700 hover:bg-amber-100">
                View Adjustments
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
                  placeholder="Search by trip ID or member..."
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
                <SelectItem value="ready">Ready to Submit</SelectItem>
                <SelectItem value="needs_adjustment">Needs Adjustment</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="today">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Service Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
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
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedTrips.length === trips.filter(t => t.status === "ready").length && selectedTrips.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Trip ID</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Scheduled Time</TableHead>
                <TableHead>Actual Time</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map((trip) => (
                <TableRow key={trip.id} className={trip.needsAdjustment ? "bg-amber-50/50" : ""}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedTrips.includes(trip.id)}
                      onCheckedChange={() => toggleTrip(trip.id)}
                      disabled={trip.status !== "ready"}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{trip.tripId}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{trip.memberName}</div>
                      <div className="text-xs text-muted-foreground">{trip.memberId}</div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(trip.serviceDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{trip.pickupTime} - {trip.dropoffTime}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className={trip.needsAdjustment ? "text-amber-600 font-medium" : ""}>
                        {trip.actualPickup} - {trip.actualDropoff}
                      </div>
                      {trip.needsAdjustment && (
                        <div className="text-xs text-amber-600">{trip.adjustmentReason}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${trip.rate.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(trip.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {trip.status === "needs_adjustment" && (
                        <Button size="sm" variant="outline">Adjust</Button>
                      )}
                      {trip.status === "ready" && (
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Submit</Button>
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

      {/* ModivCare Rate Info */}
      <Card>
        <CardHeader>
          <CardTitle>ModivCare Rate Schedule</CardTitle>
          <CardDescription>Current contracted rates with ModivCare</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium">Standard Trip</h4>
              <p className="text-2xl font-bold mt-2">$44.00</p>
              <p className="text-sm text-muted-foreground">Base rate</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium">Wheelchair Trip</h4>
              <p className="text-2xl font-bold mt-2">$52.00</p>
              <p className="text-sm text-muted-foreground">Wheelchair accessible</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium">Long Distance</h4>
              <p className="text-2xl font-bold mt-2">$1.85/mi</p>
              <p className="text-sm text-muted-foreground">Over 25 miles</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium">Wait Time</h4>
              <p className="text-2xl font-bold mt-2">$0.50/min</p>
              <p className="text-sm text-muted-foreground">After 15 min</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
