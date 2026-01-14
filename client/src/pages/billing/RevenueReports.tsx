import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
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
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  FileText,
  BarChart3,
  PieChart
} from "lucide-react";
import { useState } from "react";

export default function RevenueReports() {
  const [period, setPeriod] = useState<string>("month");

  // Mock data - would come from MediRoute/ModivCare API
  const revenueStats = {
    totalRevenue: 145680.00,
    previousPeriod: 138450.00,
    change: 5.2,
    tripsCompleted: 3245,
    avgTripValue: 44.89,
    pendingPayment: 28500.00
  };

  const weeklyRevenue = [
    { week: "Week 1", revenue: 34500.00, trips: 768, status: "paid" },
    { week: "Week 2", revenue: 36200.00, trips: 805, status: "paid" },
    { week: "Week 3", revenue: 35480.00, trips: 790, status: "pending" },
    { week: "Week 4", revenue: 39500.00, trips: 882, status: "submitted" },
  ];

  const revenueByType = [
    { type: "Standard Trips", revenue: 98500.00, trips: 2239, percentage: 68 },
    { type: "Wheelchair Trips", revenue: 35880.00, trips: 690, percentage: 25 },
    { type: "Long Distance", revenue: 8500.00, trips: 245, percentage: 6 },
    { type: "Wait Time", revenue: 2800.00, trips: 71, percentage: 1 },
  ];

  const topDrivers = [
    { name: "John Smith", trips: 156, revenue: 6864.00, avgPerTrip: 44.00 },
    { name: "Mike Johnson", trips: 148, revenue: 7696.00, avgPerTrip: 52.00 },
    { name: "Sarah Davis", trips: 142, revenue: 6248.00, avgPerTrip: 44.00 },
    { name: "David Wilson", trips: 138, revenue: 6072.00, avgPerTrip: 44.00 },
    { name: "Emily Brown", trips: 135, revenue: 7020.00, avgPerTrip: 52.00 },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      paid: { label: "Paid", variant: "default", className: "bg-green-500" },
      pending: { label: "Pending", variant: "secondary", className: "bg-amber-100 text-amber-700" },
      submitted: { label: "Submitted", variant: "secondary", className: "bg-blue-100 text-blue-700" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue Reports</h1>
          <p className="text-muted-foreground">
            Financial reports from ModivCare billing
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
              <SelectItem value="year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Revenue Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-3xl font-bold text-orange-600">${revenueStats.totalRevenue.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {revenueStats.change > 0 ? (
                    <>
                      <TrendingUp className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-green-600">+{revenueStats.change}%</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-red-600">{revenueStats.change}%</span>
                    </>
                  )}
                  <span className="text-sm text-muted-foreground">vs last period</span>
                </div>
              </div>
              <DollarSign className="h-10 w-10 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Trips Completed</p>
                <p className="text-2xl font-bold">{revenueStats.tripsCompleted.toLocaleString()}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Trip Value</p>
                <p className="text-2xl font-bold">${revenueStats.avgTripValue.toFixed(2)}</p>
              </div>
              <PieChart className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Payment</p>
                <p className="text-2xl font-bold text-amber-600">${revenueStats.pendingPayment.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Revenue */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue Breakdown</CardTitle>
            <CardDescription>Revenue by week for the current month</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Week</TableHead>
                  <TableHead>Trips</TableHead>
                  <TableHead>Revenue</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyRevenue.map((week) => (
                  <TableRow key={week.week}>
                    <TableCell className="font-medium">{week.week}</TableCell>
                    <TableCell>{week.trips}</TableCell>
                    <TableCell>${week.revenue.toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(week.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Revenue by Type */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Trip Type</CardTitle>
            <CardDescription>Breakdown by service category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueByType.map((type) => (
                <div key={type.type} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{type.type}</span>
                    <span>${type.revenue.toLocaleString()} ({type.percentage}%)</span>
                  </div>
                  <Progress value={type.percentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">{type.trips} trips</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Drivers */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Drivers</CardTitle>
          <CardDescription>Drivers ranked by revenue generated this month</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Avg/Trip</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {topDrivers.map((driver, index) => (
                <TableRow key={driver.name}>
                  <TableCell>
                    <Badge variant={index < 3 ? "default" : "outline"} className={index === 0 ? "bg-amber-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-700" : ""}>
                      #{index + 1}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>{driver.trips}</TableCell>
                  <TableCell className="font-medium">${driver.revenue.toLocaleString()}</TableCell>
                  <TableCell>${driver.avgPerTrip.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Revenue Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <CardDescription>Monthly revenue over the past 12 months</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Revenue Chart</p>
              <p className="text-sm text-muted-foreground">Chart.js / Recharts Integration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download detailed financial reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Revenue Summary (PDF)
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Trip Details (CSV)
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Driver Performance (CSV)
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              ModivCare Reconciliation (Excel)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
