import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  Search,
  Users,
  Car,
  AlertTriangle,
  UserCheck,
} from "lucide-react";

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-800 border-green-200",
  inactive: "bg-gray-100 text-gray-800 border-gray-200",
  on_leave: "bg-yellow-100 text-yellow-800 border-yellow-200",
  terminated: "bg-red-100 text-red-800 border-red-200",
};

const statusLabels: Record<string, string> = {
  active: "Active",
  inactive: "Inactive",
  on_leave: "On Leave",
  terminated: "Terminated",
};

export default function DriverList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [vehicleFilter, setVehicleFilter] = useState<string>("all");

  const { data: drivers, isLoading } = trpc.drivers.list.useQuery({
    search: search || undefined,
    status:
      statusFilter !== "all"
        ? (statusFilter as "active" | "inactive" | "on_leave" | "terminated")
        : undefined,
    city: cityFilter !== "all" ? cityFilter : undefined,
    hasVehicle:
      vehicleFilter === "assigned"
        ? true
        : vehicleFilter === "unassigned"
          ? false
          : undefined,
  });

  const { data: stats } = trpc.drivers.stats.useQuery();
  const { data: filterOptions } = trpc.vehicles.filterOptions.useQuery();

  const cities = useMemo(() => filterOptions?.cities || [], [filterOptions]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Drivers</h1>
            <p className="text-muted-foreground">
              Manage your fleet drivers and vehicle assignments
            </p>
          </div>
          <Button onClick={() => setLocation("/drivers/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Driver
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Drivers
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.total ?? <Skeleton className="h-8 w-16" />}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats?.active ?? <Skeleton className="h-8 w-16" />}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Assigned to Vehicle
              </CardTitle>
              <Car className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {stats?.assigned ?? <Skeleton className="h-8 w-16" />}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                License Expiring
              </CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600">
                {stats?.licenseExpiring ?? <Skeleton className="h-8 w-16" />}
              </div>
              <p className="text-xs text-muted-foreground">Within 30 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, email, or license..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                  <SelectItem value="terminated">Terminated</SelectItem>
                </SelectContent>
              </Select>
              <Select value={cityFilter} onValueChange={setCityFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={vehicleFilter} onValueChange={setVehicleFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Vehicle Assignment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Drivers</SelectItem>
                  <SelectItem value="assigned">With Vehicle</SelectItem>
                  <SelectItem value="unassigned">Without Vehicle</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Drivers Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>License #</TableHead>
                  <TableHead>License Exp</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Vehicle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : drivers && drivers.length > 0 ? (
                  drivers.map(driver => (
                    <TableRow
                      key={driver.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setLocation(`/drivers/${driver.id}`)}
                    >
                      <TableCell className="font-medium">
                        {driver.firstName} {driver.lastName}
                      </TableCell>
                      <TableCell>{driver.phone || "-"}</TableCell>
                      <TableCell>{driver.city || "-"}</TableCell>
                      <TableCell>{driver.licenseNumber || "-"}</TableCell>
                      <TableCell>
                        {driver.licenseExpiration ? (
                          <LicenseExpirationBadge
                            date={new Date(driver.licenseExpiration)}
                          />
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusColors[driver.status] || ""}
                        >
                          {statusLabels[driver.status] || driver.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {driver.assignedVehicleId ? (
                          <Badge variant="secondary">Assigned</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          No drivers found
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation("/drivers/new")}
                        >
                          Add your first driver
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

function LicenseExpirationBadge({ date }: { date: Date }) {
  const today = new Date();
  const daysUntilExpiration = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let colorClass = "bg-green-100 text-green-800 border-green-200";
  if (daysUntilExpiration < 0) {
    colorClass = "bg-red-100 text-red-800 border-red-200";
  } else if (daysUntilExpiration <= 30) {
    colorClass = "bg-amber-100 text-amber-800 border-amber-200";
  } else if (daysUntilExpiration <= 60) {
    colorClass = "bg-yellow-100 text-yellow-800 border-yellow-200";
  }

  return (
    <Badge variant="outline" className={colorClass}>
      {date.toLocaleDateString()}
    </Badge>
  );
}
