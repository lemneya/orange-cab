import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Clock, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle,
  Edit,
  Save
} from "lucide-react";
import { useState } from "react";

export default function TimeAdjustments() {
  const [search, setSearch] = useState("");
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<any>(null);

  // Mock data - trips needing time adjustment
  const pendingAdjustments = [
    {
      id: 1,
      tripId: "MR-2026-001235",
      memberId: "MOD-12346",
      memberName: "Robert Williams",
      serviceDate: "2026-01-12",
      scheduledPickup: "08:30",
      scheduledDropoff: "09:15",
      actualPickup: "08:45",
      actualDropoff: "09:30",
      variance: "+15 min",
      reason: "traffic_delay",
      status: "pending"
    },
    {
      id: 2,
      tripId: "MR-2026-001238",
      memberId: "MOD-12349",
      memberName: "Emily Wilson",
      serviceDate: "2026-01-12",
      scheduledPickup: "09:30",
      scheduledDropoff: "10:15",
      actualPickup: "09:55",
      actualDropoff: "10:40",
      variance: "+25 min",
      reason: "member_not_ready",
      status: "pending"
    },
    {
      id: 3,
      tripId: "MR-2026-001242",
      memberId: "MOD-12352",
      memberName: "Michael Chen",
      serviceDate: "2026-01-12",
      scheduledPickup: "10:00",
      scheduledDropoff: "10:45",
      actualPickup: "10:20",
      actualDropoff: "11:05",
      variance: "+20 min",
      reason: "facility_delay",
      status: "pending"
    },
  ];

  const recentAdjustments = [
    {
      id: 4,
      tripId: "MR-2026-001220",
      memberName: "John Davis",
      serviceDate: "2026-01-11",
      variance: "+10 min",
      adjustedBy: "Billing Agent",
      adjustedAt: "2026-01-12 09:30",
      status: "approved"
    },
    {
      id: 5,
      tripId: "MR-2026-001218",
      memberName: "Lisa Anderson",
      serviceDate: "2026-01-11",
      variance: "+18 min",
      adjustedBy: "Billing Agent",
      adjustedAt: "2026-01-12 09:25",
      status: "approved"
    },
  ];

  const stats = {
    pendingAdjustments: 12,
    adjustedToday: 8,
    avgVariance: "14 min",
    approvalRate: 95
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { label: "Pending", variant: "outline", className: "border-amber-300 text-amber-700" },
      approved: { label: "Approved", variant: "default", className: "bg-green-500" },
      rejected: { label: "Rejected", variant: "destructive", className: "" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      traffic_delay: "Traffic Delay",
      member_not_ready: "Member Not Ready",
      facility_delay: "Facility Delay",
      vehicle_issue: "Vehicle Issue",
      weather: "Weather",
      other: "Other"
    };
    return labels[reason] || reason;
  };

  const openAdjustDialog = (trip: any) => {
    setSelectedTrip(trip);
    setIsAdjustOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Time Adjustments</h1>
          <p className="text-muted-foreground">
            Adjust trip times to match original schedule before ModivCare submission
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Adjustments</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingAdjustments}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adjusted Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.adjustedToday}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Variance</p>
                <p className="text-2xl font-bold">{stats.avgVariance}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                <p className="text-2xl font-bold text-blue-600">{stats.approvalRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <Clock className="h-8 w-8 text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-700">Time Adjustment Process</h3>
              <p className="text-sm text-blue-600 mt-1">
                When actual trip times differ from scheduled times, adjustments must be made to match the original 
                schedule before submitting to ModivCare. This ensures billing accuracy and compliance with contracted rates.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Reason" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reasons</SelectItem>
                <SelectItem value="traffic_delay">Traffic Delay</SelectItem>
                <SelectItem value="member_not_ready">Member Not Ready</SelectItem>
                <SelectItem value="facility_delay">Facility Delay</SelectItem>
                <SelectItem value="vehicle_issue">Vehicle Issue</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="today">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Pending Adjustments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Pending Adjustments
          </CardTitle>
          <CardDescription>Trips requiring time adjustment before submission</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip ID</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Actual</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingAdjustments.map((trip) => (
                <TableRow key={trip.id}>
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
                      {trip.scheduledPickup} - {trip.scheduledDropoff}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-amber-600 font-medium">
                      {trip.actualPickup} - {trip.actualDropoff}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                      {trip.variance}
                    </Badge>
                  </TableCell>
                  <TableCell>{getReasonLabel(trip.reason)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      size="sm" 
                      className="bg-orange-500 hover:bg-orange-600"
                      onClick={() => openAdjustDialog(trip)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Adjust
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Adjustments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Recent Adjustments
          </CardTitle>
          <CardDescription>Recently processed time adjustments</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Trip ID</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Service Date</TableHead>
                <TableHead>Variance</TableHead>
                <TableHead>Adjusted By</TableHead>
                <TableHead>Adjusted At</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentAdjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell className="font-medium">{adj.tripId}</TableCell>
                  <TableCell>{adj.memberName}</TableCell>
                  <TableCell>{new Date(adj.serviceDate).toLocaleDateString()}</TableCell>
                  <TableCell>{adj.variance}</TableCell>
                  <TableCell>{adj.adjustedBy}</TableCell>
                  <TableCell>{new Date(adj.adjustedAt).toLocaleString()}</TableCell>
                  <TableCell>{getStatusBadge(adj.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Adjustment Dialog */}
      <Dialog open={isAdjustOpen} onOpenChange={setIsAdjustOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adjust Trip Time</DialogTitle>
            <DialogDescription>
              Modify the actual times to match the scheduled times for billing
            </DialogDescription>
          </DialogHeader>
          {selectedTrip && (
            <div className="space-y-4 py-4">
              <div className="p-3 rounded-lg bg-muted/50">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Trip ID:</span>
                  <span className="font-medium">{selectedTrip.tripId}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">Member:</span>
                  <span className="font-medium">{selectedTrip.memberName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Scheduled</Label>
                  <div className="p-2 rounded bg-muted/50 mt-1">
                    <p className="font-medium">{selectedTrip.scheduledPickup} - {selectedTrip.scheduledDropoff}</p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Actual</Label>
                  <div className="p-2 rounded bg-amber-50 mt-1">
                    <p className="font-medium text-amber-700">{selectedTrip.actualPickup} - {selectedTrip.actualDropoff}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Adjusted Pickup Time</Label>
                  <Input type="time" defaultValue={selectedTrip.scheduledPickup} />
                </div>
                <div className="space-y-2">
                  <Label>Adjusted Dropoff Time</Label>
                  <Input type="time" defaultValue={selectedTrip.scheduledDropoff} />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Adjustment Reason</Label>
                <Select defaultValue={selectedTrip.reason}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="traffic_delay">Traffic Delay</SelectItem>
                    <SelectItem value="member_not_ready">Member Not Ready</SelectItem>
                    <SelectItem value="facility_delay">Facility Delay</SelectItem>
                    <SelectItem value="vehicle_issue">Vehicle Issue</SelectItem>
                    <SelectItem value="weather">Weather</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Additional notes about the adjustment..." rows={2} />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAdjustOpen(false)}>Cancel</Button>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsAdjustOpen(false)}>
                  <Save className="h-4 w-4 mr-1" />
                  Save Adjustment
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
