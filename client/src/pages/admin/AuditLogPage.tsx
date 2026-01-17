/**
 * OC-ADMIN-0: Audit Log Page
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  History,
  ArrowLeft,
  Search,
  Eye,
  Filter,
} from "lucide-react";
import { trpc } from "@/lib/trpc";

const ENTITIES = [
  { value: "", label: "All Entities" },
  { value: "opcos", label: "Operating Companies" },
  { value: "brokers", label: "Brokers" },
  { value: "broker_accounts", label: "Broker Accounts" },
  { value: "billing_rate_cards", label: "Rate Cards" },
  { value: "billing_rate_rules", label: "Rate Rules" },
  { value: "driver_pay_defaults", label: "Pay Defaults" },
  { value: "driver_pay_contracts", label: "Pay Contracts" },
];

const ACTIONS = [
  { value: "", label: "All Actions" },
  { value: "CREATE", label: "Create" },
  { value: "UPDATE", label: "Update" },
  { value: "DELETE", label: "Delete" },
  { value: "ARCHIVE", label: "Archive" },
  { value: "RESTORE", label: "Restore" },
];

// AuditLogEntry type for selected entry state
interface AuditLogEntry {
  id: number | string;
  entity: string;
  entityId?: string | number;
  action: string;
  actor: string;
  timestamp: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  beforeJson?: Record<string, unknown>;
  afterJson?: Record<string, unknown>;
}

export default function AuditLogPage() {
  const [, setLocation] = useLocation();
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | undefined>(undefined);
  const [filters, setFilters] = useState({
    entity: "",
    action: "",
    actor: "",
    fromDate: "",
    toDate: "",
  });

  const { data: auditLog, isLoading } = trpc.admin.getAuditLog.useQuery({
    entity: filters.entity || undefined,
    action: (filters.action as "CREATE" | "UPDATE" | "DELETE" | "ARCHIVE" | "RESTORE") || undefined,
    actor: filters.actor || undefined,
    fromDate: filters.fromDate || undefined,
    toDate: filters.toDate || undefined,
    limit: 100,
  });

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "CREATE":
        return "default";
      case "UPDATE":
        return "secondary";
      case "DELETE":
        return "destructive";
      case "ARCHIVE":
        return "outline";
      case "RESTORE":
        return "default";
      default:
        return "secondary";
    }
  };

  const formatJson = (json: Record<string, unknown> | undefined) => {
    if (!json) return "N/A";
    return JSON.stringify(json, null, 2);
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
              <History className="h-8 w-8 text-primary" />
              Audit Log
            </h1>
            <p className="text-muted-foreground mt-1">
              View all changes made to admin settings
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="space-y-2">
              <Label>Entity</Label>
              <Select
                value={filters.entity}
                onValueChange={(value) => setFilters({ ...filters, entity: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All entities" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITIES.map((entity) => (
                    <SelectItem key={entity.value} value={entity.value}>
                      {entity.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select
                value={filters.action}
                onValueChange={(value) => setFilters({ ...filters, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  {ACTIONS.map((action) => (
                    <SelectItem key={action.value} value={action.value}>
                      {action.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Actor</Label>
              <Input
                placeholder="Search by actor..."
                value={filters.actor}
                onChange={(e) => setFilters({ ...filters, actor: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters({ ...filters, toDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Log</CardTitle>
          <CardDescription>
            {auditLog?.length || 0} entries found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : auditLog && auditLog.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLog.map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm">
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getActionBadgeVariant(entry.action)}>
                        {entry.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-sm">
                        {ENTITIES.find((e) => e.value === entry.entity)?.label || entry.entity}
                      </span>
                    </TableCell>
                    <TableCell>
                      {entry.entityId ? (
                        <Badge variant="outline">#{entry.entityId}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{entry.actor}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedEntry(entry as AuditLogEntry)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No audit log entries found matching the filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedEntry} onOpenChange={() => setSelectedEntry(undefined)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              {selectedEntry && (
                <span>
                  {selectedEntry.action} on {selectedEntry.entity}
                  {selectedEntry.entityId && ` #${selectedEntry.entityId}`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedEntry && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Timestamp</Label>
                  <p className="font-medium">
                    {new Date(selectedEntry.timestamp).toLocaleString()}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Actor</Label>
                  <p className="font-medium">{selectedEntry.actor}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Action</Label>
                  <Badge variant={getActionBadgeVariant(selectedEntry.action)}>
                    {selectedEntry.action}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entity</Label>
                  <p className="font-medium">
                    {selectedEntry.entity}
                    {selectedEntry.entityId && ` #${selectedEntry.entityId}`}
                  </p>
                </div>
              </div>

              {selectedEntry.beforeJson && (
                <div>
                  <Label className="text-muted-foreground">Before</Label>
                  <pre className="mt-1 p-3 bg-red-50 rounded-lg text-sm overflow-x-auto">
                    {formatJson(selectedEntry.beforeJson)}
                  </pre>
                </div>
              )}

              {selectedEntry.afterJson && (
                <div>
                  <Label className="text-muted-foreground">After</Label>
                  <pre className="mt-1 p-3 bg-green-50 rounded-lg text-sm overflow-x-auto">
                    {formatJson(selectedEntry.afterJson)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
