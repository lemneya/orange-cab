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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Filter,
  Download,
  Fuel,
  CreditCard,
  MinusCircle,
  Wallet,
  Check,
  X,
  Edit2,
  Trash2,
  ArrowLeft,
} from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { formatCurrency } from "@/lib/payrollCalculations";

// Types
type AdjustmentType = "gas" | "credit" | "advance" | "deduction";

interface Adjustment {
  id: number;
  driverId: number;
  driverName: string;
  driverCode: string;
  type: AdjustmentType;
  amount: number;
  memo: string;
  sourceRef: string | null;
  sourceType: string | null;
  isApproved: boolean;
  createdAt: string;
  createdBy: string;
  payPeriod: string;
}

// Mock data
const mockAdjustments: Adjustment[] = [
  {
    id: 1,
    driverId: 1,
    driverName: "John Smith",
    driverCode: "DRV-001",
    type: "gas",
    amount: 50,
    memo: "Weekly gas allowance",
    sourceRef: null,
    sourceType: null,
    isApproved: true,
    createdAt: "2026-01-10T10:00:00Z",
    createdBy: "Admin",
    payPeriod: "2026-01-12",
  },
  {
    id: 2,
    driverId: 3,
    driverName: "Sarah Davis",
    driverCode: "DRV-003",
    type: "deduction",
    amount: 75,
    memo: "TOLL - EZPass violation #12345",
    sourceRef: "TOLL-12345",
    sourceType: "ticket",
    isApproved: true,
    createdAt: "2026-01-10T11:00:00Z",
    createdBy: "System",
    payPeriod: "2026-01-12",
  },
  {
    id: 3,
    driverId: 3,
    driverName: "Sarah Davis",
    driverCode: "DRV-003",
    type: "credit",
    amount: 25,
    memo: "Bonus for wheelchair trips",
    sourceRef: null,
    sourceType: null,
    isApproved: true,
    createdAt: "2026-01-11T09:00:00Z",
    createdBy: "Admin",
    payPeriod: "2026-01-12",
  },
  {
    id: 4,
    driverId: 5,
    driverName: "Emily Brown",
    driverCode: "DRV-005",
    type: "gas",
    amount: 30,
    memo: "Weekly gas allowance",
    sourceRef: null,
    sourceType: null,
    isApproved: true,
    createdAt: "2026-01-10T10:00:00Z",
    createdBy: "Admin",
    payPeriod: "2026-01-12",
  },
  {
    id: 5,
    driverId: 5,
    driverName: "Emily Brown",
    driverCode: "DRV-005",
    type: "deduction",
    amount: 150,
    memo: "PARKING - PKG-2026-001",
    sourceRef: "PKG-2026-001",
    sourceType: "ticket",
    isApproved: false,
    createdAt: "2026-01-11T14:00:00Z",
    createdBy: "System",
    payPeriod: "2026-01-12",
  },
  {
    id: 6,
    driverId: 2,
    driverName: "Mike Johnson",
    driverCode: "DRV-002",
    type: "gas",
    amount: 50,
    memo: "Weekly gas allowance",
    sourceRef: null,
    sourceType: null,
    isApproved: true,
    createdAt: "2026-01-10T10:00:00Z",
    createdBy: "Admin",
    payPeriod: "2026-01-12",
  },
  {
    id: 7,
    driverId: 4,
    driverName: "David Wilson",
    driverCode: "DRV-004",
    type: "advance",
    amount: 50,
    memo: "MAT bonus",
    sourceRef: null,
    sourceType: null,
    isApproved: true,
    createdAt: "2026-01-09T15:00:00Z",
    createdBy: "Admin",
    payPeriod: "2026-01-12",
  },
];

