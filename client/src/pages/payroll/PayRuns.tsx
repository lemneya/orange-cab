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
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Users,
  DollarSign,
  AlertTriangle,
  FileQuestion,
  RefreshCw,
  Download,
  Check,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Edit2,
  FileText,
  Lightbulb,
  AlertCircle,
  User,
  Car,
  Receipt,
} from "lucide-react";
import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  calculateNetPay,
  formatCurrency,
  parseCurrency,
  generatePayrollCsv,
  downloadCsv,
  getDriverExceptionFlags,
  type ExceptionFlag,
} from "@/lib/payrollCalculations";

// ============ TYPES ============

type PayRunStatus = "draft" | "review" | "approved" | "exported" | "paid";

interface DriverPayment {
  id: number;
  name: string;
  driverId: string;
  contractType: "standard" | "wheelchair" | "long_distance" | "premium";
  trips: number;
  miles: number;
  rate: number; // $/mile
  totalDollars: number; // MAT/bonus bucket
  gas: number;
  credits: number;
  deductions: number;
  gross: number;
  net: number;
  status: "pending" | "approved" | "paid";
  flags: ExceptionFlag[];
  hasSuggestedDeductions: boolean;
  hasImportErrors: boolean;
}

interface PayRun {
  id: string;
  periodStart: string;
  periodEnd: string;
  status: PayRunStatus;
  lastSyncTime: string | null;
  totalDrivers: number;
  totalPayout: number;
  exceptionsCount: number;
  missingDataCount: number;
}

// ============ MOCK DATA ============

const mockPayRun: PayRun = {
  id: "PR-2026-02",
  periodStart: "2026-01-06",
  periodEnd: "2026-01-12",
  status: "draft",
  lastSyncTime: "2026-01-12T14:30:00Z",
  totalDrivers: 38,
  totalPayout: 42850,
  exceptionsCount: 5,
  missingDataCount: 3,
};

const mockDriverPayments: DriverPayment[] = [
  {
    id: 1,
    name: "John Smith",
    driverId: "DRV-001",
    contractType: "standard",
    trips: 48,
    miles: 720,
    rate: 1.50,
    totalDollars: 0,
    gas: 0,
    credits: 0,
    deductions: 0,
    gross: 1080,
    net: 1080,
    status: "pending",
    flags: [],
    hasSuggestedDeductions: false,
    hasImportErrors: false,
  },
  {
    id: 2,
    name: "Mike Johnson",
    driverId: "DRV-002",
    contractType: "standard",
    trips: 45,
    miles: 680,
    rate: 1.50,
    totalDollars: 0,
    gas: 50,
    credits: 0,
    deductions: 0,
    gross: 1020,
    net: 970,
    status: "pending",
    flags: [],
    hasSuggestedDeductions: false,
    hasImportErrors: false,
  },
  {
    id: 3,
    name: "Sarah Davis",
    driverId: "DRV-003",
    contractType: "wheelchair",
    trips: 42,
    miles: 630,
    rate: 1.75,
    totalDollars: 0,
    gas: 0,
    credits: 25,
    deductions: 75,
    gross: 1102.50,
    net: 1052.50,
    status: "pending",
    flags: [
      { type: "unconfirmed_deduction", message: "Deductions suggested but not confirmed", severity: "warning" },
    ],
    hasSuggestedDeductions: true,
    hasImportErrors: false,
  },
  {
    id: 4,
    name: "David Wilson",
    driverId: "DRV-004",
    contractType: "standard",
    trips: 50,
    miles: 750,
    rate: 1.50,
    totalDollars: 50,
    gas: 0,
    credits: 0,
    deductions: 0,
    gross: 1125,
    net: 1175,
    status: "approved",
    flags: [],
    hasSuggestedDeductions: false,
    hasImportErrors: false,
  },
  {
    id: 5,
    name: "Emily Brown",
    driverId: "DRV-005",
    contractType: "standard",
    trips: 38,
    miles: 570,
    rate: 1.50,
    totalDollars: 0,
    gas: 30,
    credits: 0,
    deductions: 150,
    gross: 855,
    net: 675,
    status: "pending",
    flags: [
      { type: "high_deduction", message: "High deductions (18% of gross)", severity: "warning" },
    ],
    hasSuggestedDeductions: false,
    hasImportErrors: false,
  },
  {
    id: 6,
    name: "Robert Taylor",
    driverId: "DRV-006",
    contractType: "standard",
    trips: 0,
    miles: 0,
    rate: 1.50,
    totalDollars: 0,
    gas: 0,
    credits: 0,
    deductions: 0,
    gross: 0,
    net: 0,
    status: "pending",
    flags: [
      { type: "zero_miles", message: "Imported trips but 0 payable miles", severity: "warning" },
    ],
    hasSuggestedDeductions: false,
    hasImportErrors: true,
  },
  {
    id: 7,
    name: "Lisa Anderson",
    driverId: "DRV-007",
    contractType: "standard",
    trips: 35,
    miles: 525,
    rate: 1.50,
    totalDollars: 0,
    gas: 40,
    credits: 0,
    deductions: 0,
    gross: 787.50,
    net: 747.50,
    status: "pending",
    flags: [],
    hasSuggestedDeductions: false,
    hasImportErrors: false,
  },
  {
    id: 8,
    name: "James Martinez",
    driverId: "DRV-008",
    contractType: "wheelchair",
    trips: 40,
    miles: 600,
    rate: 1.75,
    totalDollars: 0,
    gas: 45,
    credits: 0,
    deductions: 0,
    gross: 1050,
    net: 1005,
    status: "pending",
    flags: [
      { type: "missing_contract", message: "Driver missing contract/rate", severity: "error" },
    ],
    hasSuggestedDeductions: false,
    hasImportErrors: false,
  },
];

