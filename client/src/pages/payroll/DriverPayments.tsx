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
  DollarSign, 
  Search, 
  Filter, 
  Download,
  Send,
  CheckCircle,
  Clock,
  Users,
  FileText
} from "lucide-react";
import { useState } from "react";

export default function DriverPayments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);

  // Mock data - would come from MediRoute completed trips
  const driverPayments = [
    {
      id: 1,
      name: "John Smith",
      driverId: "DRV-001",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 48,
      miles: 720,
      grossPay: 2112.00,
      deductions: 0,
      netPay: 2112.00,
      rate: 44.00,
      status: "pending"
    },
    {
      id: 2,
      name: "Mike Johnson",
      driverId: "DRV-002",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 45,
      miles: 680,
      grossPay: 2340.00,
      deductions: 0,
      netPay: 2340.00,
      rate: 52.00,
      status: "pending"
    },
    {
      id: 3,
      name: "Sarah Davis",
      driverId: "DRV-003",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 42,
      miles: 630,
      grossPay: 1848.00,
      deductions: 50.00,
      netPay: 1798.00,
      rate: 44.00,
      status: "pending",
      deductionReason: "Toll violation"
    },
    {
      id: 4,
      name: "David Wilson",
      driverId: "DRV-004",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 50,
      miles: 750,
      grossPay: 2200.00,
      deductions: 0,
      netPay: 2200.00,
      rate: 44.00,
      status: "processed"
    },
    {
      id: 5,
      name: "Emily Brown",
      driverId: "DRV-005",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 38,
      miles: 570,
      grossPay: 1976.00,
      deductions: 0,
      netPay: 1976.00,
      rate: 52.00,
      status: "processed"
    },
  ];

  const stats = {
    totalDrivers: 40,
    pendingPayments: 35,
    totalPayout: 78500.00,
    avgPayment: 1962.50
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { label: "Pending", variant: "outline", className: "border-amber-300 text-amber-700" },
      processed: { label: "Processed", variant: "default", className: "bg-green-500" },
      paid: { label: "Paid", variant: "default", className: "bg-blue-500" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const toggleSelectAll = () => {
    const pendingDrivers = driverPayments.filter(d => d.status === "pending").map(d => d.id);
    if (selectedDrivers.length === pendingDrivers.length) {
      setSelectedDrivers([]);
    } else {
      setSelectedDrivers(pendingDrivers);
    }
  };

  const toggleDriver = (driverId: number) => {
    setSelectedDrivers(prev => 
      prev.includes(driverId) 
        ? prev.filter(id => id !== driverId)
        : [...prev, driverId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Payments</h1>
          <p className="text-muted-foreground">
            Process weekly payments for 1099 contract drivers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Download Completed Trips
          </Button>
          <Button 
            className="bg-orange-500 hover:bg-orange-600"
            disabled={selectedDrivers.length === 0}
          >
            <Send className="mr-2 h-4 w-4" />
            Process Selected ({selectedDrivers.length})
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Drivers</p>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pendingPayments}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Payout</p>
                <p className="text-2xl font-bold text-orange-600">${stats.totalPayout.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Payment</p>
                <p className="text-2xl font-bold">${stats.avgPayment.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pay Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select defaultValue="current">
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Select Week" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Week Ending Jan 12, 2026</SelectItem>
                <SelectItem value="prev1">Week Ending Jan 5, 2026</SelectItem>
                <SelectItem value="prev2">Week Ending Dec 29, 2025</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Import from MediRoute
              </Button>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export Payroll
              </Button>
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
                  placeholder="Search by driver name or ID..."
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
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={selectedDrivers.length === driverPayments.filter(d => d.status === "pending").length && selectedDrivers.length > 0}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Week Ending</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead>Miles</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Gross Pay</TableHead>
                <TableHead>Deductions</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverPayments.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell>
                    <Checkbox 
                      checked={selectedDrivers.includes(driver.id)}
                      onCheckedChange={() => toggleDriver(driver.id)}
                      disabled={driver.status !== "pending"}
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{driver.name}</div>
                      <div className="text-xs text-muted-foreground">{driver.driverId}</div>
                    </div>
                  </TableCell>
                  <TableCell>{new Date(driver.weekEnding).toLocaleDateString()}</TableCell>
                  <TableCell>{driver.trips}</TableCell>
                  <TableCell>{driver.miles} mi</TableCell>
                  <TableCell>${driver.rate.toFixed(2)}</TableCell>
                  <TableCell>${driver.grossPay.toFixed(2)}</TableCell>
                  <TableCell>
                    {driver.deductions > 0 ? (
                      <div>
                        <span className="text-red-600">-${driver.deductions.toFixed(2)}</span>
                        {driver.deductionReason && (
                          <div className="text-xs text-muted-foreground">{driver.deductionReason}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">$0.00</span>
                    )}
                  </TableCell>
                  <TableCell className="font-bold">${driver.netPay.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(driver.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {driver.status === "pending" && (
                        <Button size="sm" className="bg-orange-500 hover:bg-orange-600">Process</Button>
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

      {/* Payment Rates Info */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Payment Rates</CardTitle>
          <CardDescription>Current contracted rates for 1099 drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium">Standard Trip</h4>
              <p className="text-2xl font-bold mt-2">$44.00</p>
              <p className="text-sm text-muted-foreground">Per trip</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium">Wheelchair Trip</h4>
              <p className="text-2xl font-bold mt-2">$52.00</p>
              <p className="text-sm text-muted-foreground">Per trip</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium">Long Distance</h4>
              <p className="text-2xl font-bold mt-2">$1.50/mi</p>
              <p className="text-sm text-muted-foreground">Over 25 miles</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium">Wait Time</h4>
              <p className="text-2xl font-bold mt-2">$0.35/min</p>
              <p className="text-sm text-muted-foreground">After 15 min</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
