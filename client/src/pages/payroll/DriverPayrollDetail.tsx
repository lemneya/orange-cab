import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  ArrowLeft,
  DollarSign, 
  Plus,
  Trash2,
  Edit,
  Fuel,
  CreditCard,
  MinusCircle,
  Gift,
  CheckCircle,
  XCircle,
  Lightbulb,
  FileText,
  Clock,
  Car,
  User,
  Calendar
} from "lucide-react";
import { useState } from "react";
import { useLocation, useParams } from "wouter";

// Types
interface Adjustment {
  id: number;
  type: "gas" | "credit" | "advance" | "deduction";
  amount: number; // in cents
  memo: string;
  sourceRef: string | null;
  sourceType: string | null;
  sourceId: number | null;
  isAutoSuggested: boolean;
  isApproved: boolean;
  createdAt: string;
  createdBy: string;
}

interface SuggestedDeduction {
  ticketId: number;
  ticketType: string;
  ticketNumber: string;
  amount: number;
  issueDate: string;
}

interface Trip {
  id: number;
  tripDate: string;
  pickupTime: string;
  dropoffTime: string;
  pickupAddress: string;
  dropoffAddress: string;
  miles: number;
  status: string;
  medirouteId: string;
}

export default function DriverPayrollDetail() {
  const [, setLocation] = useLocation();
  const { id } = useParams();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdjustment, setEditingAdjustment] = useState<Adjustment | null>(null);

  // Form state for add/edit modal
  const [adjustmentForm, setAdjustmentForm] = useState({
    type: "gas" as "gas" | "credit" | "advance" | "deduction",
    amount: "",
    memo: "",
    sourceRef: ""
  });

  // Mock driver payment data
  const driverPayment = {
    id: parseInt(id || "1"),
    driverId: 3,
    driverName: "Sarah Davis",
    driverCode: "DRV-003",
    phone: "(555) 123-4567",
    email: "sarah.davis@email.com",
    contractType: "standard",
    ratePerMile: 150, // $1.50/mile in cents
    weekEnding: "2026-01-12",
    periodStart: "2026-01-06",
    periodEnd: "2026-01-12",
    trips: 42,
    totalMiles: 630,
    grossPay: 94500, // $945.00
    status: "pending" as const
  };

  // Mock adjustments
  const [adjustments, setAdjustments] = useState<Adjustment[]>([
    {
      id: 1,
      type: "deduction",
      amount: 7500,
      memo: "TOLL - EZPass violation #12345",
      sourceRef: "TOLL-12345",
      sourceType: "ticket",
      sourceId: 101,
      isAutoSuggested: true,
      isApproved: true,
      createdAt: "2026-01-10T10:30:00Z",
      createdBy: "System"
    },
    {
      id: 2,
      type: "credit",
      amount: 2500,
      memo: "Bonus for wheelchair trips",
      sourceRef: null,
      sourceType: null,
      sourceId: null,
      isAutoSuggested: false,
      isApproved: true,
      createdAt: "2026-01-11T14:00:00Z",
      createdBy: "John Admin"
    }
  ]);

  // Mock suggested deductions from tickets/tolls
  const suggestedDeductions: SuggestedDeduction[] = [
    {
      ticketId: 102,
      ticketType: "parking",
      ticketNumber: "PKG-2026-001",
      amount: 5000,
      issueDate: "2026-01-08"
    }
  ];

  // Mock trips for this period
  const trips: Trip[] = [
    {
      id: 1,
      tripDate: "2026-01-06",
      pickupTime: "08:30",
      dropoffTime: "09:15",
      pickupAddress: "123 Main St, Richmond, VA",
      dropoffAddress: "456 Oak Ave, Richmond, VA",
      miles: 12.5,
      status: "completed",
      medirouteId: "MR-2026-001234"
    },
    {
      id: 2,
      tripDate: "2026-01-06",
      pickupTime: "10:00",
      dropoffTime: "10:45",
      pickupAddress: "789 Pine Rd, Richmond, VA",
      dropoffAddress: "321 Elm St, Richmond, VA",
      miles: 15.2,
      status: "completed",
      medirouteId: "MR-2026-001235"
    },
    {
      id: 3,
      tripDate: "2026-01-07",
      pickupTime: "07:45",
      dropoffTime: "08:30",
      pickupAddress: "555 Cedar Ln, Richmond, VA",
      dropoffAddress: "777 Maple Dr, Richmond, VA",
      miles: 18.0,
      status: "completed",
      medirouteId: "MR-2026-001240"
    }
  ];

  // Calculate totals
  const calculateTotals = () => {
    let gas = 0, credits = 0, deductions = 0;
    
    adjustments.filter(a => a.isApproved).forEach(adj => {
      switch (adj.type) {
        case "gas":
          gas += adj.amount;
          break;
        case "credit":
        case "advance":
          credits += adj.amount;
          break;
        case "deduction":
          deductions += adj.amount;
          break;
      }
    });

    const grossPay = driverPayment.totalMiles * driverPayment.ratePerMile;
    const netPay = grossPay + credits - gas - deductions;

    return { gas, credits, deductions, grossPay, netPay };
  };

  const totals = calculateTotals();

  // Get icon for adjustment type
  const getAdjustmentIcon = (type: string) => {
    switch (type) {
      case "gas": return <Fuel className="h-4 w-4 text-amber-600" />;
      case "credit": return <CreditCard className="h-4 w-4 text-green-600" />;
      case "advance": return <Gift className="h-4 w-4 text-blue-600" />;
      case "deduction": return <MinusCircle className="h-4 w-4 text-red-600" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  // Get badge for adjustment type
  const getTypeBadge = (type: string) => {
    const config: Record<string, { label: string; className: string }> = {
      gas: { label: "Gas", className: "bg-amber-100 text-amber-800 border-amber-300" },
      credit: { label: "Credit", className: "bg-green-100 text-green-800 border-green-300" },
      advance: { label: "Advance", className: "bg-blue-100 text-blue-800 border-blue-300" },
      deduction: { label: "Deduction", className: "bg-red-100 text-red-800 border-red-300" },
    };
    const c = config[type] || { label: type, className: "" };
    return <Badge variant="outline" className={c.className}>{c.label}</Badge>;
  };

  // Handle add adjustment
  const handleAddAdjustment = () => {
    const newAdjustment: Adjustment = {
      id: Date.now(),
      type: adjustmentForm.type,
      amount: Math.round(parseFloat(adjustmentForm.amount || "0") * 100),
      memo: adjustmentForm.memo,
      sourceRef: adjustmentForm.sourceRef || null,
      sourceType: null,
      sourceId: null,
      isAutoSuggested: false,
      isApproved: true,
      createdAt: new Date().toISOString(),
      createdBy: "Current User"
    };

    setAdjustments(prev => [...prev, newAdjustment]);
    setAdjustmentForm({ type: "gas", amount: "", memo: "", sourceRef: "" });
    setIsAddModalOpen(false);
  };

  // Handle edit adjustment
  const handleEditAdjustment = () => {
    if (!editingAdjustment) return;

    setAdjustments(prev => prev.map(adj => 
      adj.id === editingAdjustment.id
        ? {
            ...adj,
            type: adjustmentForm.type,
            amount: Math.round(parseFloat(adjustmentForm.amount || "0") * 100),
            memo: adjustmentForm.memo,
            sourceRef: adjustmentForm.sourceRef || null
          }
        : adj
    ));

    setEditingAdjustment(null);
    setAdjustmentForm({ type: "gas", amount: "", memo: "", sourceRef: "" });
  };

  // Handle delete adjustment
  const handleDeleteAdjustment = (id: number) => {
    setAdjustments(prev => prev.filter(adj => adj.id !== id));
  };

  // Handle toggle approval
  const handleToggleApproval = (id: number) => {
    setAdjustments(prev => prev.map(adj =>
      adj.id === id ? { ...adj, isApproved: !adj.isApproved } : adj
    ));
  };

  // Handle apply suggested deduction
  const handleApplySuggested = (suggestion: SuggestedDeduction) => {
    const newAdjustment: Adjustment = {
      id: Date.now(),
      type: "deduction",
      amount: suggestion.amount,
      memo: `${suggestion.ticketType.toUpperCase()} - ${suggestion.ticketNumber}`,
      sourceRef: suggestion.ticketNumber,
      sourceType: "ticket",
      sourceId: suggestion.ticketId,
      isAutoSuggested: true,
      isApproved: true,
      createdAt: new Date().toISOString(),
      createdBy: "System"
    };

    setAdjustments(prev => [...prev, newAdjustment]);
  };

  // Open edit modal
  const openEditModal = (adjustment: Adjustment) => {
    setEditingAdjustment(adjustment);
    setAdjustmentForm({
      type: adjustment.type,
      amount: (adjustment.amount / 100).toFixed(2),
      memo: adjustment.memo,
      sourceRef: adjustment.sourceRef || ""
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/payroll/drivers")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Driver Payroll Detail</h1>
          <p className="text-muted-foreground">
            Week ending {driverPayment.weekEnding}
          </p>
        </div>
        <Badge 
          variant="outline" 
          className={driverPayment.status === "pending" ? "border-amber-300 text-amber-700" : "bg-green-500 text-white"}
        >
          {driverPayment.status.charAt(0).toUpperCase() + driverPayment.status.slice(1)}
        </Badge>
      </div>

      {/* Driver Info Card */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Driver Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="font-medium">{driverPayment.driverName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Driver ID</p>
              <p className="font-medium">{driverPayment.driverCode}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="font-medium">{driverPayment.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contract Type</p>
              <p className="font-medium capitalize">{driverPayment.contractType}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Pay Period
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-sm text-muted-foreground">Period</p>
              <p className="font-medium">{driverPayment.periodStart} to {driverPayment.periodEnd}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Trips</p>
              <p className="font-medium">{driverPayment.trips}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Miles</p>
              <p className="font-medium">{driverPayment.totalMiles}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rate</p>
              <p className="font-medium">${(driverPayment.ratePerMile / 100).toFixed(2)}/mile</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Payment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <p className="text-sm text-muted-foreground">Gross Pay</p>
              <p className="font-medium">${(totals.grossPay / 100).toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-green-600">
              <p className="text-sm">+ Credits</p>
              <p className="font-medium">+${(totals.credits / 100).toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-amber-600">
              <p className="text-sm">- Gas</p>
              <p className="font-medium">-${(totals.gas / 100).toFixed(2)}</p>
            </div>
            <div className="flex justify-between text-red-600">
              <p className="text-sm">- Deductions</p>
              <p className="font-medium">-${(totals.deductions / 100).toFixed(2)}</p>
            </div>
            <hr className="my-2" />
            <div className="flex justify-between">
              <p className="font-bold">Net Pay</p>
              <p className={`text-xl font-bold ${totals.netPay < 0 ? "text-red-600" : "text-green-600"}`}>
                ${(totals.netPay / 100).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suggested Deductions */}
      {suggestedDeductions.length > 0 && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <Lightbulb className="h-4 w-4" />
              Suggested Deductions from Tickets/Tolls
            </CardTitle>
            <CardDescription>
              These tickets/tolls were found for this driver during this pay period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suggestedDeductions.map(suggestion => (
                <div 
                  key={suggestion.ticketId}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    <MinusCircle className="h-5 w-5 text-red-500" />
                    <div>
                      <p className="font-medium">
                        {suggestion.ticketType.toUpperCase()} - {suggestion.ticketNumber}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Issue Date: {suggestion.issueDate}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-600">
                      ${(suggestion.amount / 100).toFixed(2)}
                    </span>
                    <Button 
                      size="sm"
                      onClick={() => handleApplySuggested(suggestion)}
                    >
                      <Plus className="mr-1 h-4 w-4" />
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Adjustment Ledger */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Adjustment Ledger</CardTitle>
              <CardDescription>
                Gas, credits, and deductions for this pay period
              </CardDescription>
            </div>
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Adjustment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Adjustment</DialogTitle>
                  <DialogDescription>
                    Add a gas, credit, advance, or deduction entry
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select 
                      value={adjustmentForm.type} 
                      onValueChange={(value: "gas" | "credit" | "advance" | "deduction") => 
                        setAdjustmentForm(prev => ({ ...prev, type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gas">
                          <div className="flex items-center gap-2">
                            <Fuel className="h-4 w-4 text-amber-600" />
                            Gas
                          </div>
                        </SelectItem>
                        <SelectItem value="credit">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-green-600" />
                            Credit
                          </div>
                        </SelectItem>
                        <SelectItem value="advance">
                          <div className="flex items-center gap-2">
                            <Gift className="h-4 w-4 text-blue-600" />
                            Advance
                          </div>
                        </SelectItem>
                        <SelectItem value="deduction">
                          <div className="flex items-center gap-2">
                            <MinusCircle className="h-4 w-4 text-red-600" />
                            Deduction
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={adjustmentForm.amount}
                      onChange={(e) => setAdjustmentForm(prev => ({ ...prev, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Memo / Description</Label>
                    <Textarea
                      placeholder="Enter description..."
                      value={adjustmentForm.memo}
                      onChange={(e) => setAdjustmentForm(prev => ({ ...prev, memo: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reference # (Optional)</Label>
                    <Input
                      placeholder="e.g., TOLL-12345"
                      value={adjustmentForm.sourceRef}
                      onChange={(e) => setAdjustmentForm(prev => ({ ...prev, sourceRef: e.target.value }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddAdjustment}>
                    Add Adjustment
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {adjustments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No adjustments for this pay period</p>
              <p className="text-sm">Click "Add Adjustment" to add gas, credits, or deductions</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map(adjustment => (
                  <TableRow key={adjustment.id} className={!adjustment.isApproved ? "opacity-50" : ""}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getAdjustmentIcon(adjustment.type)}
                        {getTypeBadge(adjustment.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{adjustment.memo}</p>
                        {adjustment.isAutoSuggested && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            <Lightbulb className="h-3 w-3 mr-1" />
                            Auto-suggested
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {adjustment.sourceRef || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={
                        adjustment.type === "credit" || adjustment.type === "advance"
                          ? "text-green-600 font-medium"
                          : "text-red-600 font-medium"
                      }>
                        {adjustment.type === "credit" || adjustment.type === "advance" ? "+" : "-"}
                        ${(adjustment.amount / 100).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleApproval(adjustment.id)}
                        className={adjustment.isApproved ? "text-green-600" : "text-gray-400"}
                      >
                        {adjustment.isApproved ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                        <span className="ml-1 text-xs">
                          {adjustment.isApproved ? "Approved" : "Pending"}
                        </span>
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{new Date(adjustment.createdAt).toLocaleDateString()}</p>
                        <p className="text-xs text-muted-foreground">{adjustment.createdBy}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Dialog 
                          open={editingAdjustment?.id === adjustment.id} 
                          onOpenChange={(open) => !open && setEditingAdjustment(null)}
                        >
                          <DialogTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => openEditModal(adjustment)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Adjustment</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-2">
                                <Label>Type</Label>
                                <Select 
                                  value={adjustmentForm.type} 
                                  onValueChange={(value: "gas" | "credit" | "advance" | "deduction") => 
                                    setAdjustmentForm(prev => ({ ...prev, type: value }))
                                  }
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
                                  value={adjustmentForm.amount}
                                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, amount: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Memo</Label>
                                <Textarea
                                  value={adjustmentForm.memo}
                                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, memo: e.target.value }))}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Reference #</Label>
                                <Input
                                  value={adjustmentForm.sourceRef}
                                  onChange={(e) => setAdjustmentForm(prev => ({ ...prev, sourceRef: e.target.value }))}
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setEditingAdjustment(null)}>
                                Cancel
                              </Button>
                              <Button onClick={handleEditAdjustment}>
                                Save Changes
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-red-500">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Adjustment</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this adjustment? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                className="bg-red-500 hover:bg-red-600"
                                onClick={() => handleDeleteAdjustment(adjustment.id)}
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Trip Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Car className="h-4 w-4" />
            Trip Details
          </CardTitle>
          <CardDescription>
            Completed trips for this pay period (showing first 3 of {driverPayment.trips})
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Pickup</TableHead>
                <TableHead>Dropoff</TableHead>
                <TableHead className="text-right">Miles</TableHead>
                <TableHead>MediRoute ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {trips.map(trip => (
                <TableRow key={trip.id}>
                  <TableCell>{trip.tripDate}</TableCell>
                  <TableCell>
                    {trip.pickupTime} - {trip.dropoffTime}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={trip.pickupAddress}>
                    {trip.pickupAddress}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate" title={trip.dropoffAddress}>
                    {trip.dropoffAddress}
                  </TableCell>
                  <TableCell className="text-right">{trip.miles.toFixed(1)}</TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {trip.medirouteId}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All {driverPayment.trips} Trips
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => setLocation("/payroll/drivers")}>
          Cancel
        </Button>
        {driverPayment.status === "pending" && (
          <Button className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="mr-2 h-4 w-4" />
            Approve Payment
          </Button>
        )}
      </div>
    </div>
  );
}
