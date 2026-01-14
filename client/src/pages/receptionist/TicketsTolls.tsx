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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  DollarSign,
  Car,
  Upload,
  Clock
} from "lucide-react";
import { useState } from "react";

export default function TicketsTolls() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data - would come from API
  const tickets = [
    {
      id: 1,
      ticketNumber: "TKT-2026-001",
      type: "parking",
      vehicleNumber: "1015",
      driverName: "John Smith",
      issueDate: "2026-01-10",
      dueDate: "2026-01-25",
      amount: 50.00,
      location: "Norfolk, VA",
      status: "pending",
      assignedTo: "driver"
    },
    {
      id: 2,
      ticketNumber: "TKT-2026-002",
      type: "speeding",
      vehicleNumber: "1022",
      driverName: "Mike Johnson",
      issueDate: "2026-01-08",
      dueDate: "2026-02-08",
      amount: 150.00,
      location: "Virginia Beach, VA",
      status: "pending",
      assignedTo: "driver"
    },
    {
      id: 3,
      ticketNumber: "TKT-2025-098",
      type: "red_light",
      vehicleNumber: "1003",
      driverName: "Sarah Davis",
      issueDate: "2025-12-15",
      dueDate: "2026-01-15",
      amount: 200.00,
      location: "Hampton, VA",
      status: "paid",
      assignedTo: "company",
      paidDate: "2026-01-05"
    },
  ];

  const tolls = [
    {
      id: 1,
      transactionId: "TOLL-2026-0001",
      vehicleNumber: "1001",
      driverName: "John Smith",
      date: "2026-01-13",
      tollway: "Elizabeth River Tunnels",
      amount: 5.50,
      status: "pending"
    },
    {
      id: 2,
      transactionId: "TOLL-2026-0002",
      vehicleNumber: "1002",
      driverName: "Mike Johnson",
      date: "2026-01-13",
      tollway: "HRBT",
      amount: 4.00,
      status: "pending"
    },
    {
      id: 3,
      transactionId: "TOLL-2026-0003",
      vehicleNumber: "1005",
      driverName: "David Wilson",
      date: "2026-01-12",
      tollway: "Elizabeth River Tunnels",
      amount: 5.50,
      status: "processed"
    },
    {
      id: 4,
      transactionId: "TOLL-2026-0004",
      vehicleNumber: "1008",
      driverName: "Emily Brown",
      date: "2026-01-12",
      tollway: "Chesapeake Expressway",
      amount: 8.00,
      status: "processed"
    },
  ];

  const stats = {
    pendingTickets: 5,
    ticketAmount: 650.00,
    monthlyTolls: 1250.00,
    overdueTickets: 1
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { label: "Pending", variant: "outline", className: "" },
      paid: { label: "Paid", variant: "default", className: "bg-green-500" },
      overdue: { label: "Overdue", variant: "destructive", className: "" },
      disputed: { label: "Disputed", variant: "secondary", className: "bg-amber-100 text-amber-700" },
      processed: { label: "Processed", variant: "default", className: "bg-green-500" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const getTicketTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      parking: { label: "Parking", className: "bg-blue-100 text-blue-700" },
      speeding: { label: "Speeding", className: "bg-red-100 text-red-700" },
      red_light: { label: "Red Light", className: "bg-amber-100 text-amber-700" },
      other: { label: "Other", className: "bg-gray-100 text-gray-700" },
    };
    const c = config[type] || config.other;
    return <Badge variant="secondary" className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tickets & Tolls</h1>
          <p className="text-muted-foreground">
            Manage traffic tickets and toll charges
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Import Tolls
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Add Ticket
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Tickets</p>
                <p className="text-2xl font-bold">{stats.pendingTickets}</p>
              </div>
              <Receipt className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Amount Due</p>
                <p className="text-2xl font-bold text-amber-600">${stats.ticketAmount.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Monthly Tolls</p>
                <p className="text-2xl font-bold">${stats.monthlyTolls.toFixed(2)}</p>
              </div>
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdueTickets}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tickets" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">Traffic Tickets</TabsTrigger>
          <TabsTrigger value="tolls">Toll Charges</TabsTrigger>
        </TabsList>

        {/* Tickets Tab */}
        <TabsContent value="tickets" className="space-y-4">
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
                      placeholder="Search by ticket #, vehicle, or driver..."
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
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="disputed">Disputed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tickets Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket #</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.map((ticket) => (
                    <TableRow key={ticket.id}>
                      <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                      <TableCell>{getTicketTypeBadge(ticket.type)}</TableCell>
                      <TableCell>#{ticket.vehicleNumber}</TableCell>
                      <TableCell>{ticket.driverName}</TableCell>
                      <TableCell>{new Date(ticket.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {new Date(ticket.dueDate) < new Date() && ticket.status === "pending" && (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                          {new Date(ticket.dueDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>${ticket.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">{ticket.assignedTo}</Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm">View</Button>
                          {ticket.status === "pending" && (
                            <Button variant="outline" size="sm">Mark Paid</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tolls Tab */}
        <TabsContent value="tolls" className="space-y-4">
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
                      placeholder="Search by vehicle or driver..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <Select defaultValue="week">
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Date Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                    <SelectItem value="quarter">This Quarter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tolls Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transaction ID</TableHead>
                    <TableHead>Vehicle</TableHead>
                    <TableHead>Driver</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Tollway</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tolls.map((toll) => (
                    <TableRow key={toll.id}>
                      <TableCell className="font-medium">{toll.transactionId}</TableCell>
                      <TableCell>#{toll.vehicleNumber}</TableCell>
                      <TableCell>{toll.driverName}</TableCell>
                      <TableCell>{new Date(toll.date).toLocaleDateString()}</TableCell>
                      <TableCell>{toll.tollway}</TableCell>
                      <TableCell>${toll.amount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(toll.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Toll Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Toll Summary by Tollway</CardTitle>
              <CardDescription>This month's toll charges by location</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium">Elizabeth River Tunnels</h4>
                  <p className="text-2xl font-bold mt-2">$485.00</p>
                  <p className="text-sm text-muted-foreground">88 transactions</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium">HRBT</h4>
                  <p className="text-2xl font-bold mt-2">$320.00</p>
                  <p className="text-sm text-muted-foreground">80 transactions</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium">Chesapeake Expressway</h4>
                  <p className="text-2xl font-bold mt-2">$445.00</p>
                  <p className="text-sm text-muted-foreground">56 transactions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
