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
  FileText, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle,
  CheckCircle,
  Download,
  Eye
} from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function Contracts() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Mock data - would come from API
  const contracts = [
    {
      id: 1,
      contractNumber: "CTR-2026-001",
      driverName: "John Smith",
      driverId: 1,
      contractType: "1099",
      startDate: "2024-03-15",
      endDate: null,
      payRate: 45.00,
      payFrequency: "weekly",
      status: "active",
      signedDate: "2024-03-10"
    },
    {
      id: 2,
      contractNumber: "CTR-2026-002",
      driverName: "Mike Johnson",
      driverId: 2,
      contractType: "1099",
      startDate: "2024-06-01",
      endDate: null,
      payRate: 42.50,
      payFrequency: "weekly",
      status: "active",
      signedDate: "2024-05-28"
    },
    {
      id: 3,
      contractNumber: "CTR-2026-003",
      driverName: "Sarah Davis",
      driverId: 3,
      contractType: "1099",
      startDate: "2025-01-15",
      endDate: "2026-01-14",
      payRate: 40.00,
      payFrequency: "weekly",
      status: "expiring",
      signedDate: "2025-01-10"
    },
    {
      id: 4,
      contractNumber: "CTR-2025-045",
      driverName: "David Wilson",
      driverId: 4,
      contractType: "1099",
      startDate: "2025-02-01",
      endDate: "2025-12-31",
      payRate: 38.00,
      payFrequency: "weekly",
      status: "expired",
      signedDate: "2025-01-25"
    },
    {
      id: 5,
      contractNumber: "CTR-2026-004",
      driverName: "Robert Miller",
      driverId: 5,
      contractType: "1099",
      startDate: "2026-01-15",
      endDate: null,
      payRate: 43.00,
      payFrequency: "weekly",
      status: "active",
      signedDate: "2026-01-12"
    },
  ];

  const stats = {
    total: 40,
    active: 36,
    expiringSoon: 3,
    expired: 1
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }> = {
      active: { label: "Active", variant: "default", className: "bg-green-500" },
      expiring: { label: "Expiring Soon", variant: "secondary", className: "bg-amber-100 text-amber-700" },
      expired: { label: "Expired", variant: "destructive", className: "" },
      terminated: { label: "Terminated", variant: "outline", className: "text-gray-500" },
    };
    const c = config[status] || config.active;
    return <Badge variant={c.variant} className={c.className}>{c.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Driver Contracts</h1>
          <p className="text-muted-foreground">
            Manage 1099 contractor agreements
          </p>
        </div>
        <Button className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          New Contract
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contracts</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expiring Soon</p>
                <p className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Within 30 days</p>
          </CardContent>
        </Card>
        <Card className="bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Expired</p>
                <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Requires renewal</p>
          </CardContent>
        </Card>
      </div>

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
                  placeholder="Search by contract # or driver name..."
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
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="terminated">Terminated</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Contract Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="1099">1099 Contractor</SelectItem>
                <SelectItem value="w2">W2 Employee</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contract #</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Pay Rate</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                  <TableCell>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto"
                      onClick={() => setLocation(`/hr/drivers/${contract.driverId}`)}
                    >
                      {contract.driverName}
                    </Button>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{contract.contractType}</Badge>
                  </TableCell>
                  <TableCell>
                    ${contract.payRate.toFixed(2)}/trip
                    <div className="text-xs text-muted-foreground">{contract.payFrequency}</div>
                  </TableCell>
                  <TableCell>{new Date(contract.startDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {contract.endDate ? (
                      <div className="flex items-center gap-1">
                        {contract.status === "expiring" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                        {new Date(contract.endDate).toLocaleDateString()}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Ongoing</span>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(contract.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      {(contract.status === "expiring" || contract.status === "expired") && (
                        <Button variant="outline" size="sm">Renew</Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contract Terms Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Standard Contract Terms</CardTitle>
          <CardDescription>Default terms for 1099 contractor agreements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Pay Structure</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Per-trip rate: $38 - $48</li>
                <li>• Weekly payment schedule</li>
                <li>• Direct deposit available</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Shift Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Standard shift: 4AM - 4PM</li>
                <li>• 5 days minimum per week</li>
                <li>• Day off requests: 48h notice</li>
              </ul>
            </div>
            <div className="p-4 rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Requirements</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Valid VA driver's license</li>
                <li>• Background check clearance</li>
                <li>• Drug test compliance</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
