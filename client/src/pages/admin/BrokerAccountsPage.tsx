/**
 * OC-ADMIN-0: Broker Accounts Management
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
  CreditCard,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Building2,
  Briefcase,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface AccountFormData {
  brokerId: number | null;
  opcoId: number | null;
  name: string;
  code: string;
  accountNumber: string;
  contractStartDate: string;
  contractEndDate: string;
  notes: string;
  isActive: boolean;
}

const defaultFormData: AccountFormData = {
  brokerId: null,
  opcoId: null,
  name: "",
  code: "",
  accountNumber: "",
  contractStartDate: "",
  contractEndDate: "",
  notes: "",
  isActive: true,
};

export default function BrokerAccountsPage() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<AccountFormData>(defaultFormData);

  const utils = trpc.useUtils();
  const { data: accounts, isLoading } = trpc.admin.getBrokerAccounts.useQuery({ includeInactive: true });
  const { data: brokers } = trpc.admin.getBrokers.useQuery();
  const { data: opcos } = trpc.admin.getOpcos.useQuery();
  
  const createMutation = trpc.admin.createBrokerAccount.useMutation({
    onSuccess: () => {
      utils.admin.getBrokerAccounts.invalidate();
      closeDialog();
    },
  });
  const updateMutation = trpc.admin.updateBrokerAccount.useMutation({
    onSuccess: () => {
      utils.admin.getBrokerAccounts.invalidate();
      closeDialog();
    },
  });
  const deleteMutation = trpc.admin.deleteBrokerAccount.useMutation({
    onSuccess: () => {
      utils.admin.getBrokerAccounts.invalidate();
    },
  });

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (account: typeof accounts extends (infer T)[] | undefined ? T : never) => {
    if (!account) return;
    setFormData({
      brokerId: account.brokerId,
      opcoId: account.opcoId || null,
      name: account.name,
      code: account.code,
      accountNumber: account.accountNumber || "",
      contractStartDate: account.contractStartDate || "",
      contractEndDate: account.contractEndDate || "",
      notes: account.notes || "",
      isActive: account.isActive,
    });
    setEditingId(account.id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    if (!formData.brokerId) return;
    
    const data = {
      brokerId: formData.brokerId,
      opcoId: formData.opcoId || undefined,
      name: formData.name,
      code: formData.code,
      accountNumber: formData.accountNumber || undefined,
      contractStartDate: formData.contractStartDate || undefined,
      contractEndDate: formData.contractEndDate || undefined,
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
    if (confirm("Are you sure you want to delete this broker account?")) {
      deleteMutation.mutate({ id });
    }
  };

  // Auto-generate code from broker + opco selection
  const generateCode = (brokerId: number | null, opcoId: number | null) => {
    const broker = brokers?.find(b => b.id === brokerId);
    const opco = opcos?.find(o => o.id === opcoId);
    
    if (broker && opco) {
      return `${broker.code}_${opco.code}`;
    } else if (broker) {
      return `${broker.code}_MAIN`;
    }
    return "";
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
              <CreditCard className="h-8 w-8 text-primary" />
              Broker Accounts
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure OpCo-specific broker relationships (e.g., Modivcare–Sahrawi)
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Broker Accounts</CardTitle>
          <CardDescription>{accounts?.length || 0} accounts configured</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : accounts && accounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Broker</TableHead>
                  <TableHead>OpCo</TableHead>
                  <TableHead>Contract Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{account.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3 text-muted-foreground" />
                        {account.brokerName || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      {account.opcoName ? (
                        <div className="flex items-center gap-1">
                          <Building2 className="h-3 w-3 text-muted-foreground" />
                          {account.opcoName}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Global</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {account.contractStartDate && (
                          <span>
                            {account.contractStartDate}
                            {account.contractEndDate && ` → ${account.contractEndDate}`}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={account.isActive ? "default" : "secondary"}>
                        {account.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(account)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(account.id)}
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
              No broker accounts configured. Click "Add Account" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Broker Account</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the broker account details"
                : "Create a new broker account relationship"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="broker">Broker *</Label>
              <Select
                value={formData.brokerId?.toString() || ""}
                onValueChange={(value) => {
                  const brokerId = parseInt(value);
                  setFormData({
                    ...formData,
                    brokerId,
                    code: generateCode(brokerId, formData.opcoId),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select broker" />
                </SelectTrigger>
                <SelectContent>
                  {brokers?.map((broker) => (
                    <SelectItem key={broker.id} value={broker.id.toString()}>
                      {broker.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="opco">Operating Company</Label>
              <Select
                value={formData.opcoId?.toString() || "global"}
                onValueChange={(value) => {
                  const opcoId = value === "global" ? null : parseInt(value);
                  setFormData({
                    ...formData,
                    opcoId,
                    code: generateCode(formData.brokerId, opcoId),
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select OpCo (or Global)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (All OpCos)</SelectItem>
                  {opcos?.map((opco) => (
                    <SelectItem key={opco.id} value={opco.id.toString()}>
                      {opco.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Modivcare – Sahrawi"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="MODIVCARE_SAHRAWI"
              />
              <p className="text-xs text-muted-foreground">
                Auto-generated from Broker + OpCo selection
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                placeholder="ACC-12345"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractStartDate">Contract Start</Label>
                <Input
                  id="contractStartDate"
                  type="date"
                  value={formData.contractStartDate}
                  onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contractEndDate">Contract End</Label>
                <Input
                  id="contractEndDate"
                  type="date"
                  value={formData.contractEndDate}
                  onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes..."
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
                !formData.brokerId ||
                !formData.name ||
                !formData.code ||
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
