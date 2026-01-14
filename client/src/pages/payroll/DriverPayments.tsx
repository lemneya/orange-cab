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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  DollarSign, 
  Search, 
  Filter, 
  Download,
  Send,
  Clock,
  Users,
  FileText,
  RefreshCw,
  AlertTriangle,
  Eye,
  Fuel,
  CreditCard,
  MinusCircle,
  Plus,
  Lightbulb
} from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

// Type definitions
interface PayrollAdjustment {
  id: number;
  adjustmentType: "gas" | "credit" | "advance" | "deduction";
  amount: number;
  memo: string | null;
  sourceRef: string | null;
  isAutoSuggested: boolean;
  isApproved: boolean;
}

interface DriverPaymentRow {
  id: number;
  driverId: number;
  driverName: string;
  driverCode: string;
  weekEnding: string;
  trips: number;
  miles: number;
  ratePerMile: number; // in cents
  grossPay: number; // in cents
  gas: number; // in cents
  credits: number; // in cents
  deductions: number; // in cents
  netPay: number; // in cents
  status: "pending" | "approved" | "paid";
  hasExceptions: boolean;
  suggestedDeductions: number;
}

// Inline editable cell component
function EditableCell({ 
  value, 
  onChange, 
  type = "number",
  prefix = "$",
  disabled = false,
  className = ""
}: { 
  value: number; 
  onChange: (value: number) => void;
  type?: "number" | "currency";
  prefix?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(type === "currency" ? (value / 100).toFixed(2) : value.toString());

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = type === "currency" 
      ? Math.round(parseFloat(editValue || "0") * 100) 
      : parseInt(editValue || "0");
    if (!isNaN(numValue)) {
      onChange(numValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    }
    if (e.key === "Escape") {
      setIsEditing(false);
      setEditValue(type === "currency" ? (value / 100).toFixed(2) : value.toString());
    }
  };

  if (disabled) {
    return (
      <span className={className}>
        {type === "currency" ? `${prefix}${(value / 100).toFixed(2)}` : value}
      </span>
    );
  }

  if (isEditing) {
    return (
      <Input
        type="number"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-24 h-8 text-right"
        autoFocus
        step={type === "currency" ? "0.01" : "1"}
      />
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className={`px-2 py-1 rounded hover:bg-muted cursor-pointer text-right min-w-[80px] ${className}`}
    >
      {type === "currency" ? `${prefix}${(value / 100).toFixed(2)}` : value}
    </button>
  );
}

export default function DriverPayments() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showExceptionsOnly, setShowExceptionsOnly] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<number | null>(null);

  // Mock data - in production would come from tRPC queries
  const [driverPayments, setDriverPayments] = useState<DriverPaymentRow[]>([
    {
      id: 1,
      driverId: 1,
      driverName: "John Smith",
      driverCode: "DRV-001",
      weekEnding: "2026-01-12",
      trips: 48,
      miles: 720,
      ratePerMile: 150, // $1.50/mile in cents
      grossPay: 108000, // $1,080.00
      gas: 0,
      credits: 0,
      deductions: 0,
      netPay: 108000,
      status: "pending",
      hasExceptions: false,
      suggestedDeductions: 0
    },
    {
      id: 2,
      driverId: 2,
      driverName: "Mike Johnson",
      driverCode: "DRV-002",
      weekEnding: "2026-01-12",
      trips: 45,
      miles: 680,
      ratePerMile: 150,
      grossPay: 102000,
      gas: 5000, // $50 gas
      credits: 0,
      deductions: 0,
      netPay: 97000,
      status: "pending",
      hasExceptions: false,
      suggestedDeductions: 0
    },
    {
      id: 3,
      driverId: 3,
      driverName: "Sarah Davis",
      driverCode: "DRV-003",
      weekEnding: "2026-01-12",
      trips: 42,
      miles: 630,
      ratePerMile: 150,
      grossPay: 94500,
      gas: 0,
      credits: 2500, // $25 credit
      deductions: 7500, // $75 toll deduction
      netPay: 89500,
      status: "pending",
      hasExceptions: true,
      suggestedDeductions: 7500
    },
    {
      id: 4,
      driverId: 4,
      driverName: "David Wilson",
      driverCode: "DRV-004",
      weekEnding: "2026-01-12",
      trips: 50,
      miles: 750,
      ratePerMile: 150,
      grossPay: 112500,
      gas: 0,
      credits: 0,
      deductions: 0,
      netPay: 112500,
      status: "approved",
      hasExceptions: false,
      suggestedDeductions: 0
    },
    {
      id: 5,
      driverId: 5,
      driverName: "Emily Brown",
      driverCode: "DRV-005",
      weekEnding: "2026-01-12",
      trips: 38,
      miles: 570,
      ratePerMile: 150,
      grossPay: 85500,
      gas: 3000,
      credits: 0,
      deductions: 15000, // High deduction - exception
      netPay: 67500,
      status: "pending",
      hasExceptions: true,
      suggestedDeductions: 15000
    },
    {
      id: 6,
      driverId: 6,
      driverName: "Robert Taylor",
      driverCode: "DRV-006",
      weekEnding: "2026-01-12",
      trips: 0, // No trips - exception
      miles: 0,
      ratePerMile: 150,
      grossPay: 0,
      gas: 0,
      credits: 0,
      deductions: 0,
      netPay: 0,
      status: "pending",
      hasExceptions: true,
      suggestedDeductions: 0
    },
  ]);

  // Calculate net pay using spreadsheet formula:
  // net = (miles * rate) + total_dollars + credits - gas - deductions
  const calculateNetPay = useCallback((row: DriverPaymentRow): number => {
    const grossFromMiles = row.miles * row.ratePerMile;
    return grossFromMiles + row.credits - row.gas - row.deductions;
  }, []);

  // Update a cell and recalculate net pay
  const updateCell = useCallback((id: number, field: keyof DriverPaymentRow, value: number) => {
    setDriverPayments(prev => prev.map(row => {
      if (row.id !== id) return row;
      
      const updated = { ...row, [field]: value };
      
      // Recalculate gross and net pay
      if (field === "miles" || field === "ratePerMile") {
        updated.grossPay = updated.miles * updated.ratePerMile;
      }
      updated.netPay = calculateNetPay(updated);
      
      // Check for exceptions
      updated.hasExceptions = 
        updated.netPay < 0 || 
        updated.trips === 0 ||
        (updated.deductions > 0 && updated.deductions > updated.grossPay * 0.5);
      
      return updated;
    }));
  }, [calculateNetPay]);

  // Filter payments
  const filteredPayments = driverPayments.filter(payment => {
    const matchesSearch = 
      payment.driverName.toLowerCase().includes(search.toLowerCase()) ||
      payment.driverCode.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesExceptions = !showExceptionsOnly || payment.hasExceptions;
    
    return matchesSearch && matchesStatus && matchesExceptions;
  });

  // Stats calculations
  const stats = {
    totalDrivers: driverPayments.length,
    pendingPayments: driverPayments.filter(d => d.status === "pending").length,
    totalPayout: driverPayments.reduce((sum, d) => sum + d.netPay, 0),
    avgPayment: driverPayments.length > 0 
      ? driverPayments.reduce((sum, d) => sum + d.netPay, 0) / driverPayments.length 
      : 0,
    exceptionsCount: driverPayments.filter(d => d.hasExceptions).length
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { label: "Pending", variant: "outline", className: "border-amber-300 text-amber-700" },
      approved: { label: "Approved", variant: "default", className: "bg-green-500" },
      paid: { label: "Paid", variant: "default", className: "bg-blue-500" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const toggleSelectAll = () => {
    const pendingDrivers = filteredPayments.filter(d => d.status === "pending").map(d => d.id);
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

  // Export CSV
  const handleExportCsv = () => {
    const headers = ["Driver", "Driver ID", "Trips", "Miles", "Rate", "Gross Pay", "Gas", "Credits", "Deductions", "Net Pay", "Status"];
    const rows = driverPayments.map(d => [
      d.driverName,
      d.driverCode,
      d.trips.toString(),
      d.miles.toString(),
      (d.ratePerMile / 100).toFixed(2),
      (d.grossPay / 100).toFixed(2),
      (d.gas / 100).toFixed(2),
      (d.credits / 100).toFixed(2),
      (d.deductions / 100).toFixed(2),
      (d.netPay / 100).toFixed(2),
      d.status
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payroll_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <Button variant="outline" onClick={handleExportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
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
      <div className="grid gap-4 md:grid-cols-5">
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
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
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
                <p className="text-2xl font-bold text-orange-600">${(stats.totalPayout / 100).toLocaleString()}</p>
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
                <p className="text-2xl font-bold">${(stats.avgPayment / 100).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className={stats.exceptionsCount > 0 ? "bg-red-50" : ""}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exceptions</p>
                <p className={`text-2xl font-bold ${stats.exceptionsCount > 0 ? "text-red-600" : ""}`}>
                  {stats.exceptionsCount}
                </p>
              </div>
              <AlertTriangle className={`h-8 w-8 ${stats.exceptionsCount > 0 ? "text-red-500" : "text-muted-foreground"}`} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Week Selection & Import */}
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
                <RefreshCw className="mr-2 h-4 w-4" />
                Import from MediRoute
              </Button>
              <Button 
                variant={showExceptionsOnly ? "default" : "outline"}
                onClick={() => setShowExceptionsOnly(!showExceptionsOnly)}
                className={showExceptionsOnly ? "bg-red-500 hover:bg-red-600" : ""}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Exceptions Only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formula Reference */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">Net Pay Formula</p>
              <p className="text-sm text-blue-700">
                <code className="bg-blue-100 px-2 py-0.5 rounded">
                  Net = (Miles × Rate) + Credits − Gas − Deductions
                </code>
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table with Inline Editing */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedDrivers.length === filteredPayments.filter(d => d.status === "pending").length && selectedDrivers.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Trips</TableHead>
                  <TableHead className="text-right">Miles</TableHead>
                  <TableHead className="text-right">Rate/Mi</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right bg-amber-50">
                    <div className="flex items-center justify-end gap-1">
                      <Fuel className="h-4 w-4" />
                      Gas
                    </div>
                  </TableHead>
                  <TableHead className="text-right bg-green-50">
                    <div className="flex items-center justify-end gap-1">
                      <CreditCard className="h-4 w-4" />
                      Credits
                    </div>
                  </TableHead>
                  <TableHead className="text-right bg-red-50">
                    <div className="flex items-center justify-end gap-1">
                      <MinusCircle className="h-4 w-4" />
                      Deductions
                    </div>
                  </TableHead>
                  <TableHead className="text-right font-bold">Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.map((driver) => (
                  <TableRow 
                    key={driver.id} 
                    className={driver.hasExceptions ? "bg-red-50/50" : ""}
                  >
                    <TableCell>
                      <Checkbox 
                        checked={selectedDrivers.includes(driver.id)}
                        onCheckedChange={() => toggleDriver(driver.id)}
                        disabled={driver.status !== "pending"}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {driver.hasExceptions && (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{driver.driverName}</div>
                          <div className="text-xs text-muted-foreground">{driver.driverCode}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={driver.trips === 0 ? "text-red-600 font-medium" : ""}>
                        {driver.trips}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{driver.miles}</TableCell>
                    <TableCell className="text-right">${(driver.ratePerMile / 100).toFixed(2)}</TableCell>
                    <TableCell className="text-right font-medium">
                      ${(driver.grossPay / 100).toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right bg-amber-50/50">
                      <EditableCell
                        value={driver.gas}
                        onChange={(value) => updateCell(driver.id, "gas", value)}
                        type="currency"
                        disabled={driver.status !== "pending"}
                        className="text-amber-700"
                      />
                    </TableCell>
                    <TableCell className="text-right bg-green-50/50">
                      <EditableCell
                        value={driver.credits}
                        onChange={(value) => updateCell(driver.id, "credits", value)}
                        type="currency"
                        disabled={driver.status !== "pending"}
                        className="text-green-700"
                      />
                    </TableCell>
                    <TableCell className="text-right bg-red-50/50">
                      <div className="flex items-center justify-end gap-1">
                        <EditableCell
                          value={driver.deductions}
                          onChange={(value) => updateCell(driver.id, "deductions", value)}
                          type="currency"
                          disabled={driver.status !== "pending"}
                          className="text-red-700"
                        />
                        {driver.suggestedDeductions > 0 && driver.deductions === 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            title={`Suggested: $${(driver.suggestedDeductions / 100).toFixed(2)} from tickets/tolls`}
                            onClick={() => updateCell(driver.id, "deductions", driver.suggestedDeductions)}
                          >
                            <Lightbulb className="h-3 w-3 text-amber-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold ${driver.netPay < 0 ? "text-red-600" : "text-green-600"}`}>
                        ${(driver.netPay / 100).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>{getStatusBadge(driver.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {driver.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-green-600 border-green-300 hover:bg-green-50"
                            onClick={() => {
                              setDriverPayments(prev => prev.map(d => 
                                d.id === driver.id ? { ...d, status: "approved" as const } : d
                              ));
                            }}
                          >
                            Approve
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setLocation(`/payroll/drivers/${driver.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Rate Reference Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Driver Payment Rates</CardTitle>
          <CardDescription>Current contracted rates for 1099 drivers</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Standard Rate</p>
              <p className="text-xl font-bold">$1.50<span className="text-sm font-normal text-muted-foreground">/mile</span></p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Wheelchair Rate</p>
              <p className="text-xl font-bold">$1.75<span className="text-sm font-normal text-muted-foreground">/mile</span></p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Long Distance</p>
              <p className="text-xl font-bold">$1.85<span className="text-sm font-normal text-muted-foreground">/mile</span></p>
              <p className="text-xs text-muted-foreground">Over 50 miles</p>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">Wait Time</p>
              <p className="text-xl font-bold">$0.35<span className="text-sm font-normal text-muted-foreground">/min</span></p>
              <p className="text-xs text-muted-foreground">After 15 min</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
