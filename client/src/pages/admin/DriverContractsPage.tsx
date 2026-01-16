/**
 * OC-ADMIN-0: Driver Contracts Management
 * 
 * Per-driver pay overrides with effective dates
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Building2,
  CreditCard,
  DollarSign,
  Search,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ContractFormData {
  driverId: number | null;
  driverName: string;
  opcoId: number | null;
  brokerAccountId: number | null;
  contractType: string;
  payScheme: string;
  hourlyRate: string;
  perTripRate: string;
  perMileRate: string;
  dailyRate: string;
  commissionPercent: string;
  minDailyGuarantee: string;
  maxDailyPay: string;
  effectiveDate: string;
  expirationDate: string;
  notes: string;
  isActive: boolean;
}

const defaultFormData: ContractFormData = {
  driverId: null,
  driverName: "",
  opcoId: null,
  brokerAccountId: null,
  contractType: "W2",
  payScheme: "HOURLY",
  hourlyRate: "",
  perTripRate: "",
  perMileRate: "",
  dailyRate: "",
  commissionPercent: "",
  minDailyGuarantee: "",
  maxDailyPay: "",
  effectiveDate: "",
  expirationDate: "",
  notes: "",
  isActive: true,
};

const CONTRACT_TYPES = [
  { value: "W2", label: "W-2 Employee" },
  { value: "1099", label: "1099 Contractor" },
  { value: "OWNER_OPERATOR", label: "Owner Operator" },
];

const PAY_SCHEMES = [
  { value: "HOURLY", label: "Hourly" },
  { value: "PER_TRIP", label: "Per Trip" },
  { value: "PER_MILE", label: "Per Mile" },
  { value: "DAILY_RATE", label: "Daily Rate" },
  { value: "COMMISSION", label: "Commission" },
  { value: "HYBRID", label: "Hybrid" },
];

export default function DriverContractsPage() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ContractFormData>(defaultFormData);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOpco, setFilterOpco] = useState<string>("all");

  const { data: opcos } = trpc.admin.getOpcos.useQuery();
  const { data: brokerAccounts } = trpc.admin.getBrokerAccounts.useQuery();
  const { data: payDefaults } = trpc.admin.getPayDefaults.useQuery();

  // Mock driver contracts (in real app, this would come from API)
  const mockContracts = [
    {
      id: 1,
      driverId: 101,
      driverName: "John Smith",
      opcoId: 1,
      opcoName: "Sahrawi",
      brokerAccountId: 1,
      brokerAccountName: "Modivcare-Sahrawi",
      contractType: "W2",
      payScheme: "HOURLY",
      hourlyRate: 18.00,
      effectiveDate: "2026-01-01",
      expirationDate: null,
      isActive: true,
      isOverride: true,
    },
    {
      id: 2,
      driverId: 102,
      driverName: "Maria Garcia",
      opcoId: 1,
      opcoName: "Sahrawi",
      brokerAccountId: null,
      brokerAccountName: null,
      contractType: "W2",
      payScheme: "HOURLY",
      hourlyRate: 16.00,
      effectiveDate: "2025-06-01",
      expirationDate: null,
      isActive: true,
      isOverride: false,
    },
    {
      id: 3,
      driverId: 103,
      driverName: "Robert Johnson",
      opcoId: 2,
      opcoName: "Metrix",
      brokerAccountId: 2,
      brokerAccountName: "Modivcare-Metrix",
      contractType: "1099",
      payScheme: "PER_TRIP",
      perTripRate: 12.00,
      effectiveDate: "2026-01-20",
      expirationDate: null,
      isActive: true,
      isOverride: true,
    },
  ];

  const filteredContracts = mockContracts.filter((contract) => {
    const matchesSearch =
      contract.driverName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesOpco =
      filterOpco === "all" || contract.opcoId.toString() === filterOpco;
    return matchesSearch && matchesOpco;
  });

  // Filter broker accounts by selected OpCo
  const filteredBrokerAccounts = brokerAccounts?.filter(
    (a) => !formData.opcoId || a.opcoId === formData.opcoId
  );

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (contract: typeof mockContracts[number]) => {
    setFormData({
      driverId: contract.driverId,
      driverName: contract.driverName,
      opcoId: contract.opcoId,
      brokerAccountId: contract.brokerAccountId,
      contractType: contract.contractType,
      payScheme: contract.payScheme,
      hourlyRate: contract.hourlyRate?.toString() || "",
      perTripRate: (contract as any).perTripRate?.toString() || "",
      perMileRate: "",
      dailyRate: "",
      commissionPercent: "",
      minDailyGuarantee: "",
      maxDailyPay: "",
      effectiveDate: contract.effectiveDate,
      expirationDate: contract.expirationDate || "",
      notes: "",
      isActive: contract.isActive,
    });
    setEditingId(contract.id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    console.log("Saving contract:", formData);
    closeDialog();
  };

  const applyDefault = () => {
    if (!formData.opcoId) return;
    
    // Find matching default
    const matchingDefault = payDefaults?.find(
      (d) =>
        d.opcoId === formData.opcoId &&
        (!d.brokerAccountId || d.brokerAccountId === formData.brokerAccountId)
    );

    if (matchingDefault) {
      setFormData({
        ...formData,
        contractType: matchingDefault.contractType,
        payScheme: matchingDefault.payScheme,
        hourlyRate: matchingDefault.hourlyRate?.toString() || "",
        perTripRate: matchingDefault.perTripRate?.toString() || "",
        perMileRate: matchingDefault.perMileRate?.toString() || "",
        dailyRate: matchingDefault.dailyRate?.toString() || "",
        commissionPercent: matchingDefault.commissionPercent?.toString() || "",
        minDailyGuarantee: matchingDefault.minDailyGuarantee?.toString() || "",
        maxDailyPay: matchingDefault.maxDailyPay?.toString() || "",
      });
    }
  };

  const formatRate = (contract: typeof mockContracts[number]) => {
    if (contract.hourlyRate) return `$${contract.hourlyRate}/hr`;
    if ((contract as any).perTripRate) return `$${(contract as any).perTripRate}/trip`;
    return "N/A";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setLocation("/admin")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              Driver Contracts
            </h1>
            <p className="text-muted-foreground mt-1">
              Per-driver pay overrides with effective dates
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Contract
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by driver name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterOpco} onValueChange={setFilterOpco}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by OpCo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All OpCos</SelectItem>
                {opcos?.map((opco) => (
                  <SelectItem key={opco.id} value={opco.id.toString()}>
                    {opco.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Driver Pay Contracts</CardTitle>
          <CardDescription>
            {filteredContracts.length} contracts found. Overrides are marked with a badge.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Driver</TableHead>
                <TableHead>OpCo</TableHead>
                <TableHead>Broker Account</TableHead>
                <TableHead>Contract</TableHead>
                <TableHead>Pay Scheme</TableHead>
                <TableHead>Rate</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{contract.driverName}</span>
                      {contract.isOverride && (
                        <Badge variant="outline" className="text-xs">Override</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                      {contract.opcoName}
                    </div>
                  </TableCell>
                  <TableCell>
                    {contract.brokerAccountName ? (
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                        {contract.brokerAccountName}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">All accounts</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {CONTRACT_TYPES.find((t) => t.value === contract.contractType)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {PAY_SCHEMES.find((s) => s.value === contract.payScheme)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <DollarSign className="h-3 w-3 text-green-600" />
                      {formatRate(contract)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {contract.effectiveDate}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={contract.isActive ? "default" : "secondary"}>
                      {contract.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(contract)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
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

      {/* Missing Contract Warning */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            Drivers Without Contracts
          </CardTitle>
          <CardDescription className="text-amber-700">
            These drivers will use the OpCo default pay plan. Create a contract to override.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-white">David Wilson (Sahrawi)</Badge>
            <Badge variant="outline" className="bg-white">Sarah Brown (Metrix)</Badge>
            <Badge variant="outline" className="bg-white">Michael Lee (Sahrawi)</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Driver Contract</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the driver's pay contract"
                : "Create a new pay contract for a driver"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Driver Name *</Label>
              <Input
                value={formData.driverName}
                onChange={(e) => setFormData({ ...formData, driverName: e.target.value })}
                placeholder="John Smith"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Operating Company *</Label>
                <Select
                  value={formData.opcoId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, opcoId: parseInt(value), brokerAccountId: null })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select OpCo" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcos?.map((opco) => (
                      <SelectItem key={opco.id} value={opco.id.toString()}>
                        {opco.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Broker Account</Label>
                <Select
                  value={formData.brokerAccountId?.toString() || "all"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      brokerAccountId: value === "all" ? null : parseInt(value),
                    })
                  }
                  disabled={!formData.opcoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All accounts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All accounts</SelectItem>
                    {filteredBrokerAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id.toString()}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Apply Default Button */}
            {formData.opcoId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={applyDefault}
                className="w-full"
              >
                Apply Default Pay Plan for {opcos?.find((o) => o.id === formData.opcoId)?.name}
              </Button>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Contract Type *</Label>
                <Select
                  value={formData.contractType}
                  onValueChange={(value) => setFormData({ ...formData, contractType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTRACT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pay Scheme *</Label>
                <Select
                  value={formData.payScheme}
                  onValueChange={(value) => setFormData({ ...formData, payScheme: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAY_SCHEMES.map((scheme) => (
                      <SelectItem key={scheme.value} value={scheme.value}>
                        {scheme.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Rate fields based on pay scheme */}
            <div className="p-4 bg-slate-50 rounded-lg space-y-4">
              <h4 className="font-medium text-sm">Pay Rates</h4>
              
              {(formData.payScheme === "HOURLY" || formData.payScheme === "HYBRID") && (
                <div className="space-y-2">
                  <Label>Hourly Rate ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.hourlyRate}
                    onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                    placeholder="15.00"
                  />
                </div>
              )}

              {(formData.payScheme === "PER_TRIP" || formData.payScheme === "HYBRID") && (
                <div className="space-y-2">
                  <Label>Per Trip Rate ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.perTripRate}
                    onChange={(e) => setFormData({ ...formData, perTripRate: e.target.value })}
                    placeholder="8.00"
                  />
                </div>
              )}

              {(formData.payScheme === "PER_MILE" || formData.payScheme === "HYBRID") && (
                <div className="space-y-2">
                  <Label>Per Mile Rate ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.perMileRate}
                    onChange={(e) => setFormData({ ...formData, perMileRate: e.target.value })}
                    placeholder="0.55"
                  />
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Effective Date *</Label>
                <Input
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Expiration Date</Label>
                <Input
                  type="date"
                  value={formData.expirationDate}
                  onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Override reason, special terms..."
                rows={2}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={
                !formData.driverName ||
                !formData.opcoId ||
                !formData.effectiveDate
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
