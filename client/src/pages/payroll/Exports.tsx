import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Download,
  FileSpreadsheet,
  FileText,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ArrowLeft,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/payrollCalculations";

// Types
interface PayrollExport {
  id: number;
  payPeriod: string;
  exportDate: string;
  exportedBy: string;
  format: "csv" | "xlsx" | "pdf";
  totalDrivers: number;
  totalPayout: number;
  status: "completed" | "processing" | "failed";
  downloadUrl: string;
  accountingStatus: "pending" | "sent" | "processed";
}

// Mock data
const mockExports: PayrollExport[] = [
  {
    id: 1,
    payPeriod: "2026-01-12",
    exportDate: "2026-01-12T16:30:00Z",
    exportedBy: "Admin",
    format: "csv",
    totalDrivers: 38,
    totalPayout: 42850,
    status: "completed",
    downloadUrl: "#",
    accountingStatus: "processed",
  },
  {
    id: 2,
    payPeriod: "2026-01-05",
    exportDate: "2026-01-05T15:45:00Z",
    exportedBy: "Admin",
    format: "csv",
    totalDrivers: 36,
    totalPayout: 40200,
    status: "completed",
    downloadUrl: "#",
    accountingStatus: "processed",
  },
  {
    id: 3,
    payPeriod: "2025-12-29",
    exportDate: "2025-12-29T17:00:00Z",
    exportedBy: "Admin",
    format: "csv",
    totalDrivers: 35,
    totalPayout: 38500,
    status: "completed",
    downloadUrl: "#",
    accountingStatus: "processed",
  },
  {
    id: 4,
    payPeriod: "2025-12-22",
    exportDate: "2025-12-22T16:15:00Z",
    exportedBy: "Admin",
    format: "xlsx",
    totalDrivers: 34,
    totalPayout: 37800,
    status: "completed",
    downloadUrl: "#",
    accountingStatus: "processed",
  },
  {
    id: 5,
    payPeriod: "2025-12-15",
    exportDate: "2025-12-15T15:30:00Z",
    exportedBy: "Admin",
    format: "csv",
    totalDrivers: 33,
    totalPayout: 36200,
    status: "completed",
    downloadUrl: "#",
    accountingStatus: "processed",
  },
];

// Helper components
function FormatBadge({ format }: { format: string }) {
  const config: Record<string, { icon: typeof FileSpreadsheet; className: string }> = {
    csv: { icon: FileText, className: "bg-green-100 text-green-700 border-green-200" },
    xlsx: { icon: FileSpreadsheet, className: "bg-blue-100 text-blue-700 border-blue-200" },
    pdf: { icon: FileText, className: "bg-red-100 text-red-700 border-red-200" },
  };
  
  const { icon: Icon, className } = config[format] || config.csv;
  
  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {format.toUpperCase()}
    </Badge>
  );
}

function AccountingStatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; className: string }> = {
    pending: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
    sent: { label: "Sent to Accounting", className: "bg-blue-100 text-blue-700 border-blue-200" },
    processed: { label: "Processed", className: "bg-green-100 text-green-700 border-green-200" },
  };
  
  const { label, className } = config[status] || config.pending;
  
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  );
}

export default function Exports() {
  const [, setLocation] = useLocation();
  const [exports] = useState<PayrollExport[]>(mockExports);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [selectedPeriod, setSelectedPeriod] = useState("2026-01-12");

  // Calculate summary
  const totalExports = exports.length;
  const totalPayout = exports.reduce((sum, e) => sum + e.totalPayout, 0);
  const processedCount = exports.filter(e => e.accountingStatus === "processed").length;

  const handleNewExport = () => {
    // In real app, this would trigger the export process
    alert(`Exporting payroll for ${selectedPeriod} as ${selectedFormat.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/payroll/runs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Payroll Exports</h1>
          <p className="text-muted-foreground">
            Export history and accounting handoff
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-muted-foreground" />
              Total Exports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalExports}</div>
            <p className="text-xs text-muted-foreground">all time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Processed by Accounting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{processedCount}</div>
            <p className="text-xs text-muted-foreground">of {totalExports} exports</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Total Paid Out
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPayout)}</div>
            <p className="text-xs text-muted-foreground">across all exports</p>
          </CardContent>
        </Card>
      </div>

      {/* New Export Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Create New Export</CardTitle>
          <CardDescription>
            Generate a new payroll export for accounting
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Pay Period</label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026-01-12">Week Ending Jan 12, 2026</SelectItem>
                  <SelectItem value="2026-01-05">Week Ending Jan 5, 2026</SelectItem>
                  <SelectItem value="2025-12-29">Week Ending Dec 29, 2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1" />
            <Button onClick={handleNewExport} className="mt-6">
              <Download className="h-4 w-4 mr-2" />
              Generate Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Format Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-4">
          <div className="text-sm">
            <span className="font-medium text-blue-900">CSV Export Columns:</span>
            <span className="text-blue-700 ml-2">
              Driver Name, Driver ID, Trips, Miles, Rate/Mile, Gross, Total$/MAT, Gas, Credits, Deductions, Net
            </span>
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Formula: Net = (Miles × Rate) + Total$/MAT + Credits − Gas − Deductions
          </div>
        </CardContent>
      </Card>

      {/* Export History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Export History</CardTitle>
          <CardDescription>
            Previous payroll exports and their accounting status
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pay Period</TableHead>
                <TableHead>Export Date</TableHead>
                <TableHead>Format</TableHead>
                <TableHead className="text-right">Drivers</TableHead>
                <TableHead className="text-right">Total Payout</TableHead>
                <TableHead>Exported By</TableHead>
                <TableHead>Accounting Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exports.map((exp) => (
                <TableRow key={exp.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">
                        Week Ending {new Date(exp.payPeriod).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {new Date(exp.exportDate).toLocaleString()}
                    </div>
                  </TableCell>
                  <TableCell>
                    <FormatBadge format={exp.format} />
                  </TableCell>
                  <TableCell className="text-right font-mono">{exp.totalDrivers}</TableCell>
                  <TableCell className="text-right font-mono font-medium text-green-600">
                    {formatCurrency(exp.totalPayout)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      {exp.exportedBy}
                    </div>
                  </TableCell>
                  <TableCell>
                    <AccountingStatusBadge status={exp.accountingStatus} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <RefreshCw className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Accounting Integration Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Accounting Integration</CardTitle>
          <CardDescription>
            Connect to your accounting software for automatic handoff
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-green-600" />
              <span>QuickBooks</span>
              <span className="text-xs text-muted-foreground">Not connected</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-blue-600" />
              <span>Xero</span>
              <span className="text-xs text-muted-foreground">Not connected</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2">
              <ExternalLink className="h-8 w-8 text-purple-600" />
              <span>Custom Webhook</span>
              <span className="text-xs text-muted-foreground">Not configured</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
