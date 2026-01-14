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
  Wrench, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Package
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function RepairOrders() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Mock data - would come from API
  const repairOrders = [
    { 
      id: 1, 
      orderNumber: "RO-2026-001", 
      vehicleNumber: "1015", 
      vehicleMake: "Toyota Sienna",
      problem: "Brake pads worn, squeaking noise",
      priority: "urgent",
      status: "in_progress",
      bay: 1,
      mechanic: "Ahmed Hassan",
      dateReported: "2026-01-10",
      estimatedCompletion: "2026-01-13"
    },
    { 
      id: 2, 
      orderNumber: "RO-2026-002", 
      vehicleNumber: "1022", 
      vehicleMake: "Honda Odyssey",
      problem: "Transmission slipping",
      priority: "high",
      status: "in_progress",
      bay: 2,
      mechanic: "Carlos Rodriguez",
      dateReported: "2026-01-11",
      estimatedCompletion: "2026-01-15"
    },
    { 
      id: 3, 
      orderNumber: "RO-2026-003", 
      vehicleNumber: "1008", 
      vehicleMake: "Dodge Caravan",
      problem: "AC not cooling properly",
      priority: "medium",
      status: "waiting_parts",
      bay: null,
      mechanic: "Ahmed Hassan",
      dateReported: "2026-01-09",
      estimatedCompletion: "2026-01-16"
    },
    { 
      id: 4, 
      orderNumber: "RO-2026-004", 
      vehicleNumber: "1031", 
      vehicleMake: "Nissan Quest",
      problem: "Oil change and tire rotation",
      priority: "low",
      status: "pending",
      bay: null,
      mechanic: null,
      dateReported: "2026-01-12",
      estimatedCompletion: "2026-01-14"
    },
    { 
      id: 5, 
      orderNumber: "RO-2025-098", 
      vehicleNumber: "1005", 
      vehicleMake: "Toyota Sienna",
      problem: "Battery replacement",
      priority: "medium",
      status: "completed",
      bay: null,
      mechanic: "Carlos Rodriguez",
      dateReported: "2026-01-08",
      estimatedCompletion: "2026-01-09"
    },
  ];

  const stats = {
    total: 7,
    pending: 2,
    inProgress: 2,
    waitingParts: 1,
    completed: 2
  };

  const getPriorityBadge = (priority: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      urgent: { variant: "destructive", className: "" },
      high: { variant: "default", className: "bg-orange-500" },
      medium: { variant: "secondary", className: "" },
      low: { variant: "outline", className: "" },
    };
    const c = config[priority] || config.medium;
    return <Badge variant={c.variant} className={c.className}>{priority.charAt(0).toUpperCase() + priority.slice(1)}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      pending: { label: "Pending", variant: "outline", className: "" },
      in_progress: { label: "In Progress", variant: "default", className: "bg-blue-500" },
      waiting_parts: { label: "Waiting Parts", variant: "secondary", className: "bg-amber-100 text-amber-700" },
      completed: { label: "Completed", variant: "default", className: "bg-green-500" },
      cancelled: { label: "Cancelled", variant: "outline", className: "text-gray-500" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Repair Orders</h1>
          <p className="text-muted-foreground">
            Manage vehicle repairs and maintenance work orders
          </p>
        </div>
        <Button onClick={() => setLocation("/garage/repairs/new")} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          New Repair Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Open</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Wrench className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-gray-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
              </div>
              <Wrench className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Waiting Parts</p>
                <p className="text-2xl font-bold text-amber-600">{stats.waitingParts}</p>
              </div>
              <Package className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Urgent Alert */}
      <Card className="border-red-200 bg-red-50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <AlertTriangle className="h-8 w-8 text-red-500" />
            <div>
              <h3 className="font-semibold text-red-700">2 Urgent Repairs</h3>
              <p className="text-sm text-red-600">
                Vehicle #1015 (Brake service) and Vehicle #1022 (Transmission) require immediate attention
              </p>
            </div>
            <Button variant="destructive" className="ml-auto" onClick={() => setStatusFilter("in_progress")}>
              View Urgent
            </Button>
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
                  placeholder="Search by order #, vehicle #, or problem..."
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
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_parts">Waiting Parts</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Repair Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Vehicle</TableHead>
                <TableHead>Problem</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bay</TableHead>
                <TableHead>Mechanic</TableHead>
                <TableHead>Est. Completion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {repairOrders.map((order) => (
                <TableRow 
                  key={order.id} 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setLocation(`/garage/repairs/${order.id}`)}
                >
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">#{order.vehicleNumber}</div>
                      <div className="text-sm text-muted-foreground">{order.vehicleMake}</div>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{order.problem}</TableCell>
                  <TableCell>{getPriorityBadge(order.priority)}</TableCell>
                  <TableCell>{getStatusBadge(order.status)}</TableCell>
                  <TableCell>
                    {order.bay ? (
                      <Badge variant="outline">Bay {order.bay}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{order.mechanic || <span className="text-muted-foreground">Unassigned</span>}</TableCell>
                  <TableCell>{new Date(order.estimatedCompletion).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(`/garage/repairs/${order.id}`);
                      }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
