import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  FileText,
  Fuel,
  Receipt,
  AlertTriangle,
  RefreshCw,
  Eye
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { calculateNetPay, exportPayrollToCSV } from "@/lib/payrollCalculations";

interface DriverPayment {
  id: number;
  name: string;
  driverId: string;
  contractType: string;
  weekEnding: string;
  trips: number;
  miles: number;
  ratePerMile: number;
  totalDollars: number;
  gas: number;        // Auto-populated from fuel imports
  gasAutoImported: boolean;
  tolls: number;      // Auto-populated from toll imports
  tollsAutoImported: boolean;
  credits: number;
  deductions: number;
  grossPay: number;
  netPay: number;
  status: string;
  hasFlags: boolean;
  flags: string[];
}

export default function DriverPayments() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exceptionsOnly, setExceptionsOnly] = useState(false);
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [lastSyncTime] = useState(new Date().toLocaleString());

  // Mock data with auto-imported fuel/toll allocations
  const [driverPayments, setDriverPayments] = useState<DriverPayment[]>([
    {
      id: 1,
      name: "John Smith",
      driverId: "DRV-001",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 48,
      miles: 720,
      ratePerMile: 0.55,
      totalDollars: 0,
      gas: 12500, // $125.00 - auto-imported
      gasAutoImported: true,
      tolls: 2350, // $23.50 - auto-imported
      tollsAutoImported: true,
      credits: 0,
      deductions: 0,
      grossPay: 39600, // 720 * 0.55 * 100
      netPay: 24750, // gross - gas - tolls
      status: "pending",
      hasFlags: false,
      flags: [],
    },
    {
      id: 2,
      name: "Mike Johnson",
      driverId: "DRV-002",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 45,
      miles: 680,
      ratePerMile: 0.55,
      totalDollars: 5000, // $50 bonus
      gas: 9800, // $98.00 - auto-imported
      gasAutoImported: true,
      tolls: 1875, // $18.75 - auto-imported
      tollsAutoImported: true,
      credits: 5000, // $50 referral bonus
      deductions: 0,
      grossPay: 37400,
      netPay: 35725,
      status: "pending",
      hasFlags: false,
      flags: [],
    },
    {
      id: 3,
      name: "Sarah Davis",
      driverId: "DRV-003",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 42,
      miles: 630,
      ratePerMile: 0.55,
      totalDollars: 0,
      gas: 0, // Not imported yet
      gasAutoImported: false,
      tolls: 0, // Not imported yet
      tollsAutoImported: false,
      credits: 0,
      deductions: 5000, // $50 ticket
      grossPay: 34650,
      netPay: 29650,
      status: "pending",
      hasFlags: true,
      flags: ["Missing gas data", "Missing toll data"],
    },
    {
      id: 4,
      name: "David Wilson",
      driverId: "DRV-004",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 50,
      miles: 750,
      ratePerMile: 0.55,
      totalDollars: 0,
      gas: 14200,
      gasAutoImported: true,
      tolls: 3100,
      tollsAutoImported: true,
      credits: 0,
      deductions: 0,
      grossPay: 41250,
      netPay: 23950,
      status: "processed",
      hasFlags: false,
      flags: [],
    },
    {
      id: 5,
      name: "Emily Brown",
      driverId: "DRV-005",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 38,
      miles: 570,
      ratePerMile: 0.55,
      totalDollars: 0,
      gas: 8900,
      gasAutoImported: true,
      tolls: 0,
      tollsAutoImported: false,
      credits: 0,
      deductions: 0,
      grossPay: 31350,
      netPay: 22450,
      status: "pending",
      hasFlags: true,
      flags: ["Missing toll data"],
    },
    {
      id: 6,
      name: "Robert Taylor",
      driverId: "DRV-006",
      contractType: "1099",
      weekEnding: "2026-01-12",
      trips: 0,
      miles: 0,
      ratePerMile: 0.55,
      totalDollars: 0,
      gas: 5600,
      gasAutoImported: true,
      tolls: 1200,
      tollsAutoImported: true,
      credits: 0,
      deductions: 0,
      grossPay: 0,
      netPay: -6800, // Negative - has gas but no trips
      status: "pending",
      hasFlags: true,
      flags: ["Zero payable miles", "Imported trips but 0 payable miles"],
    },
  ]);

  const stats = {
    totalDrivers: driverPayments.length,
    pendingPayments: driverPayments.filter(d => d.status === "pending").length,
    totalPayout: driverPayments.filter(d => d.status === "pending").reduce((sum, d) => sum + d.netPay, 0),
    exceptionsCount: driverPayments.filter(d => d.hasFlags).length,
    missingDataCount: driverPayments.filter(d => !d.gasAutoImported || !d.tollsAutoImported).length,
  };

  const handleInlineEdit = (driverId: number, field: 'gas' | 'tolls' | 'credits' | 'deductions', value: number) => {
    setDriverPayments(prev => prev.map(driver => {
      if (driver.id !== driverId) return driver;
      
      const updated = { ...driver, [field]: value };
      
      // Recalculate net pay: net = (miles * rate) + totalDollars + credits - gas - tolls - deductions
      const netPay = calculateNetPay({
        miles: updated.miles,
        ratePerMile: updated.ratePerMile,
        totalDollars: updated.totalDollars,
        credits: updated.credits,
        gas: updated.gas,
        deductions: updated.deductions + updated.tolls, // tolls are part of deductions
      });
      
      return { ...updated, netPay };
    }));
  };

  const handleExportCSV = () => {
    const csvData = driverPayments.map(d => ({
      driverName: d.name,
      driverId: d.driverId,
      trips: d.trips,
      miles: d.miles,
      ratePerMile: d.ratePerMile,
      totalDollars: d.totalDollars,
      credits: d.credits,
      gas: d.gas,
      tolls: d.tolls,
      otherDeductions: d.deductions,
    }));
    
    const csv = exportPayrollToCSV(csvData);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
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

  // Filter drivers
  let filteredDrivers = driverPayments;
  if (search) {
    filteredDrivers = filteredDrivers.filter(d => 
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.driverId.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (statusFilter !== "all") {
    filteredDrivers = filteredDrivers.filter(d => d.status === statusFilter);
  }
  if (exceptionsOnly) {
    filteredDrivers = filteredDrivers.filter(d => d.hasFlags);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Payments</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            Process weekly payments for 1099 contract drivers
            <span className="text-xs">• Last sync: {lastSyncTime}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Sync MediRoute
          </Button>
          <Button variant="outline" onClick={handleExportCSV}>
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
                <p className="text-sm font-medium text-muted-foreground">Total Drivers</p>
                <p className="text-2xl font-bold">{stats.totalDrivers}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Net Payout</p>
                <p className="text-2xl font-bold text-green-700">${(stats.totalPayout / 100).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className={`cursor-pointer transition-colors ${exceptionsOnly ? 'bg-amber-100 ring-2 ring-amber-500' : 'bg-amber-50 hover:bg-amber-100'}`}
          onClick={() => setExceptionsOnly(!exceptionsOnly)}
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Exceptions</p>
                <p className="text-2xl font-bold text-amber-600">{stats.exceptionsCount}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Missing Data</p>
                <p className="text-2xl font-bold text-orange-600">{stats.missingDataCount}</p>
              </div>
              <Fuel className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-blue-600">{stats.pendingPayments}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search drivers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant={exceptionsOnly ? "default" : "outline"}
              onClick={() => setExceptionsOnly(!exceptionsOnly)}
              className="gap-2"
            >
              <AlertTriangle className="h-4 w-4" />
              Exceptions Only
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Driver Payroll - Week Ending Jan 12, 2026</span>
            <Badge variant="outline">
              Formula: net = (miles × rate) + total$ + credits − gas − tolls − deductions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox 
                      checked={selectedDrivers.length === driverPayments.filter(d => d.status === "pending").length}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead className="text-right">Miles</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total $</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Fuel className="h-3 w-3 text-orange-500" />
                      Gas
                    </span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      <Receipt className="h-3 w-3 text-blue-500" />
                      Tolls
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Deductions</TableHead>
                  <TableHead className="text-right">Net Pay</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow key={driver.id} className={driver.hasFlags ? "bg-amber-50" : ""}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedDrivers.includes(driver.id)}
                        onCheckedChange={() => toggleDriver(driver.id)}
                        disabled={driver.status !== "pending"}
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{driver.name}</p>
                        <p className="text-xs text-muted-foreground">{driver.driverId}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{driver.contractType}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{driver.miles.toFixed(1)}</TableCell>
                    <TableCell className="text-right">${driver.ratePerMile.toFixed(2)}</TableCell>
                    <TableCell className="text-right">${(driver.totalDollars / 100).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={(driver.gas / 100).toFixed(2)}
                          onChange={(e) => handleInlineEdit(driver.id, 'gas', Math.round(parseFloat(e.target.value || "0") * 100))}
                          className={`w-20 text-right h-8 ${driver.gasAutoImported ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-300'}`}
                        />
                        {driver.gasAutoImported && <Fuel className="h-3 w-3 text-orange-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Input
                          type="number"
                          step="0.01"
                          value={(driver.tolls / 100).toFixed(2)}
                          onChange={(e) => handleInlineEdit(driver.id, 'tolls', Math.round(parseFloat(e.target.value || "0") * 100))}
                          className={`w-20 text-right h-8 ${driver.tollsAutoImported ? 'bg-blue-50 border-blue-200' : 'bg-yellow-50 border-yellow-300'}`}
                        />
                        {driver.tollsAutoImported && <Receipt className="h-3 w-3 text-blue-500" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={(driver.credits / 100).toFixed(2)}
                        onChange={(e) => handleInlineEdit(driver.id, 'credits', Math.round(parseFloat(e.target.value || "0") * 100))}
                        className="w-20 text-right h-8"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Input
                        type="number"
                        step="0.01"
                        value={(driver.deductions / 100).toFixed(2)}
                        onChange={(e) => handleInlineEdit(driver.id, 'deductions', Math.round(parseFloat(e.target.value || "0") * 100))}
                        className="w-20 text-right h-8"
                      />
                    </TableCell>
                    <TableCell className={`text-right font-bold ${driver.netPay < 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ${(driver.netPay / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {driver.hasFlags && (
                        <div className="flex flex-col gap-1">
                          {driver.flags.map((flag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs border-amber-300 text-amber-700">
                              {flag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(driver.status)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setLocation(`/payroll/drivers/${driver.id}`)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
