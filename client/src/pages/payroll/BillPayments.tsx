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
  Receipt, 
  Search, 
  Filter, 
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar
} from "lucide-react";
import { useState } from "react";

export default function BillPayments() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Mock data - company bills
  const bills = [
    {
      id: 1,
      vendor: "State Farm Insurance",
      description: "Fleet Insurance - January 2026",
      category: "insurance",
      amount: 3750.00,
      dueDate: "2026-01-15",
      status: "pending",
      recurring: true
    },
    {
      id: 2,
      vendor: "Virginia Power",
      description: "Electricity - Office & Garage",
      category: "utilities",
      amount: 450.00,
      dueDate: "2026-01-20",
      status: "pending",
      recurring: true
    },
    {
      id: 3,
      vendor: "AutoZone Commercial",
      description: "Parts Order #12345",
      category: "parts",
      amount: 1250.00,
      dueDate: "2026-01-18",
      status: "pending",
      recurring: false
    },
    {
      id: 4,
      vendor: "Shell Fleet",
      description: "Fuel Card - December 2025",
      category: "fuel",
      amount: 8500.00,
      dueDate: "2026-01-10",
      status: "paid",
      paidDate: "2026-01-08",
      recurring: true
    },
    {
      id: 5,
      vendor: "Google Workspace",
      description: "GSuite - January 2026",
      category: "software",
      amount: 180.00,
      dueDate: "2026-01-05",
      status: "paid",
      paidDate: "2026-01-03",
      recurring: true
    },
    {
      id: 6,
      vendor: "E-ZPass Virginia",
      description: "Toll Account Replenishment",
      category: "tolls",
      amount: 2000.00,
      dueDate: "2026-01-25",
      status: "pending",
      recurring: false
    },
    {
      id: 7,
      vendor: "Office Depot",
      description: "Office Supplies",
      category: "supplies",
      amount: 320.00,
      dueDate: "2026-01-12",
      status: "overdue",
      recurring: false
    },
  ];

  const stats = {
    totalDue: 7770.00,
    dueSoon: 5450.00,
    overdue: 320.00,
    paidThisMonth: 8680.00
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { label: "Pending", variant: "outline", className: "border-amber-300 text-amber-700" },
      paid: { label: "Paid", variant: "default", className: "bg-green-500" },
      overdue: { label: "Overdue", variant: "destructive", className: "" },
      scheduled: { label: "Scheduled", variant: "secondary", className: "bg-blue-100 text-blue-700" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const config: Record<string, { label: string; className: string }> = {
      insurance: { label: "Insurance", className: "bg-blue-100 text-blue-700" },
      utilities: { label: "Utilities", className: "bg-yellow-100 text-yellow-700" },
      parts: { label: "Parts", className: "bg-orange-100 text-orange-700" },
      fuel: { label: "Fuel", className: "bg-red-100 text-red-700" },
      software: { label: "Software", className: "bg-purple-100 text-purple-700" },
      tolls: { label: "Tolls", className: "bg-green-100 text-green-700" },
      supplies: { label: "Supplies", className: "bg-gray-100 text-gray-700" },
    };
    const c = config[category] || { label: category, className: "bg-gray-100 text-gray-700" };
    return <Badge variant="secondary" className={c.className}>{c.label}</Badge>;
  };

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diff = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bill Payments</h1>
          <p className="text-muted-foreground">
            Manage and pay company bills and expenses
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Bill
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Due</p>
                <p className="text-2xl font-bold text-amber-600">${stats.totalDue.toLocaleString()}</p>
              </div>
              <Receipt className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Due This Week</p>
                <p className="text-2xl font-bold">${stats.dueSoon.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-red-600">${stats.overdue.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Paid This Month</p>
                <p className="text-2xl font-bold text-green-600">${stats.paidThisMonth.toLocaleString()}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Alert */}
      {stats.overdue > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div>
                <h3 className="font-semibold text-red-700">Overdue Bills</h3>
                <p className="text-sm text-red-600">
                  You have ${stats.overdue.toLocaleString()} in overdue bills that need immediate attention.
                </p>
              </div>
              <Button variant="outline" className="ml-auto border-red-300 text-red-700 hover:bg-red-100">
                View Overdue
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
                  placeholder="Search by vendor or description..."
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
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="insurance">Insurance</SelectItem>
                <SelectItem value="utilities">Utilities</SelectItem>
                <SelectItem value="fuel">Fuel</SelectItem>
                <SelectItem value="parts">Parts</SelectItem>
                <SelectItem value="software">Software</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bills Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vendor</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Recurring</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bills.map((bill) => {
                const daysUntil = getDaysUntilDue(bill.dueDate);
                return (
                  <TableRow key={bill.id} className={bill.status === "overdue" ? "bg-red-50" : ""}>
                    <TableCell className="font-medium">{bill.vendor}</TableCell>
                    <TableCell>{bill.description}</TableCell>
                    <TableCell>{getCategoryBadge(bill.category)}</TableCell>
                    <TableCell className="font-bold">${bill.amount.toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{new Date(bill.dueDate).toLocaleDateString()}</span>
                        {bill.status === "pending" && daysUntil <= 7 && daysUntil > 0 && (
                          <Badge variant="outline" className="text-amber-600 border-amber-300">
                            {daysUntil}d
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                    <TableCell>
                      {bill.recurring ? (
                        <Badge variant="outline">Monthly</Badge>
                      ) : (
                        <span className="text-muted-foreground">One-time</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {bill.status !== "paid" && (
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600">
                            Pay Now
                          </Button>
                        )}
                        <Button variant="ghost" size="sm">View</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Expense Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense Summary</CardTitle>
          <CardDescription>Breakdown of expenses by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
              <h4 className="font-medium text-blue-700">Insurance</h4>
              <p className="text-xl font-bold mt-2">$3,750</p>
            </div>
            <div className="p-4 rounded-lg bg-red-50 border border-red-200">
              <h4 className="font-medium text-red-700">Fuel</h4>
              <p className="text-xl font-bold mt-2">$8,500</p>
            </div>
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200">
              <h4 className="font-medium text-orange-700">Parts</h4>
              <p className="text-xl font-bold mt-2">$1,250</p>
            </div>
            <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <h4 className="font-medium text-yellow-700">Utilities</h4>
              <p className="text-xl font-bold mt-2">$450</p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
              <h4 className="font-medium text-green-700">Tolls</h4>
              <p className="text-xl font-bold mt-2">$2,000</p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
              <h4 className="font-medium text-purple-700">Software</h4>
              <p className="text-xl font-bold mt-2">$180</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
