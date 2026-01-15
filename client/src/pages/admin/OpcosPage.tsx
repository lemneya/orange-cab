/**
 * OC-ADMIN-0: Operating Companies Management
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Building2,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Check,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface OpcoFormData {
  name: string;
  code: string;
  timezone: string;
  address: string;
  phone: string;
  email: string;
  isActive: boolean;
}

const defaultFormData: OpcoFormData = {
  name: "",
  code: "",
  timezone: "America/New_York",
  address: "",
  phone: "",
  email: "",
  isActive: true,
};

export default function OpcosPage() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<OpcoFormData>(defaultFormData);

  const utils = trpc.useUtils();
  const { data: opcos, isLoading } = trpc.admin.getOpcos.useQuery({ includeInactive: true });
  const createMutation = trpc.admin.createOpco.useMutation({
    onSuccess: () => {
      utils.admin.getOpcos.invalidate();
      closeDialog();
    },
  });
  const updateMutation = trpc.admin.updateOpco.useMutation({
    onSuccess: () => {
      utils.admin.getOpcos.invalidate();
      closeDialog();
    },
  });
  const deleteMutation = trpc.admin.deleteOpco.useMutation({
    onSuccess: () => {
      utils.admin.getOpcos.invalidate();
    },
  });

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (opco: typeof opcos extends (infer T)[] | undefined ? T : never) => {
    if (!opco) return;
    setFormData({
      name: opco.name,
      code: opco.code,
      timezone: opco.timezone,
      address: opco.address || "",
      phone: opco.phone || "",
      email: opco.email || "",
      isActive: opco.isActive,
    });
    setEditingId(opco.id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this operating company?")) {
      deleteMutation.mutate({ id });
    }
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
              <Building2 className="h-8 w-8 text-primary" />
              Operating Companies
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your operating companies (OpCos)
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add OpCo
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Operating Companies</CardTitle>
          <CardDescription>{opcos?.length || 0} companies configured</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : opcos && opcos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Timezone</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opcos.map((opco) => (
                  <TableRow key={opco.id}>
                    <TableCell className="font-medium">{opco.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{opco.code}</Badge>
                    </TableCell>
                    <TableCell>{opco.timezone}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {opco.phone && <div>{opco.phone}</div>}
                        {opco.email && <div className="text-muted-foreground">{opco.email}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={opco.isActive ? "default" : "secondary"}>
                        {opco.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(opco)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(opco.id)}
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
              No operating companies configured. Click "Add OpCo" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Operating Company</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the operating company details"
                : "Create a new operating company"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Sahrawi Transportation"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="SAHRAWI"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                placeholder="America/New_York"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="123 Main St, City, State"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@company.com"
                />
              </div>
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
              disabled={!formData.name || !formData.code || createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
