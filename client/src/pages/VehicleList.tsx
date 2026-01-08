import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Search,
  X,
  Eye,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useLocation } from "wouter";

type ExpirationStatus = "valid" | "warning" | "expired";

function getExpirationStatus(
  dateStr: string | Date | null | undefined
): ExpirationStatus {
  if (!dateStr) return "valid";
  const date = new Date(dateStr);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (date < today) return "expired";
  if (date <= thirtyDaysFromNow) return "warning";
  return "valid";
}

function ExpirationBadge({
  date,
  label,
}: {
  date: string | Date | null | undefined;
  label: string;
}) {
  const status = getExpirationStatus(date);

  if (!date) {
    return (
      <Badge variant="outline" className="text-xs">
        No {label}
      </Badge>
    );
  }

  const formattedDate = new Date(date).toLocaleDateString();

  if (status === "expired") {
    return (
      <Badge variant="destructive" className="text-xs gap-1">
        <AlertCircle className="h-3 w-3" />
        {formattedDate}
      </Badge>
    );
  }

  if (status === "warning") {
    return (
      <Badge className="text-xs gap-1 bg-amber-500 hover:bg-amber-600">
        <AlertTriangle className="h-3 w-3" />
        {formattedDate}
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="text-xs gap-1">
      <CheckCircle className="h-3 w-3 text-green-600" />
      {formattedDate}
    </Badge>
  );
}

export default function VehicleList() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [cityFilter, setCityFilter] = useState<string>("");
  const [makeFilter, setMakeFilter] = useState<string>("");
  const [yearFilter, setYearFilter] = useState<string>("");

  const { data: filterOptions } = trpc.vehicles.filterOptions.useQuery();
  const { data: vehicles, isLoading } = trpc.vehicles.list.useQuery({
    search: search || undefined,
    city: cityFilter || undefined,
    make: makeFilter || undefined,
    year: yearFilter ? parseInt(yearFilter) : undefined,
  });

  const hasFilters = search || cityFilter || makeFilter || yearFilter;

  const clearFilters = () => {
    setSearch("");
    setCityFilter("");
    setMakeFilter("");
    setYearFilter("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vehicles</h1>
          <p className="text-muted-foreground">
            Manage and search your vehicle fleet
          </p>
        </div>
        <Button onClick={() => setLocation("/vehicles/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vehicle
        </Button>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by TAG#, VIN, make, model..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="City" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {filterOptions?.cities.map(city => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={makeFilter} onValueChange={setMakeFilter}>
              <SelectTrigger className="w-full md:w-36">
                <SelectValue placeholder="Make" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Makes</SelectItem>
                {filterOptions?.makes.map(make => (
                  <SelectItem key={make} value={make}>
                    {make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-full md:w-28">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Years</SelectItem>
                {filterOptions?.years.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            )}
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
          ) : vehicles && vehicles.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle #</TableHead>
                    <TableHead>TAG #</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Make / Model</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Registration</TableHead>
                    <TableHead>State Inspection</TableHead>
                    <TableHead>Insurance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.map(vehicle => (
                    <TableRow
                      key={vehicle.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setLocation(`/vehicles/${vehicle.id}`)}
                    >
                      <TableCell className="font-medium">
                        {vehicle.vehicleNumber}
                      </TableCell>
                      <TableCell>{vehicle.tagNumber}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{vehicle.city || "-"}</Badge>
                      </TableCell>
                      <TableCell>
                        {vehicle.make} {vehicle.model}
                      </TableCell>
                      <TableCell>{vehicle.year || "-"}</TableCell>
                      <TableCell>
                        <ExpirationBadge
                          date={vehicle.registrationExp}
                          label="Reg"
                        />
                      </TableCell>
                      <TableCell>
                        <ExpirationBadge
                          date={vehicle.stateInspectionExp}
                          label="Insp"
                        />
                      </TableCell>
                      <TableCell>{vehicle.insurance || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation();
                            setLocation(`/vehicles/${vehicle.id}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Search className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium">No vehicles found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {hasFilters
                  ? "Try adjusting your search or filters"
                  : "Add your first vehicle to get started"}
              </p>
              {!hasFilters && (
                <Button
                  className="mt-4"
                  onClick={() => setLocation("/vehicles/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Vehicle
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results count */}
      {vehicles && vehicles.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing {vehicles.length} vehicle{vehicles.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
