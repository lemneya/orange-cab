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
  Users, 
  Clock, 
  CheckCircle,
  Activity,
  TrendingUp,
  Calendar,
  Eye,
  MessageSquare
} from "lucide-react";
import { useState } from "react";

export default function StaffMonitoring() {
  const [department, setDepartment] = useState<string>("all");

  // Mock data - staff activity monitoring
  const staffMembers = [
    {
      id: 1,
      name: "James Anderson",
      role: "Dispatcher",
      department: "Operations",
      status: "active",
      currentTask: "Managing trip assignments",
      tasksCompleted: 45,
      hoursToday: 6.5,
      lastActivity: "2 min ago",
      performance: 94
    },
    {
      id: 2,
      name: "Maria Garcia",
      role: "Receptionist",
      department: "Office",
      status: "active",
      currentTask: "Processing incoming calls",
      tasksCompleted: 28,
      hoursToday: 6.0,
      lastActivity: "5 min ago",
      performance: 91
    },
    {
      id: 3,
      name: "Robert Thompson",
      role: "Lead Mechanic",
      department: "Garage",
      status: "active",
      currentTask: "Vehicle #1015 brake repair",
      tasksCompleted: 3,
      hoursToday: 7.0,
      lastActivity: "10 min ago",
      performance: 96
    },
    {
      id: 4,
      name: "Jennifer Martinez",
      role: "Mechanic",
      department: "Garage",
      status: "break",
      currentTask: "On break",
      tasksCompleted: 2,
      hoursToday: 5.5,
      lastActivity: "30 min ago",
      performance: 88
    },
    {
      id: 5,
      name: "William Chen",
      role: "Billing Specialist",
      department: "Finance",
      status: "active",
      currentTask: "Processing trip submissions",
      tasksCompleted: 89,
      hoursToday: 6.0,
      lastActivity: "1 min ago",
      performance: 97
    },
    {
      id: 6,
      name: "Lisa Johnson",
      role: "Payroll Agent",
      department: "Finance",
      status: "active",
      currentTask: "Processing driver payments",
      tasksCompleted: 35,
      hoursToday: 5.5,
      lastActivity: "8 min ago",
      performance: 95
    },
  ];

  const departmentStats = [
    { name: "Operations", staff: 1, activeNow: 1, avgPerformance: 94 },
    { name: "Office", staff: 1, activeNow: 1, avgPerformance: 91 },
    { name: "Garage", staff: 2, activeNow: 1, avgPerformance: 92 },
    { name: "Finance", staff: 2, activeNow: 2, avgPerformance: 96 },
  ];

  const stats = {
    totalStaff: 8,
    activeNow: 5,
    onBreak: 1,
    avgPerformance: 93.5
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      active: { label: "Active", variant: "default", className: "bg-green-500" },
      break: { label: "On Break", variant: "secondary", className: "bg-amber-100 text-amber-700" },
      offline: { label: "Offline", variant: "outline", className: "" },
    };
    const c = config[status] || config.offline;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  const getPerformanceBadge = (performance: number) => {
    if (performance >= 95) return <Badge className="bg-green-500">{performance}%</Badge>;
    if (performance >= 85) return <Badge className="bg-blue-500">{performance}%</Badge>;
    if (performance >= 75) return <Badge className="bg-amber-500">{performance}%</Badge>;
    return <Badge variant="destructive">{performance}%</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staff Monitoring</h1>
          <p className="text-muted-foreground">
            Real-time monitoring of all staff activities
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger className="w-[180px]">
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
          <Button variant="outline">
            <Activity className="mr-2 h-4 w-4" />
            Live View
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Staff</p>
                <p className="text-2xl font-bold">{stats.totalStaff}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeNow}</p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">On Break</p>
                <p className="text-2xl font-bold text-amber-600">{stats.onBreak}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Performance</p>
                <p className="text-2xl font-bold text-blue-600">{stats.avgPerformance}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Department Overview</CardTitle>
          <CardDescription>Staff distribution and performance by department</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            {departmentStats.map((dept) => (
              <div key={dept.name} className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium">{dept.name}</h4>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Staff</span>
                    <span className="font-medium">{dept.staff}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active</span>
                    <span className="font-medium text-green-600">{dept.activeNow}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Performance</span>
                    {getPerformanceBadge(dept.avgPerformance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Activity Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Activity</CardTitle>
          <CardDescription>Real-time staff status and current tasks</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Staff Member</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Current Task</TableHead>
                <TableHead>Tasks Today</TableHead>
                <TableHead>Hours</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staffMembers.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{staff.name}</div>
                      <div className="text-xs text-muted-foreground">{staff.role}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{staff.department}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(staff.status)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{staff.currentTask}</TableCell>
                  <TableCell>{staff.tasksCompleted}</TableCell>
                  <TableCell>{staff.hoursToday}h</TableCell>
                  <TableCell className="text-muted-foreground">{staff.lastActivity}</TableCell>
                  <TableCell>{getPerformanceBadge(staff.performance)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest staff activities across all departments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { time: "09:45 AM", staff: "William Chen", action: "Submitted 15 trips to ModivCare", dept: "Finance" },
              { time: "09:42 AM", staff: "James Anderson", action: "Assigned 5 trips to drivers", dept: "Operations" },
              { time: "09:38 AM", staff: "Maria Garcia", action: "Logged call from ModivCare support", dept: "Office" },
              { time: "09:30 AM", staff: "Robert Thompson", action: "Started repair on Vehicle #1015", dept: "Garage" },
              { time: "09:25 AM", staff: "Lisa Johnson", action: "Processed 10 driver payments", dept: "Finance" },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                <div className="text-sm font-medium text-muted-foreground w-20">{activity.time}</div>
                <div className="flex-1">
                  <span className="font-medium">{activity.staff}</span>
                  <span className="text-muted-foreground"> - {activity.action}</span>
                </div>
                <Badge variant="outline">{activity.dept}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
