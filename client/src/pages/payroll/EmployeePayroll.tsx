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
  DollarSign, 
  Search, 
  Filter, 
  Download,
  Users,
  Clock,
  Calendar,
  FileText,
  Plus
} from "lucide-react";
import { useState } from "react";

export default function EmployeePayroll() {
  const [search, setSearch] = useState("");
  const [payPeriod, setPayPeriod] = useState<string>("current");

  // Mock data - W2 employees
  const employees = [
    {
      id: 1,
      name: "James Anderson",
      employeeId: "EMP-001",
      position: "Dispatcher",
      department: "Operations",
      payType: "salary",
      hoursWorked: 80,
      regularPay: 2000.00,
      overtime: 0,
      grossPay: 2000.00,
      taxes: 400.00,
      benefits: 150.00,
      netPay: 1450.00,
      status: "pending"
    },
    {
      id: 2,
      name: "Maria Garcia",
      employeeId: "EMP-002",
      position: "Receptionist",
      department: "Office",
      payType: "hourly",
      hoursWorked: 88,
      regularPay: 1200.00,
      overtime: 120.00,
      grossPay: 1320.00,
      taxes: 264.00,
      benefits: 100.00,
      netPay: 956.00,
      status: "pending"
    },
    {
      id: 3,
      name: "Robert Thompson",
      employeeId: "EMP-003",
      position: "Lead Mechanic",
      department: "Garage",
      payType: "hourly",
      hoursWorked: 84,
      regularPay: 1600.00,
      overtime: 120.00,
      grossPay: 1720.00,
      taxes: 344.00,
      benefits: 150.00,
      netPay: 1226.00,
      status: "pending"
    },
    {
      id: 4,
      name: "Jennifer Martinez",
      employeeId: "EMP-004",
      position: "Mechanic",
      department: "Garage",
      payType: "hourly",
      hoursWorked: 80,
      regularPay: 1400.00,
      overtime: 0,
      grossPay: 1400.00,
      taxes: 280.00,
      benefits: 100.00,
      netPay: 1020.00,
      status: "pending"
    },
    {
      id: 5,
      name: "William Chen",
      employeeId: "EMP-005",
      position: "Billing Specialist",
      department: "Finance",
      payType: "salary",
      hoursWorked: 80,
      regularPay: 1800.00,
      overtime: 0,
      grossPay: 1800.00,
      taxes: 360.00,
      benefits: 150.00,
      netPay: 1290.00,
      status: "pending"
    },
    {
      id: 6,
      name: "Lisa Johnson",
      employeeId: "EMP-006",
      position: "Payroll Agent",
      department: "Finance",
      payType: "salary",
      hoursWorked: 80,
      regularPay: 1900.00,
      overtime: 0,
      grossPay: 1900.00,
      taxes: 380.00,
      benefits: 150.00,
      netPay: 1370.00,
      status: "pending"
    },
  ];

  const stats = {
    totalEmployees: 8,
    totalGross: 10140.00,
    totalTaxes: 2028.00,
    totalNet: 7312.00
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

  const getDepartmentBadge = (dept: string) => {
    const config: Record<string, { className: string }> = {
      Operations: { className: "bg-blue-100 text-blue-700" },
      Office: { className: "bg-purple-100 text-purple-700" },
      Garage: { className: "bg-orange-100 text-orange-700" },
      Finance: { className: "bg-green-100 text-green-700" },
    };
    const c = config[dept] || { className: "bg-gray-100 text-gray-700" };
    return <Badge variant="secondary" className={c.className}>{dept}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Employee Payroll</h1>
          <p className="text-muted-foreground">
            Process bi-weekly payroll for W2 employees
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Payroll
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <DollarSign className="mr-2 h-4 w-4" />
            Run Payroll
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{stats.totalEmployees}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gross Payroll</p>
                <p className="text-2xl font-bold text-blue-600">${stats.totalGross.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Taxes</p>
                <p className="text-2xl font-bold text-red-600">${stats.totalTaxes.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Payroll</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalNet.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pay Period Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Pay Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Select value={payPeriod} onValueChange={setPayPeriod}>
              <SelectTrigger className="w-full md:w-[300px]">
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Select Pay Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Dec 30, 2025 - Jan 12, 2026</SelectItem>
                <SelectItem value="prev1">Dec 16 - Dec 29, 2025</SelectItem>
                <SelectItem value="prev2">Dec 2 - Dec 15, 2025</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Import Timesheets
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
                  placeholder="Search by employee name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="operations">Operations</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="garage">Garage</SelectItem>
                <SelectItem value="finance">Finance</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Regular</TableHead>
                <TableHead>Overtime</TableHead>
                <TableHead>Gross</TableHead>
                <TableHead>Taxes</TableHead>
                <TableHead>Benefits</TableHead>
                <TableHead>Net Pay</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((emp) => (
                <TableRow key={emp.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-xs text-muted-foreground">{emp.employeeId}</div>
                    </div>
                  </TableCell>
                  <TableCell>{getDepartmentBadge(emp.department)}</TableCell>
                  <TableCell>{emp.position}</TableCell>
                  <TableCell>{emp.hoursWorked}</TableCell>
                  <TableCell>${emp.regularPay.toFixed(2)}</TableCell>
                  <TableCell>
                    {emp.overtime > 0 ? (
                      <span className="text-green-600">+${emp.overtime.toFixed(2)}</span>
                    ) : (
                      <span className="text-muted-foreground">$0.00</span>
                    )}
                  </TableCell>
                  <TableCell>${emp.grossPay.toFixed(2)}</TableCell>
                  <TableCell className="text-red-600">-${emp.taxes.toFixed(2)}</TableCell>
                  <TableCell className="text-red-600">-${emp.benefits.toFixed(2)}</TableCell>
                  <TableCell className="font-bold">${emp.netPay.toFixed(2)}</TableCell>
                  <TableCell>{getStatusBadge(emp.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Payroll Summary</CardTitle>
          <CardDescription>Breakdown by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h4 className="font-medium text-blue-700">Operations</h4>
              <p className="text-2xl font-bold mt-2">$2,000.00</p>
              <p className="text-sm text-muted-foreground">1 employee</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <h4 className="font-medium text-purple-700">Office</h4>
              <p className="text-2xl font-bold mt-2">$1,320.00</p>
              <p className="text-sm text-muted-foreground">1 employee</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <h4 className="font-medium text-orange-700">Garage</h4>
              <p className="text-2xl font-bold mt-2">$3,120.00</p>
              <p className="text-sm text-muted-foreground">2 employees</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-700">Finance</h4>
              <p className="text-2xl font-bold mt-2">$3,700.00</p>
              <p className="text-sm text-muted-foreground">2 employees</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
