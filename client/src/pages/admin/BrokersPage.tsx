/**
 * OC-ADMIN-0: Brokers Management
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
  Briefcase,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Globe,
  Mail,
  Phone,
  User,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface BrokerFormData {
  name: string;
  code: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  website: string;
  notes: string;
  isActive: boolean;
}

const defaultFormData: BrokerFormData = {
  name: "",
  code: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  website: "",
  notes: "",
  isActive: true,
};

export default function BrokersPage() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<BrokerFormData>(defaultFormData);

  const utils = trpc.useUtils();
  const { data: brokers, isLoading } = trpc.admin.getBrokers.useQuery({ includeInactive: true });
  const createMutation = trpc.admin.createBroker.useMutation({
    onSuccess: () => {
      utils.admin.getBrokers.invalidate();
      closeDialog();
    },
  });
  const updateMutation = trpc.admin.updateBroker.useMutation({
    onSuccess: () => {
      utils.admin.getBrokers.invalidate();
      closeDialog();
    },
  });
  const deleteMutation = trpc.admin.deleteBroker.useMutation({
    onSuccess: () => {
      utils.admin.getBrokers.invalidate();
    },
  });

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (broker: typeof brokers extends (infer T)[] | undefined ? T : never) => {
    if (!broker) return;
    setFormData({
      name: broker.name,
      code: broker.code,
      contactName: broker.contactName || "",
      contactEmail: broker.contactEmail || "",
      contactPhone: broker.contactPhone || "",
      website: broker.website || "",
      notes: broker.notes || "",
      isActive: broker.isActive,
    });
    setEditingId(broker.id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    const data = {
      ...formData,
      contactName: formData.contactName || undefined,
      contactEmail: formData.contactEmail || undefined,
      contactPhone: formData.contactPhone || undefined,
      website: formData.website || undefined,
      notes: formData.notes || undefined,
    };
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this broker?")) {
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
              <Briefcase className="h-8 w-8 text-primary" />
              Brokers
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage funding source brokers (Modivcare, MTM, Access2Care, etc.)
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Broker
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Brokers</CardTitle>
          <CardDescription>{brokers?.length || 0} brokers configured</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : brokers && brokers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Website</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brokers.map((broker) => (
                  <TableRow key={broker.id}>
                    <TableCell className="font-medium">{broker.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{broker.code}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {broker.contactName && (
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3 text-muted-foreground" />
                            {broker.contactName}
                          </div>
                        )}
                        {broker.contactEmail && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {broker.contactEmail}
                          </div>
                        )}
                        {broker.contactPhone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {broker.contactPhone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {broker.website && (
                        <a
                          href={broker.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          Website
                        </a>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={broker.isActive ? "default" : "secondary"}>
                        {broker.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(broker)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(broker.id)}
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
              No brokers configured. Click "Add Broker" to create one.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} Broker</DialogTitle>
            <DialogDescription>
              {editingId ? "Update the broker details" : "Create a new broker"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Modivcare"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="code">Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="MODIVCARE"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactName">Contact Name</Label>
              <Input
                id="contactName"
                value={formData.contactName}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                placeholder="John Smith"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  placeholder="contact@broker.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://www.broker.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this broker..."
                rows={3}
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
