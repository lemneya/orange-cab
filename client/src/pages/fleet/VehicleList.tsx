import { trpc } from "@/lib/trpc";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Car, Plus, Search, Filter, Accessibility, AlertTriangle } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";

export default function VehicleList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const { data: vehicles, isLoading } = trpc.vehicles.list.useQuery({
    search: search || undefined,
    isActive: statusFilter === "all" ? undefined : statusFilter as "active" | "inactive",
  });

  const { data: filterOptions } = trpc.vehicles.filterOptions.useQuery();

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Active" },
      lot: { variant: "secondary", label: "In Lot" },
      repair: { variant: "destructive", label: "In Repair" },
      retiring: { variant: "outline", label: "Retiring" },
      retired: { variant: "outline", label: "Retired" },
    };
    const config = statusConfig[status] || { variant: "secondary", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const isExpiringSoon = (dateStr: string | Date | null) => {
    if (!dateStr) return false;
    const date = dateStr instanceof Date ? dateStr : new Date(dateStr);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return date <= thirtyDaysFromNow;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Fleet Vehicles</h1>
          <p className="text-muted-foreground">
            Manage your fleet of {vehicles?.length || 0} vehicles
          </p>
        </div>
        <Button onClick={() => setLocation("/fleet/vehicles/new")} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
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
                  placeholder="Search by vehicle #, tag, VIN..."
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
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Vehicle Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sedan">Sedan</SelectItem>
                <SelectItem value="minivan">Minivan</SelectItem>
                <SelectItem value="wheelchair">Wheelchair</SelectItem>
                <SelectItem value="stretcher">Stretcher</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Vehicle Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vehicle #</TableHead>
                  <TableHead>Tag #</TableHead>
                  <TableHead>Make / Model</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Registration</TableHead>
                  <TableHead>Inspection</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vehicles?.map((vehicle) => (
                  <TableRow 
                    key={vehicle.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setLocation(`/fleet/vehicles/${vehicle.id}`)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {vehicle.vehicleNumber}
                        {vehicle.isActive === "inactive" && (
                          <Badge variant="outline" className="text-xs">Inactive</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{vehicle.tagNumber}</TableCell>
                    <TableCell>
                      {vehicle.make} {vehicle.model}
                    </TableCell>
                    <TableCell>{vehicle.year}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {vehicle.model?.toLowerCase().includes('wheelchair') && (
                          <Accessibility className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="capitalize">{vehicle.model?.toLowerCase().includes('wheelchair') ? 'Wheelchair' : 'Standard'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(vehicle.isActive)}</TableCell>
                    <TableCell>{vehicle.city || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {vehicle.registrationExp && isExpiringSoon(vehicle.registrationExp) && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        {vehicle.registrationExp ? new Date(vehicle.registrationExp).toLocaleDateString() : '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {vehicle.stateInspectionExp && isExpiringSoon(vehicle.stateInspectionExp) && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                        {vehicle.stateInspectionExp ? new Date(vehicle.stateInspectionExp).toLocaleDateString() : '-'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(`/fleet/vehicles/${vehicle.id}/edit`);
                        }}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {vehicles?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="h-24 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Car className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No vehicles found</p>
                        <Button variant="outline" size="sm" onClick={() => setLocation("/fleet/vehicles/new")}>
                          Add your first vehicle
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
