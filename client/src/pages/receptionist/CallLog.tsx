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
  Phone, 
  Plus, 
  Search, 
  Filter, 
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Clock,
  User,
  MessageSquare
} from "lucide-react";
import { useState } from "react";

export default function CallLog() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [isNewCallOpen, setIsNewCallOpen] = useState(false);

  // Mock data - would come from API
  const calls = [
    {
      id: 1,
      timestamp: "2026-01-13 09:45:00",
      type: "incoming",
      callerName: "Mary Johnson",
      callerPhone: "(757) 555-0301",
      callerType: "customer",
      subject: "Trip inquiry for tomorrow",
      notes: "Customer asking about wheelchair accessible vehicle availability for medical appointment",
      status: "resolved",
      forwardedTo: null,
      duration: "5:32"
    },
    {
      id: 2,
      timestamp: "2026-01-13 09:30:00",
      type: "incoming",
      callerName: "Driver John Smith",
      callerPhone: "(757) 555-0101",
      callerType: "driver",
      subject: "Vehicle issue report",
      notes: "Reporting check engine light on vehicle #1015. Forwarded to dispatch.",
      status: "forwarded",
      forwardedTo: "Dispatch",
      duration: "3:15"
    },
    {
      id: 3,
      timestamp: "2026-01-13 09:15:00",
      type: "outgoing",
      callerName: "ModivCare Support",
      callerPhone: "(800) 555-0400",
      callerType: "vendor",
      subject: "Trip confirmation follow-up",
      notes: "Called to confirm trip details for member ID 12345",
      status: "resolved",
      forwardedTo: null,
      duration: "8:45"
    },
    {
      id: 4,
      timestamp: "2026-01-13 08:55:00",
      type: "missed",
      callerName: "Unknown",
      callerPhone: "(757) 555-0999",
      callerType: "unknown",
      subject: "Missed call",
      notes: "No voicemail left. Attempted callback - no answer.",
      status: "pending",
      forwardedTo: null,
      duration: null
    },
    {
      id: 5,
      timestamp: "2026-01-13 08:30:00",
      type: "incoming",
      callerName: "Insurance Agent - State Farm",
      callerPhone: "(757) 555-0500",
      callerType: "vendor",
      subject: "Policy renewal discussion",
      notes: "Discussing fleet insurance renewal. Need to schedule meeting with director.",
      status: "follow_up",
      forwardedTo: "Director",
      duration: "12:20"
    },
  ];

  const stats = {
    totalToday: 28,
    incoming: 20,
    outgoing: 5,
    missed: 3,
    avgDuration: "4:35"
  };

  const getCallTypeIcon = (type: string) => {
    switch (type) {
      case "incoming":
        return <PhoneIncoming className="h-4 w-4 text-green-500" />;
      case "outgoing":
        return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
      case "missed":
        return <PhoneMissed className="h-4 w-4 text-red-500" />;
      default:
        return <Phone className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      resolved: { label: "Resolved", variant: "default", className: "bg-green-500" },
      forwarded: { label: "Forwarded", variant: "secondary", className: "bg-blue-100 text-blue-700" },
      pending: { label: "Pending", variant: "outline", className: "" },
      follow_up: { label: "Follow Up", variant: "secondary", className: "bg-amber-100 text-amber-700" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const getCallerTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      customer: { label: "Customer", className: "bg-purple-100 text-purple-700" },
      driver: { label: "Driver", className: "bg-orange-100 text-orange-700" },
      vendor: { label: "Vendor", className: "bg-gray-100 text-gray-700" },
      unknown: { label: "Unknown", className: "bg-gray-100 text-gray-500" },
    };
    const c = config[type] || config.unknown;
    return <Badge variant="secondary" className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Call Log</h1>
          <p className="text-muted-foreground">
            Track and manage all incoming and outgoing calls
          </p>
        </div>
        <Dialog open={isNewCallOpen} onOpenChange={setIsNewCallOpen}>
          <DialogTrigger asChild>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              Log Call
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Log New Call</DialogTitle>
              <DialogDescription>Record details of a phone call</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Call Type</Label>
                  <Select defaultValue="incoming">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="incoming">Incoming</SelectItem>
                      <SelectItem value="outgoing">Outgoing</SelectItem>
                      <SelectItem value="missed">Missed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Caller Type</Label>
                  <Select defaultValue="customer">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="driver">Driver</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                      <SelectItem value="unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Caller Name</Label>
                <Input placeholder="Enter caller name" />
              </div>
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input placeholder="(757) 555-0000" />
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input placeholder="Brief description of call" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Detailed notes about the call..." rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Forward To</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dispatch">Dispatch</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="hr">HR</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input placeholder="0:00" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsNewCallOpen(false)}>Cancel</Button>
                <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsNewCallOpen(false)}>
                  Save Call
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Today</p>
                <p className="text-2xl font-bold">{stats.totalToday}</p>
              </div>
              <Phone className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Incoming</p>
                <p className="text-2xl font-bold text-green-600">{stats.incoming}</p>
              </div>
              <PhoneIncoming className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Outgoing</p>
                <p className="text-2xl font-bold text-blue-600">{stats.outgoing}</p>
              </div>
              <PhoneOutgoing className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Missed</p>
                <p className="text-2xl font-bold text-red-600">{stats.missed}</p>
              </div>
              <PhoneMissed className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Duration</p>
                <p className="text-2xl font-bold">{stats.avgDuration}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
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
                  placeholder="Search by name, phone, or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Call Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="incoming">Incoming</SelectItem>
                <SelectItem value="outgoing">Outgoing</SelectItem>
                <SelectItem value="missed">Missed</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="today">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Date Range" />
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

      {/* Call Log Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Caller</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {calls.map((call) => (
                <TableRow key={call.id}>
                  <TableCell className="text-sm">
                    {new Date(call.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getCallTypeIcon(call.type)}
                      <span className="capitalize">{call.type}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="font-medium">{call.callerName}</div>
                        {getCallerTypeBadge(call.callerType)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{call.callerPhone}</TableCell>
                  <TableCell className="max-w-[200px]">
                    <div className="truncate">{call.subject}</div>
                    {call.forwardedTo && (
                      <div className="text-xs text-muted-foreground">→ {call.forwardedTo}</div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(call.status)}</TableCell>
                  <TableCell>{call.duration || '-'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">View</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