// Helper components
function TypeBadge({ type }: { type: AdjustmentType }) {
  const config = {
    gas: { label: "Gas", icon: Fuel, className: "bg-orange-100 text-orange-700 border-orange-200" },
    credit: { label: "Credit", icon: CreditCard, className: "bg-green-100 text-green-700 border-green-200" },
    advance: { label: "Advance", icon: Wallet, className: "bg-blue-100 text-blue-700 border-blue-200" },
    deduction: { label: "Deduction", icon: MinusCircle, className: "bg-red-100 text-red-700 border-red-200" },
  };
  
  const { label, icon: Icon, className } = config[type];
  
  return (
    <Badge variant="outline" className={`gap-1 ${className}`}>
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
}

export default function Adjustments() {
  const [, setLocation] = useLocation();
  const [adjustments, setAdjustments] = useState<Adjustment[]>(mockAdjustments);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newAdjustment, setNewAdjustment] = useState({
    driverId: "",
    type: "gas" as AdjustmentType,
    amount: "",
    memo: "",
  });

  // Filter adjustments
  const filteredAdjustments = adjustments.filter(adj => {
    const matchesSearch = 
      adj.driverName.toLowerCase().includes(search.toLowerCase()) ||
      adj.driverCode.toLowerCase().includes(search.toLowerCase()) ||
      adj.memo.toLowerCase().includes(search.toLowerCase());
    
    const matchesType = typeFilter === "all" || adj.type === typeFilter;
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "approved" && adj.isApproved) ||
      (statusFilter === "pending" && !adj.isApproved);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Calculate totals by type
  const totals = adjustments.reduce((acc, adj) => {
    if (adj.isApproved) {
      acc[adj.type] = (acc[adj.type] || 0) + adj.amount;
    }
    return acc;
  }, {} as Record<AdjustmentType, number>);

  const handleApprove = (id: number) => {
    setAdjustments(prev => prev.map(adj => 
      adj.id === id ? { ...adj, isApproved: true } : adj
    ));
  };

  const handleReject = (id: number) => {
    setAdjustments(prev => prev.filter(adj => adj.id !== id));
  };

  const handleAddAdjustment = () => {
    // In real app, this would call the API
    const newAdj: Adjustment = {
      id: Math.max(...adjustments.map(a => a.id)) + 1,
      driverId: parseInt(newAdjustment.driverId),
      driverName: "New Driver", // Would be fetched from API
      driverCode: `DRV-${newAdjustment.driverId.padStart(3, "0")}`,
      type: newAdjustment.type,
      amount: parseFloat(newAdjustment.amount),
      memo: newAdjustment.memo,
      sourceRef: null,
      sourceType: null,
      isApproved: false,
      createdAt: new Date().toISOString(),
      createdBy: "Admin",
      payPeriod: "2026-01-12",
    };
    setAdjustments(prev => [...prev, newAdj]);
    setIsAddDialogOpen(false);
    setNewAdjustment({ driverId: "", type: "gas", amount: "", memo: "" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/payroll/runs")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Adjustments Ledger</h1>
          <p className="text-muted-foreground">
            Gas, credits, advances, and deductions for all drivers
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Adjustment
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Adjustment</DialogTitle>
              <DialogDescription>
                Create a new adjustment for a driver
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Driver ID</Label>
                <Input
                  placeholder="e.g., 1"
                  value={newAdjustment.driverId}
                  onChange={(e) => setNewAdjustment(prev => ({ ...prev, driverId: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newAdjustment.type}
                  onValueChange={(v) => setNewAdjustment(prev => ({ ...prev, type: v as AdjustmentType }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gas">Gas</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                    <SelectItem value="advance">Advance</SelectItem>
                    <SelectItem value="deduction">Deduction</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Amount ($)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={newAdjustment.amount}
                  onChange={(e) => setNewAdjustment(prev => ({ ...prev, amount: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Memo</Label>
                <Textarea
                  placeholder="Description of the adjustment..."
                  value={newAdjustment.memo}
                  onChange={(e) => setNewAdjustment(prev => ({ ...prev, memo: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddAdjustment}>
                Add Adjustment
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Fuel className="h-4 w-4 text-orange-600" />
              Total Gas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">
              {formatCurrency(totals.gas || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-600" />
              Total Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-700">
              {formatCurrency(totals.credit || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              Total Advances
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">
              {formatCurrency(totals.advance || 0)}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MinusCircle className="h-4 w-4 text-red-600" />
              Total Deductions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">
              {formatCurrency(totals.deduction || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by driver or memo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="gas">Gas</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="advance">Advance</SelectItem>
                <SelectItem value="deduction">Deduction</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Adjustments Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Memo</TableHead>
                <TableHead>Source</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAdjustments.map((adj) => (
                <TableRow key={adj.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{adj.driverName}</span>
                      <span className="text-xs text-muted-foreground">{adj.driverCode}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <TypeBadge type={adj.type} />
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {adj.memo}
                  </TableCell>
                  <TableCell>
                    {adj.sourceRef ? (
                      <Badge variant="outline" className="text-xs">
                        {adj.sourceRef}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-xs">Manual</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    <span className={adj.type === "deduction" || adj.type === "gas" ? "text-red-600" : "text-green-600"}>
                      {adj.type === "deduction" || adj.type === "gas" ? "-" : "+"}
                      {formatCurrency(adj.amount)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {adj.isApproved ? (
                      <Badge variant="default" className="bg-green-500">
                        <Check className="h-3 w-3 mr-1" />
                        Approved
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    <div className="flex flex-col">
                      <span>{new Date(adj.createdAt).toLocaleDateString()}</span>
                      <span className="text-xs">{adj.createdBy}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!adj.isApproved && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => handleApprove(adj.id)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleReject(adj.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleReject(adj.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
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
