/**
 * OC-ADMIN-0: Users & Roles Management
 * 
 * Role assignment with RBAC enforcement
 * Roles: ADMIN, PAYROLL, DISPATCH, BILLING, RECEPTION, MECHANIC, OPS_DIRECTOR
 */

import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  UserCog,
  Plus,
  Edit,
  ArrowLeft,
  Shield,
  Search,
  Check,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

// Role definitions with permissions
const ROLES = [
  {
    value: "ADMIN",
    label: "Administrator",
    description: "Full access to all admin settings",
    permissions: ["view_all", "edit_all", "delete_all"],
    color: "bg-red-100 text-red-800",
  },
  {
    value: "OPS_DIRECTOR",
    label: "Operations Director",
    description: "View all, edit operations settings",
    permissions: ["view_all", "edit_operations"],
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "PAYROLL",
    label: "Payroll",
    description: "View rates/contracts, cannot edit",
    permissions: ["view_rates", "view_contracts", "edit_payroll"],
    color: "bg-green-100 text-green-800",
  },
  {
    value: "BILLING",
    label: "Billing",
    description: "View and edit billing rate cards",
    permissions: ["view_rates", "edit_rates"],
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "DISPATCH",
    label: "Dispatch",
    description: "View driver info, manage trips",
    permissions: ["view_drivers", "edit_trips"],
    color: "bg-amber-100 text-amber-800",
  },
  {
    value: "RECEPTION",
    label: "Reception",
    description: "View basic info, manage calls",
    permissions: ["view_basic", "edit_calls"],
    color: "bg-cyan-100 text-cyan-800",
  },
  {
    value: "MECHANIC",
    label: "Mechanic",
    description: "View and edit vehicle repairs",
    permissions: ["view_vehicles", "edit_repairs"],
    color: "bg-orange-100 text-orange-800",
  },
];

// Permission matrix
const PERMISSION_MATRIX = {
  view_rates: ["ADMIN", "OPS_DIRECTOR", "PAYROLL", "BILLING"],
  edit_rates: ["ADMIN", "BILLING"],
  view_contracts: ["ADMIN", "OPS_DIRECTOR", "PAYROLL"],
  edit_contracts: ["ADMIN"],
  view_drivers: ["ADMIN", "OPS_DIRECTOR", "DISPATCH", "PAYROLL"],
  edit_drivers: ["ADMIN", "OPS_DIRECTOR"],
  view_all: ["ADMIN", "OPS_DIRECTOR"],
  edit_all: ["ADMIN"],
};

interface UserFormData {
  email: string;
  name: string;
  role: string;
  opcoId: number | null;
  isActive: boolean;
}

const defaultFormData: UserFormData = {
  email: "",
  name: "",
  role: "RECEPTION",
  opcoId: null,
  isActive: true,
};

export default function UsersPage() {
  const [, setLocation] = useLocation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<UserFormData>(defaultFormData);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: opcos } = trpc.admin.getOpcos.useQuery();
  
  // Mock users data (in real app, this would come from auth system)
  const mockUsers = [
    { id: 1, email: "admin@orangecab.com", name: "System Admin", role: "ADMIN", opcoId: null, isActive: true },
    { id: 2, email: "ops@sahrawi.com", name: "Operations Director", role: "OPS_DIRECTOR", opcoId: 1, isActive: true },
    { id: 3, email: "payroll@orangecab.com", name: "Payroll Manager", role: "PAYROLL", opcoId: null, isActive: true },
    { id: 4, email: "billing@orangecab.com", name: "Billing Specialist", role: "BILLING", opcoId: null, isActive: true },
    { id: 5, email: "dispatch@sahrawi.com", name: "Dispatcher", role: "DISPATCH", opcoId: 1, isActive: true },
    { id: 6, email: "dispatch@metrix.com", name: "Dispatcher", role: "DISPATCH", opcoId: 2, isActive: true },
  ];

  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const openCreateDialog = () => {
    setFormData(defaultFormData);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: typeof mockUsers[number]) => {
    setFormData({
      email: user.email,
      name: user.name,
      role: user.role,
      opcoId: user.opcoId,
      isActive: user.isActive,
    });
    setEditingId(user.id);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingId(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = () => {
    // In real app, this would call an API
    console.log("Saving user:", formData);
    closeDialog();
  };

  const getRoleBadge = (role: string) => {
    const roleInfo = ROLES.find((r) => r.value === role);
    return roleInfo ? (
      <Badge className={roleInfo.color}>{roleInfo.label}</Badge>
    ) : (
      <Badge variant="secondary">{role}</Badge>
    );
  };

  const getOpcoName = (opcoId: number | null) => {
    if (!opcoId) return "All OpCos";
    return opcos?.find((o) => o.id === opcoId)?.name || `OpCo #${opcoId}`;
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
              <UserCog className="h-8 w-8 text-primary" />
              Users & Roles
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage user role assignments and permissions
            </p>
          </div>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Role Permissions Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Permissions
          </CardTitle>
          <CardDescription>
            What each role can view and edit in the Admin Hub
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>View Rates</TableHead>
                <TableHead>Edit Rates</TableHead>
                <TableHead>View Contracts</TableHead>
                <TableHead>Edit Contracts</TableHead>
                <TableHead>View All</TableHead>
                <TableHead>Edit All</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROLES.map((role) => (
                <TableRow key={role.value}>
                  <TableCell>
                    <Badge className={role.color}>{role.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {PERMISSION_MATRIX.view_rates.includes(role.value) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300" />
                    )}
                  </TableCell>
                  <TableCell>
                    {PERMISSION_MATRIX.edit_rates.includes(role.value) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300" />
                    )}
                  </TableCell>
                  <TableCell>
                    {PERMISSION_MATRIX.view_contracts.includes(role.value) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300" />
                    )}
                  </TableCell>
                  <TableCell>
                    {PERMISSION_MATRIX.edit_contracts.includes(role.value) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300" />
                    )}
                  </TableCell>
                  <TableCell>
                    {PERMISSION_MATRIX.view_all.includes(role.value) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300" />
                    )}
                  </TableCell>
                  <TableCell>
                    {PERMISSION_MATRIX.edit_all.includes(role.value) ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <X className="h-4 w-4 text-slate-300" />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Users</CardTitle>
              <CardDescription>{filteredUsers.length} users configured</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>OpCo Scope</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {getOpcoName(user.opcoId)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "secondary"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit" : "Add"} User</DialogTitle>
            <DialogDescription>
              {editingId ? "Update user role assignment" : "Assign a role to a new user"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@orangecab.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((role) => (
                    <SelectItem key={role.value} value={role.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${role.color} text-xs`}>{role.label}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {role.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>OpCo Scope</Label>
              <Select
                value={formData.opcoId?.toString() || "all"}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    opcoId: value === "all" ? null : parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All OpCos" />
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
              <p className="text-xs text-muted-foreground">
                Limit user access to a specific operating company
              </p>
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
              disabled={!formData.name || !formData.email || !formData.role}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
