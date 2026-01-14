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
  FileText, 
  Download, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  DollarSign,
  Car,
  Users
} from "lucide-react";
import { useState } from "react";

export default function DailyReport() {
  const [selectedDate, setSelectedDate] = useState<string>("2026-01-13");

  // Mock data - would come from MediRoute API
  const dailyStats = {
    totalTrips: 156,
    completed: 148,
    cancelled: 5,
    noShow: 3,
    completionRate: 94.9,
    onTimeRate: 96.2,
    totalMiles: 2450,
    totalRevenue: 6840.00
  };

  const driverPerformance = [
    { id: 1, name: "John Smith", vehicle: "1001", trips: 12, completed: 12, onTime: 11, miles: 185, revenue: 528.00 },
    { id: 2, name: "Mike Johnson", vehicle: "1002", trips: 10, completed: 10, onTime: 10, miles: 156, revenue: 440.00 },
    { id: 3, name: "Sarah Davis", vehicle: "1003", trips: 11, completed: 11, onTime: 10, miles: 172, revenue: 484.00 },
    { id: 4, name: "David Wilson", vehicle: "1005", trips: 9, completed: 9, onTime: 9, miles: 145, revenue: 396.00 },
    { id: 5, name: "Emily Brown", vehicle: "1008", trips: 8, completed: 7, onTime: 7, miles: 128, revenue: 308.00 },
  ];

  const tripsByCity = [
    { city: "Virginia Beach", trips: 45, percentage: 29 },
    { city: "Norfolk", trips: 38, percentage: 24 },
    { city: "Hampton", trips: 28, percentage: 18 },
    { city: "Newport News", trips: 25, percentage: 16 },
    { city: "Chesapeake", trips: 20, percentage: 13 },
  ];

  const tripsByType = [
    { type: "Medical Appointment", trips: 85, percentage: 54 },
    { type: "Dialysis", trips: 45, percentage: 29 },
    { type: "Physical Therapy", trips: 18, percentage: 12 },
    { type: "Other", trips: 8, percentage: 5 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Report</h1>
          <p className="text-muted-foreground">
            End-of-day summary from MediRoute completed trips
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-01-13">Jan 13, 2026</SelectItem>
              <SelectItem value="2026-01-12">Jan 12, 2026</SelectItem>
              <SelectItem value="2026-01-11">Jan 11, 2026</SelectItem>
              <SelectItem value="2026-01-10">Jan 10, 2026</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Trips</p>
                <p className="text-2xl font-bold">{dailyStats.totalTrips}</p>
              </div>
              <Car className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{dailyStats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">{dailyStats.completionRate}% completion rate</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On-Time</p>
                <p className="text-2xl font-bold text-blue-600">{dailyStats.onTimeRate}%</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-orange-600">${dailyStats.totalRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Completion Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Trip Completion Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span>Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{dailyStats.completed}</span>
                  <Badge variant="default" className="bg-green-500">{((dailyStats.completed/dailyStats.totalTrips)*100).toFixed(1)}%</Badge>
                </div>
              </div>
              <Progress value={(dailyStats.completed/dailyStats.totalTrips)*100} className="h-2" />
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <span>Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{dailyStats.cancelled}</span>
                  <Badge variant="destructive">{((dailyStats.cancelled/dailyStats.totalTrips)*100).toFixed(1)}%</Badge>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-amber-500" />
                  <span>No Show</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{dailyStats.noShow}</span>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-700">{((dailyStats.noShow/dailyStats.totalTrips)*100).toFixed(1)}%</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trips by City */}
        <Card>
          <CardHeader>
            <CardTitle>Trips by City</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tripsByCity.map((city) => (
                <div key={city.city} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{city.city}</span>
                    <span className="font-medium">{city.trips} trips ({city.percentage}%)</span>
                  </div>
                  <Progress value={city.percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-orange-500" />
            Driver Performance
          </CardTitle>
          <CardDescription>Individual driver statistics for the day</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Total Trips</TableHead>
                <TableHead>Completed</TableHead>
                <TableHead>On-Time</TableHead>
                <TableHead>Miles</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {driverPerformance.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium">{driver.name}</TableCell>
                  <TableCell>#{driver.vehicle}</TableCell>
                  <TableCell>{driver.trips}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {driver.completed}
                      {driver.completed === driver.trips && (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{driver.onTime}/{driver.completed}</TableCell>
                  <TableCell>{driver.miles} mi</TableCell>
                  <TableCell>${driver.revenue.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge 
                      variant="default" 
                      className={
                        (driver.onTime/driver.trips) >= 0.95 ? "bg-green-500" :
                        (driver.onTime/driver.trips) >= 0.85 ? "bg-amber-500" : "bg-red-500"
                      }
                    >
                      {((driver.onTime/driver.trips)*100).toFixed(0)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Trip Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Trip Type Distribution</CardTitle>
          <CardDescription>Breakdown of trips by appointment type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {tripsByType.map((type) => (
              <div key={type.type} className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium">{type.type}</h4>
                <p className="text-2xl font-bold mt-2">{type.trips}</p>
                <p className="text-sm text-muted-foreground">{type.percentage}% of total</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Options</CardTitle>
          <CardDescription>Download reports for billing and payroll</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Driver Completed Trips (CSV)
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Billing Summary (PDF)
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Payroll Report (CSV)
            </Button>
            <Button variant="outline">
              <FileText className="mr-2 h-4 w-4" />
              Full Daily Report (PDF)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
