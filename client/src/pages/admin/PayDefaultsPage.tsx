/**
 * OC-ADMIN-0: Driver Pay Defaults Management
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
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface PayDefaultFormData {
  opcoId: number | null;
  brokerAccountId: number | null;
  name: string;
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

const defaultFormData: PayDefaultFormData = {
  opcoId: null,
  brokerAccountId: null,
  name: "",
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

export default function PayDefaultsPage() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PayDefaultFormData>(defaultFormData);

  const utils = trpc.useUtils();
  const { data: payDefaults, isLoading } = trpc.admin.getPayDefaults.useQuery({ includeInactive: true });
  const { data: opcos } = trpc.admin.getOpcos.useQuery();
  const { data: brokerAccounts } = trpc.admin.getBrokerAccounts.useQuery();

  const createMutation = trpc.admin.createPayDefault.useMutation({
    onSuccess: () => {
      utils.admin.getPayDefaults.invalidate();
      closeDialog();
    },
  });
  const updateMutation = trpc.admin.updatePayDefault.useMutation({
    onSuccess: () => {
      utils.admin.getPayDefaults.invalidate();
      closeDialog();
    },
  });
  const deleteMutation = trpc.admin.deletePayDefault.useMutation({
    onSuccess: () => {
      utils.admin.getPayDefaults.invalidate();
    },
  });

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (payDefault: NonNullable<typeof payDefaults>[number]) => {
    setFormData({
      opcoId: payDefault.opcoId,
      brokerAccountId: payDefault.brokerAccountId || null,
      name: payDefault.name,
      contractType: payDefault.contractType,
      payScheme: payDefault.payScheme,
      hourlyRate: payDefault.hourlyRate?.toString() || "",
      perTripRate: payDefault.perTripRate?.toString() || "",
      perMileRate: payDefault.perMileRate?.toString() || "",
      dailyRate: payDefault.dailyRate?.toString() || "",
      commissionPercent: payDefault.commissionPercent?.toString() || "",
      minDailyGuarantee: payDefault.minDailyGuarantee?.toString() || "",
      maxDailyPay: payDefault.maxDailyPay?.toString() || "",
      effectiveDate: payDefault.effectiveDate,
      expirationDate: payDefault.expirationDate || "",
      notes: payDefault.notes || "",
      isActive: payDefault.isActive,
    });
    setEditingId(payDefault.id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    if (!formData.opcoId) return;

    const data = {
      opcoId: formData.opcoId,
      brokerAccountId: formData.brokerAccountId || undefined,
      name: formData.name,
      contractType: formData.contractType as "W2" | "1099" | "OWNER_OPERATOR",
      payScheme: formData.payScheme as "HOURLY" | "PER_TRIP" | "PER_MILE" | "DAILY_RATE" | "COMMISSION" | "HYBRID",
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
      perTripRate: formData.perTripRate ? parseFloat(formData.perTripRate) : undefined,
      perMileRate: formData.perMileRate ? parseFloat(formData.perMileRate) : undefined,
      dailyRate: formData.dailyRate ? parseFloat(formData.dailyRate) : undefined,
      commissionPercent: formData.commissionPercent ? parseFloat(formData.commissionPercent) : undefined,
      minDailyGuarantee: formData.minDailyGuarantee ? parseFloat(formData.minDailyGuarantee) : undefined,
      maxDailyPay: formData.maxDailyPay ? parseFloat(formData.maxDailyPay) : undefined,
      effectiveDate: formData.effectiveDate,
      expirationDate: formData.expirationDate || undefined,
      notes: formData.notes || undefined,
      isActive: formData.isActive,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this pay default?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Filter broker accounts by selected OpCo
  const filteredBrokerAccounts = brokerAccounts?.filter(
    (a) => !formData.opcoId || a.opcoId === formData.opcoId
  );

  // Format rate display
  const formatRate = (payDefault: NonNullable<typeof payDefaults>[number]) => {
    const parts: string[] = [];
    if (payDefault.hourlyRate) parts.push(`$${payDefault.hourlyRate}/hr`);
    if (payDefault.perTripRate) parts.push(`$${payDefault.perTripRate}/trip`);
    if (payDefault.perMileRate) parts.push(`$${payDefault.perMileRate}/mi`);
    if (payDefault.dailyRate) parts.push(`$${payDefault.dailyRate}/day`);
    if (payDefault.commissionPercent) parts.push(`${payDefault.commissionPercent}%`);
    return parts.join(" + ") || "Not set";
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
              Driver Pay Defaults
            </h1>
            <p className="text-muted-foreground mt-1">
              Set default pay rates for new drivers by OpCo and broker account
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Pay Default
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Pay Default Plans</CardTitle>
          <CardDescription>
            {payDefaults?.length || 0} pay plans configured. These are applied to new drivers at hiring.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : payDefaults && payDefaults.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
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
                {payDefaults.map((payDefault) => (
                  <TableRow key={payDefault.id}>
                    <TableCell className="font-medium">{payDefault.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {payDefault.opcoName}
                      </div>
                    </TableCell>
                    <TableCell>
                      {payDefault.brokerAccountName ? (
                        <div className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3 text-muted-foreground" />
                          {payDefault.brokerAccountName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">All accounts</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {CONTRACT_TYPES.find((t) => t.value === payDefault.contractType)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {PAY_SCHEMES.find((s) => s.value === payDefault.payScheme)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <DollarSign className="h-3 w-3 text-green-600" />
                        {formatRate(payDefault)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {payDefault.effectiveDate}
                        {payDefault.expirationDate && (
                          <span className="text-muted-foreground">
                            {" → "}{payDefault.expirationDate}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={payDefault.isActive ? "default" : "secondary"}>
                        {payDefault.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(payDefault)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(payDefault.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No pay defaults configured. Click "Add Pay Default" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Pay Default</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the pay default settings"
                : "Create a new default pay plan for drivers"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Standard W2 Hourly - Sahrawi"
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

              {formData.payScheme === "DAILY_RATE" && (
                <div className="space-y-2">
                  <Label>Daily Rate ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.dailyRate}
                    onChange={(e) => setFormData({ ...formData, dailyRate: e.target.value })}
                    placeholder="150.00"
                  />
                </div>
              )}

              {(formData.payScheme === "COMMISSION" || formData.payScheme === "HYBRID") && (
                <div className="space-y-2">
                  <Label>Commission (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.commissionPercent}
                    onChange={(e) => setFormData({ ...formData, commissionPercent: e.target.value })}
                    placeholder="50"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Daily Guarantee ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.minDailyGuarantee}
                    onChange={(e) => setFormData({ ...formData, minDailyGuarantee: e.target.value })}
                    placeholder="100.00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Daily Pay ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.maxDailyPay}
                    onChange={(e) => setFormData({ ...formData, maxDailyPay: e.target.value })}
                    placeholder="300.00"
                  />
                </div>
              </div>
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
                placeholder="Additional notes about this pay plan..."
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
                !formData.opcoId ||
                !formData.name ||
                !formData.effectiveDate ||
                createMutation.isPending ||
                updateMutation.isPending
              }
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
