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
  Shield, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle,
  Car,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function InsuranceManagement() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");

  // Mock data - would come from API
  const insurancePolicy = {
    provider: "State Farm Insurance",
    policyNumber: "POL-2026-ORANGE-001",
    effectiveDate: "2026-01-01",
    expirationDate: "2027-01-01",
    premium: 45000.00,
    premiumFrequency: "annual",
    coverageType: "Commercial Fleet",
    deductible: 1000.00,
    vehiclesCovered: 58,
    status: "active"
  };

  const vehicleInsurance = [
    { id: 1, vehicleNumber: "1001", status: "covered", addedDate: "2024-03-15", premium: 750.00 },
    { id: 2, vehicleNumber: "1002", status: "covered", addedDate: "2024-06-01", premium: 750.00 },
    { id: 3, vehicleNumber: "1003", status: "covered", addedDate: "2024-09-10", premium: 750.00 },
    { id: 4, vehicleNumber: "1015", status: "covered", addedDate: "2025-01-15", premium: 800.00 },
    { id: 5, vehicleNumber: "1022", status: "pending_add", addedDate: null, premium: null },
    { id: 6, vehicleNumber: "1045", status: "pending_remove", addedDate: "2023-05-20", premium: 700.00 },
  ];

  const recentChanges = [
    { id: 1, date: "2026-01-10", type: "add", vehicleNumber: "1022", status: "pending", requestedBy: "Fleet Manager" },
    { id: 2, date: "2026-01-08", type: "remove", vehicleNumber: "1045", status: "pending", requestedBy: "Fleet Manager" },
    { id: 3, date: "2026-01-05", type: "add", vehicleNumber: "1020", status: "completed", requestedBy: "Fleet Manager" },
    { id: 4, date: "2025-12-20", type: "remove", vehicleNumber: "1038", status: "completed", requestedBy: "Fleet Manager" },
  ];

  const claims = [
    { id: 1, claimNumber: "CLM-2026-001", vehicleNumber: "1015", date: "2026-01-05", type: "collision", amount: 2500.00, status: "in_review" },
    { id: 2, claimNumber: "CLM-2025-045", vehicleNumber: "1008", date: "2025-11-20", type: "comprehensive", amount: 800.00, status: "paid" },
    { id: 3, claimNumber: "CLM-2025-032", vehicleNumber: "1003", date: "2025-09-15", type: "collision", amount: 3200.00, status: "paid" },
  ];

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      covered: { label: "Covered", variant: "default", className: "bg-green-500" },
      pending_add: { label: "Pending Add", variant: "secondary", className: "bg-blue-100 text-blue-700" },
      pending_remove: { label: "Pending Remove", variant: "secondary", className: "bg-amber-100 text-amber-700" },
      not_covered: { label: "Not Covered", variant: "destructive", className: "" },
      active: { label: "Active", variant: "default", className: "bg-green-500" },
      in_review: { label: "In Review", variant: "secondary", className: "bg-blue-100 text-blue-700" },
      paid: { label: "Paid", variant: "default", className: "bg-green-500" },
      denied: { label: "Denied", variant: "destructive", className: "" },
      completed: { label: "Completed", variant: "default", className: "bg-green-500" },
      pending: { label: "Pending", variant: "outline", className: "" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Insurance Management</h1>
          <p className="text-muted-foreground">
            Manage fleet insurance coverage and claims
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="mr-2 h-4 w-4" />
            View Policy
          </Button>
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="mr-2 h-4 w-4" />
            Add/Remove Vehicle
          </Button>
        </div>
      </div>

      {/* Policy Overview */}
      <Card className="bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-orange-500" />
              <div>
                <CardTitle>{insurancePolicy.provider}</CardTitle>
                <CardDescription>Policy #{insurancePolicy.policyNumber}</CardDescription>
              </div>
            </div>
            {getStatusBadge(insurancePolicy.status)}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="p-4 rounded-lg bg-white">
              <p className="text-sm text-muted-foreground">Coverage Type</p>
              <p className="font-medium">{insurancePolicy.coverageType}</p>
            </div>
            <div className="p-4 rounded-lg bg-white">
              <p className="text-sm text-muted-foreground">Annual Premium</p>
              <p className="font-medium">${insurancePolicy.premium.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-white">
              <p className="text-sm text-muted-foreground">Deductible</p>
              <p className="font-medium">${insurancePolicy.deductible.toLocaleString()}</p>
            </div>
            <div className="p-4 rounded-lg bg-white">
              <p className="text-sm text-muted-foreground">Vehicles Covered</p>
              <p className="font-medium">{insurancePolicy.vehiclesCovered}</p>
            </div>
            <div className="p-4 rounded-lg bg-white">
              <p className="text-sm text-muted-foreground">Expiration</p>
              <p className="font-medium">{new Date(insurancePolicy.expirationDate).toLocaleDateString()}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Covered Vehicles</p>
                <p className="text-2xl font-bold text-green-600">58</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Changes</p>
                <p className="text-2xl font-bold text-blue-600">2</p>
              </div>
              <Car className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Open Claims</p>
                <p className="text-2xl font-bold text-amber-600">1</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Days Until Renewal</p>
                <p className="text-2xl font-bold">353</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Pending Insurance Changes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              Pending Insurance Changes
            </CardTitle>
            <CardDescription>Vehicles waiting to be added or removed from policy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentChanges.filter(c => c.status === "pending").map((change) => (
                <div key={change.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">Vehicle #{change.vehicleNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      {change.type === "add" ? "Add to policy" : "Remove from policy"} - {new Date(change.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={change.type === "add" ? "default" : "secondary"} className={change.type === "add" ? "bg-green-500" : "bg-amber-100 text-amber-700"}>
                      {change.type === "add" ? "Add" : "Remove"}
                    </Badge>
                    <Button size="sm" variant="outline">Process</Button>
                  </div>
                </div>
              ))}
              {recentChanges.filter(c => c.status === "pending").length === 0 && (
                <p className="text-center text-muted-foreground py-4">No pending changes</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Claims */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-amber-500" />
              Recent Claims
            </CardTitle>
            <CardDescription>Insurance claims filed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {claims.map((claim) => (
                <div key={claim.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <div className="font-medium">{claim.claimNumber}</div>
                    <div className="text-sm text-muted-foreground">
                      Vehicle #{claim.vehicleNumber} - {claim.type}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${claim.amount.toLocaleString()}</div>
                    {getStatusBadge(claim.status)}
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full">
                View All Claims
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Vehicle Insurance Status */}
      <Card>
        <CardHeader>
          <CardTitle>Vehicle Insurance Status</CardTitle>
          <CardDescription>Coverage status for all fleet vehicles</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="covered">Covered</SelectItem>
                <SelectItem value="pending_add">Pending Add</SelectItem>
                <SelectItem value="pending_remove">Pending Remove</SelectItem>
                <SelectItem value="not_covered">Not Covered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle #</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added Date</TableHead>
                <TableHead>Monthly Premium</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicleInsurance.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium">
                    <Button 
                      variant="link" 
                      className="p-0 h-auto"
                      onClick={() => setLocation(`/fleet/vehicles/${vehicle.id}`)}
                    >
                      #{vehicle.vehicleNumber}
                    </Button>
                  </TableCell>
                  <TableCell>{getStatusBadge(vehicle.status)}</TableCell>
                  <TableCell>
                    {vehicle.addedDate ? new Date(vehicle.addedDate).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>
                    {vehicle.premium ? `$${vehicle.premium.toFixed(2)}` : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {vehicle.status === "covered" && (
                      <Button variant="outline" size="sm">Remove</Button>
                    )}
                    {vehicle.status === "pending_add" && (
                      <Button variant="outline" size="sm">Cancel</Button>
                    )}
                    {vehicle.status === "pending_remove" && (
                      <Button variant="outline" size="sm">Cancel</Button>
                    )}
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