// ============ HELPER COMPONENTS ============

function StatusBadge({ status }: { status: PayRunStatus }) {
  const config = {
    draft: { label: "Draft", variant: "secondary" as const, icon: Edit2 },
    review: { label: "Review", variant: "outline" as const, icon: Clock },
    approved: { label: "Approved", variant: "default" as const, icon: Check },
    exported: { label: "Exported", variant: "default" as const, icon: Download },
    paid: { label: "Paid", variant: "default" as const, icon: CheckCircle2 },
  };
  
  const { label, variant, icon: Icon } = config[status];
  
  return (
    <Badge variant={variant} className="gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

function ExceptionBadge({ flag }: { flag: ExceptionFlag }) {
  return (
    <Badge 
      variant={flag.severity === "error" ? "destructive" : "outline"}
      className="text-xs"
    >
      {flag.message}
    </Badge>
  );
}

// ============ INLINE EDIT CELL ============

function InlineEditCell({
  value,
  onChange,
  prefix = "$",
}: {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toFixed(2));

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseCurrency(editValue);
    if (!isNaN(parsed)) {
      onChange(parsed);
    } else {
      setEditValue(value.toFixed(2));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleBlur();
    } else if (e.key === "Escape") {
      setEditValue(value.toFixed(2));
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <Input
        type="number"
        step="0.01"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        autoFocus
        className="w-20 h-7 text-right text-sm"
      />
    );
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 font-mono text-sm hover:bg-muted"
      onClick={() => setIsEditing(true)}
    >
      {prefix}{value.toFixed(2)}
    </Button>
  );
}

// ============ MAIN COMPONENT ============

export default function PayRuns() {
  const [, setLocation] = useLocation();
  const [payRun, setPayRun] = useState<PayRun>(mockPayRun);
  const [drivers, setDrivers] = useState<DriverPayment[]>(mockDriverPayments);
  const [search, setSearch] = useState("");
  const [selectedDrivers, setSelectedDrivers] = useState<number[]>([]);
  const [showExceptionsOnly, setShowExceptionsOnly] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("2026-01-12");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedExceptionDriver, setSelectedExceptionDriver] = useState<DriverPayment | null>(null);

  // Calculate summary stats
  const summary = {
    totalDrivers: drivers.length,
    totalPayout: drivers.reduce((sum, d) => sum + d.net, 0),
    exceptionsCount: drivers.filter(d => d.flags.length > 0).length,
    missingDataCount: drivers.filter(d => d.gas === 0 && d.credits === 0 && d.deductions === 0 && d.trips > 0).length,
  };

  // Filter drivers
  const filteredDrivers = drivers.filter(driver => {
    const matchesSearch = 
      driver.name.toLowerCase().includes(search.toLowerCase()) ||
      driver.driverId.toLowerCase().includes(search.toLowerCase());
    
    if (showExceptionsOnly) {
      return matchesSearch && driver.flags.length > 0;
    }
    
    return matchesSearch;
  });

  // Get all exceptions for workbench
  const allExceptions = drivers
    .filter(d => d.flags.length > 0)
    .flatMap(d => d.flags.map(f => ({ driver: d, flag: f })));

  // Handlers
  const handleSync = useCallback(() => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setPayRun(prev => ({
        ...prev,
        lastSyncTime: new Date().toISOString(),
      }));
    }, 2000);
  }, []);

  const handleExportCsv = useCallback(() => {
    const csvData = drivers.map(d => ({
      id: d.id,
      name: d.name,
      driverId: d.driverId,
      trips: d.trips,
      miles: d.miles,
      rate: d.rate,
      totalDollars: d.totalDollars,
      gas: d.gas,
      credits: d.credits,
      deductions: d.deductions,
    }));
    const csv = generatePayrollCsv(csvData, selectedPeriod);
    downloadCsv(csv, `payroll-${selectedPeriod}.csv`);
  }, [drivers, selectedPeriod]);

  const handleUpdateDriver = useCallback((driverId: number, field: keyof DriverPayment, value: number) => {
    setDrivers(prev => prev.map(d => {
      if (d.id !== driverId) return d;
      
      const updated = { ...d, [field]: value };
      
      // Recalculate net
      const result = calculateNetPay({
        miles: updated.miles,
        ratePerMile: updated.rate,
        totalDollars: updated.totalDollars,
        credits: updated.credits,
        gas: updated.gas,
        deductions: updated.deductions,
      });
      
      updated.gross = result.gross;
      updated.net = result.net;
      
      return updated;
    }));
  }, []);

  const handleAdvanceStatus = useCallback(() => {
    const statusOrder: PayRunStatus[] = ["draft", "review", "approved", "exported", "paid"];
    const currentIndex = statusOrder.indexOf(payRun.status);
    if (currentIndex < statusOrder.length - 1) {
      setPayRun(prev => ({
        ...prev,
        status: statusOrder[currentIndex + 1],
      }));
    }
  }, [payRun.status]);

  const getNextStatusAction = () => {
    switch (payRun.status) {
      case "draft": return { label: "Submit for Review", icon: Send };
      case "review": return { label: "Approve", icon: Check };
      case "approved": return { label: "Export", icon: Download };
      case "exported": return { label: "Mark as Paid", icon: CheckCircle2 };
      default: return null;
    }
  };

  const nextAction = getNextStatusAction();

  return (
    <div className="flex gap-6">
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Pay Runs</h1>
            <p className="text-muted-foreground">
              Process weekly payments for 1099 contract drivers
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={payRun.status} />
            {nextAction && (
              <Button onClick={handleAdvanceStatus} className="gap-2">
                <nextAction.icon className="h-4 w-4" />
                {nextAction.label}
              </Button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalDrivers}</div>
              <p className="text-xs text-muted-foreground">in this pay run</p>
            </CardContent>
          </Card>
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Net Payout</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">
                {formatCurrency(summary.totalPayout)}
              </div>
              <p className="text-xs text-muted-foreground">
                avg {formatCurrency(summary.totalPayout / summary.totalDrivers)}/driver
              </p>
            </CardContent>
          </Card>
          <Card className={summary.exceptionsCount > 0 ? "border-orange-200 bg-orange-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Exceptions</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${summary.exceptionsCount > 0 ? "text-orange-600" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.exceptionsCount > 0 ? "text-orange-700" : ""}`}>
                {summary.exceptionsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-xs"
                  onClick={() => setShowExceptionsOnly(!showExceptionsOnly)}
                >
                  {showExceptionsOnly ? "Show all" : "Click to filter"}
                </Button>
              </p>
            </CardContent>
          </Card>
          <Card className={summary.missingDataCount > 0 ? "border-yellow-200 bg-yellow-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Missing Data</CardTitle>
              <FileQuestion className={`h-4 w-4 ${summary.missingDataCount > 0 ? "text-yellow-600" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.missingDataCount > 0 ? "text-yellow-700" : ""}`}>
                {summary.missingDataCount}
              </div>
              <p className="text-xs text-muted-foreground">gas/credits/deductions</p>
            </CardContent>
          </Card>
        </div>

        {/* Pay Period & Sync */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Pay Period</CardTitle>
                <CardDescription>
                  {payRun.lastSyncTime 
                    ? `Last sync: ${new Date(payRun.lastSyncTime).toLocaleString()}`
                    : "Not synced yet"
                  }
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2026-01-12">Week Ending Jan 12, 2026</SelectItem>
                    <SelectItem value="2026-01-05">Week Ending Jan 5, 2026</SelectItem>
                    <SelectItem value="2025-12-29">Week Ending Dec 29, 2025</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
                  <RefreshCw className={`h-4 w-4 mr-2 ${isSyncing ? "animate-spin" : ""}`} />
                  {isSyncing ? "Syncing..." : "Sync from MediRoute"}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Formula Reference */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <div className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">Net Pay Formula:</span>
              <code className="bg-blue-100 px-2 py-0.5 rounded text-blue-800">
                Net = (Miles × Rate) + Total$/MAT + Credits − Gas − Deductions
              </code>
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="Search by driver name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
            <div className="flex items-center gap-2">
              <Checkbox
                id="exceptionsOnly"
                checked={showExceptionsOnly}
                onCheckedChange={(checked) => setShowExceptionsOnly(checked as boolean)}
              />
              <label htmlFor="exceptionsOnly" className="text-sm">
                Exceptions Only
              </label>
            </div>
            <div className="flex-1" />
            <Button variant="outline" onClick={handleExportCsv}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardContent>
        </Card>

        {/* Main Table - Spreadsheet Parity */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[30px]">
                    <Checkbox
                      checked={selectedDrivers.length === filteredDrivers.length && filteredDrivers.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedDrivers(filteredDrivers.map(d => d.id));
                        } else {
                          setSelectedDrivers([]);
                        }
                      }}
                    />
                  </TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Contract</TableHead>
                  <TableHead className="text-right">Miles</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Total$/MAT</TableHead>
                  <TableHead className="text-right bg-orange-50">Gas</TableHead>
                  <TableHead className="text-right bg-green-50">Credits</TableHead>
                  <TableHead className="text-right bg-red-50">Deductions</TableHead>
                  <TableHead className="text-right font-bold">Net Pay</TableHead>
                  <TableHead>Flags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDrivers.map((driver) => (
                  <TableRow 
                    key={driver.id}
                    className={driver.flags.length > 0 ? "bg-orange-50/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedDrivers.includes(driver.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedDrivers(prev => [...prev, driver.id]);
                          } else {
                            setSelectedDrivers(prev => prev.filter(id => id !== driver.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{driver.name}</span>
                        <span className="text-xs text-muted-foreground">{driver.driverId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {driver.contractType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{driver.miles.toFixed(1)}</TableCell>
                    <TableCell className="text-right font-mono">${driver.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <InlineEditCell
                        value={driver.totalDollars}
                        onChange={(v) => handleUpdateDriver(driver.id, "totalDollars", v)}
                      />
                    </TableCell>
                    <TableCell className="text-right bg-orange-50">
                      <InlineEditCell
                        value={driver.gas}
                        onChange={(v) => handleUpdateDriver(driver.id, "gas", v)}
                      />
                    </TableCell>
                    <TableCell className="text-right bg-green-50">
                      <InlineEditCell
                        value={driver.credits}
                        onChange={(v) => handleUpdateDriver(driver.id, "credits", v)}
                      />
                    </TableCell>
                    <TableCell className="text-right bg-red-50">
                      <InlineEditCell
                        value={driver.deductions}
                        onChange={(v) => handleUpdateDriver(driver.id, "deductions", v)}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-bold font-mono ${driver.net < 0 ? "text-red-600" : "text-green-600"}`}>
                        {formatCurrency(driver.net)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {driver.flags.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2"
                          onClick={() => setSelectedExceptionDriver(driver)}
                        >
                          <AlertTriangle className="h-3 w-3 text-orange-500 mr-1" />
                          {driver.flags.length}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Exceptions Workbench - Right Side Panel */}
      <div className="w-80 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Exceptions Workbench
            </CardTitle>
            <CardDescription>
              Payroll user only touches flags, not every row
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="space-y-1 p-4">
                {/* Missing Contract/Rate */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                    <XCircle className="h-4 w-4" />
                    Missing Contract/Rate
                  </div>
                  {drivers
                    .filter(d => d.flags.some(f => f.type === "missing_contract"))
                    .map(d => (
                      <Button
                        key={d.id}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3"
                        onClick={() => setSelectedExceptionDriver(d)}
                      >
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="flex-1 text-left">{d.name}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                  {!drivers.some(d => d.flags.some(f => f.type === "missing_contract")) && (
                    <p className="text-xs text-muted-foreground px-3">None</p>
                  )}
                </div>

                <Separator className="my-3" />

                {/* Zero Payable Miles */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-yellow-700">
                    <AlertCircle className="h-4 w-4" />
                    Zero Payable Miles
                  </div>
                  {drivers
                    .filter(d => d.flags.some(f => f.type === "zero_miles"))
                    .map(d => (
                      <Button
                        key={d.id}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3"
                        onClick={() => setSelectedExceptionDriver(d)}
                      >
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="flex-1 text-left">{d.name}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                  {!drivers.some(d => d.flags.some(f => f.type === "zero_miles")) && (
                    <p className="text-xs text-muted-foreground px-3">None</p>
                  )}
                </div>

                <Separator className="my-3" />

                {/* Unconfirmed Deductions */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-orange-700">
                    <Lightbulb className="h-4 w-4" />
                    Unconfirmed Deductions
                  </div>
                  {drivers
                    .filter(d => d.flags.some(f => f.type === "unconfirmed_deduction"))
                    .map(d => (
                      <Button
                        key={d.id}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3"
                        onClick={() => setSelectedExceptionDriver(d)}
                      >
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="flex-1 text-left">{d.name}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                  {!drivers.some(d => d.flags.some(f => f.type === "unconfirmed_deduction")) && (
                    <p className="text-xs text-muted-foreground px-3">None</p>
                  )}
                </div>

                <Separator className="my-3" />

                {/* Import Errors */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-red-700">
                    <FileText className="h-4 w-4" />
                    Import Row Errors
                  </div>
                  {drivers
                    .filter(d => d.hasImportErrors)
                    .map(d => (
                      <Button
                        key={d.id}
                        variant="ghost"
                        className="w-full justify-start h-auto py-2 px-3"
                        onClick={() => setLocation("/payroll/import-errors")}
                      >
                        <User className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span className="flex-1 text-left">{d.name}</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    ))}
                  {!drivers.some(d => d.hasImportErrors) && (
                    <p className="text-xs text-muted-foreground px-3">None</p>
                  )}
                </div>
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => setLocation("/payroll/import-errors")}>
              <AlertTriangle className="h-4 w-4 mr-2" />
              View Import Errors
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setLocation("/payroll/adjustments")}>
              <Receipt className="h-4 w-4 mr-2" />
              Bulk Adjustments
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => setLocation("/payroll/exports")}>
              <Download className="h-4 w-4 mr-2" />
              Export History
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Exception Detail Dialog */}
      <Dialog open={!!selectedExceptionDriver} onOpenChange={() => setSelectedExceptionDriver(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exception Details</DialogTitle>
            <DialogDescription>
              {selectedExceptionDriver?.name} ({selectedExceptionDriver?.driverId})
            </DialogDescription>
          </DialogHeader>
          {selectedExceptionDriver && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Trips:</span>
                  <span className="ml-2 font-medium">{selectedExceptionDriver.trips}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Miles:</span>
                  <span className="ml-2 font-medium">{selectedExceptionDriver.miles}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Gross:</span>
                  <span className="ml-2 font-medium">{formatCurrency(selectedExceptionDriver.gross)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Net:</span>
                  <span className="ml-2 font-medium">{formatCurrency(selectedExceptionDriver.net)}</span>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <span className="text-sm font-medium">Flags:</span>
                {selectedExceptionDriver.flags.map((flag, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <ExceptionBadge flag={flag} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedExceptionDriver(null)}>
              Close
            </Button>
            <Button onClick={() => {
              setLocation(`/payroll/drivers/${selectedExceptionDriver?.id}`);
            }}>
              View Full Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
