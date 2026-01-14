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
  BarChart3, 
  Download, 
  Calendar,
  TrendingUp,
  TrendingDown,
  Target,
  Award,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import { useState } from "react";

export default function PerformanceReports() {
  const [period, setPeriod] = useState<string>("month");

  // Mock data - performance metrics
  const kpis = [
    { name: "Trip Completion Rate", current: 94.5, target: 95, previous: 93.2, unit: "%" },
    { name: "On-Time Performance", current: 96.2, target: 95, previous: 95.8, unit: "%" },
    { name: "Customer Satisfaction", current: 4.6, target: 4.5, previous: 4.5, unit: "/5" },
    { name: "Fleet Utilization", current: 67, target: 70, previous: 65, unit: "%" },
    { name: "Driver Retention", current: 92, target: 90, previous: 88, unit: "%" },
    { name: "Revenue per Trip", current: 44.89, target: 44, previous: 43.50, unit: "$" },
  ];

  const driverPerformance = [
    { rank: 1, name: "John Smith", trips: 156, onTime: 98, completion: 100, rating: 4.9, revenue: 6864 },
    { rank: 2, name: "Mike Johnson", trips: 148, onTime: 97, completion: 99, rating: 4.8, revenue: 7696 },
    { rank: 3, name: "Sarah Davis", trips: 142, onTime: 96, completion: 98, rating: 4.7, revenue: 6248 },
    { rank: 4, name: "David Wilson", trips: 138, onTime: 95, completion: 97, rating: 4.6, revenue: 6072 },
    { rank: 5, name: "Emily Brown", trips: 135, onTime: 94, completion: 96, rating: 4.5, revenue: 7020 },
  ];

  const monthlyTrends = [
    { month: "Oct 2025", trips: 2850, revenue: 128250, completion: 93.5, onTime: 94.8 },
    { month: "Nov 2025", trips: 2920, revenue: 131400, completion: 94.0, onTime: 95.2 },
    { month: "Dec 2025", trips: 3080, revenue: 138600, completion: 93.8, onTime: 95.5 },
    { month: "Jan 2026", trips: 3245, revenue: 145680, completion: 94.5, onTime: 96.2 },
  ];

  const getKPIStatus = (current: number, target: number) => {
    const ratio = current / target;
    if (ratio >= 1) return { status: "met", color: "text-green-600", bg: "bg-green-50" };
    if (ratio >= 0.95) return { status: "close", color: "text-amber-600", bg: "bg-amber-50" };
    return { status: "below", color: "text-red-600", bg: "bg-red-50" };
  };

  const getTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    if (change > 0) {
      return { icon: <TrendingUp className="h-4 w-4 text-green-500" />, text: `+${change.toFixed(1)}%`, positive: true };
    } else if (change < 0) {
      return { icon: <TrendingDown className="h-4 w-4 text-red-500" />, text: `${change.toFixed(1)}%`, positive: false };
    }
    return { icon: null, text: "0%", positive: true };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Reports</h1>
          <p className="text-muted-foreground">
            Key performance indicators and company metrics
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

      {/* KPI Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-500" />
            Key Performance Indicators
          </CardTitle>
          <CardDescription>Current performance vs targets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => {
              const status = getKPIStatus(kpi.current, kpi.target);
              const trend = getTrend(kpi.current, kpi.previous);
              return (
                <div key={kpi.name} className={`p-4 rounded-lg border ${status.bg}`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm">{kpi.name}</h4>
                    {status.status === "met" ? (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    ) : status.status === "close" ? (
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-2xl font-bold ${status.color}`}>
                      {kpi.unit === "$" ? `$${kpi.current}` : `${kpi.current}${kpi.unit}`}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      / {kpi.unit === "$" ? `$${kpi.target}` : `${kpi.target}${kpi.unit}`} target
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    {trend.icon}
                    <span className={`text-sm ${trend.positive ? "text-green-600" : "text-red-600"}`}>
                      {trend.text}
                    </span>
                    <span className="text-sm text-muted-foreground">vs last period</span>
                  </div>
                  <Progress 
                    value={Math.min((kpi.current / kpi.target) * 100, 100)} 
                    className="h-2 mt-3" 
                  />
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Top Performing Drivers
          </CardTitle>
          <CardDescription>Ranked by overall performance score</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Trips</TableHead>
                <TableHead>On-Time %</TableHead>
                <TableHead>Completion %</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverPerformance.map((driver) => (
                <TableRow key={driver.rank}>
                  <TableCell>
                    <Badge 
                      variant={driver.rank <= 3 ? "default" : "outline"}
                      className={
                        driver.rank === 1 ? "bg-amber-500" : 
                        driver.rank === 2 ? "bg-gray-400" : 
                        driver.rank === 3 ? "bg-amber-700" : ""
                      }
                    >
                      #{driver.rank}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>{driver.trips}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-500">{driver.onTime}%</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-blue-500">{driver.completion}%</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-amber-500">★</span>
                      <span>{driver.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">${driver.revenue.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Monthly Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Trends</CardTitle>
          <CardDescription>Performance metrics over the past 4 months</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead>Total Trips</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Completion Rate</TableHead>
                <TableHead>On-Time Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monthlyTrends.map((month, index) => (
                <TableRow key={month.month}>
                  <TableCell className="font-medium">{month.month}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {month.trips.toLocaleString()}
                      {index > 0 && month.trips > monthlyTrends[index-1].trips && (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>${month.revenue.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="default" className={month.completion >= 94 ? "bg-green-500" : "bg-amber-500"}>
                      {month.completion}%
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className={month.onTime >= 95 ? "bg-green-500" : "bg-amber-500"}>
                      {month.onTime}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
          <CardDescription>Visual representation of key metrics over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted/50 rounded-lg flex items-center justify-center border-2 border-dashed">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Performance Chart</p>
              <p className="text-sm text-muted-foreground">Chart.js / Recharts Integration</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
          <CardDescription>Download detailed performance reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Executive Summary (PDF)
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Driver Performance (CSV)
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              KPI Dashboard (Excel)
            </Button>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Full Report (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
