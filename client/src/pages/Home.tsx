import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Car, AlertTriangle, CheckCircle, Plus, List, Upload, Users, UserCheck } from "lucide-react";
import { useLocation } from "wouter";

export default function Home() {
  const [, setLocation] = useLocation();
  const { data: vehicleStats, isLoading: vehicleLoading } = trpc.vehicles.stats.useQuery();
  const { data: driverStats, isLoading: driverLoading } = trpc.drivers.stats.useQuery();

  const isLoading = vehicleLoading || driverLoading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your vehicle fleet and drivers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setLocation("/vehicles")}>
            <List className="mr-2 h-4 w-4" />
            Vehicles
          </Button>
          <Button variant="outline" onClick={() => setLocation("/drivers")}>
            <Users className="mr-2 h-4 w-4" />
            Drivers
          </Button>
          <Button onClick={() => setLocation("/vehicles/new")}>
            <Plus className="mr-2 h-4 w-4" />
            Add Vehicle
          </Button>
        </div>
      </div>

      {/* Vehicle Stats Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Vehicles</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              <Car className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{vehicleStats?.total || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Vehicles in your fleet
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Vehicles</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{vehicleStats?.active || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Currently operational
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-amber-500">{vehicleStats?.expiringSoon || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Registration or inspection expiring in 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Driver Stats Cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Drivers</h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold">{driverStats?.total || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Registered drivers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
              <UserCheck className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-green-600">{driverStats?.active || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Assigned</CardTitle>
              <Car className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-blue-600">{driverStats?.assigned || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                With assigned vehicle
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">License Expiring</CardTitle>
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold text-amber-500">{driverStats?.licenseExpiring || 0}</div>
              )}
              <p className="text-xs text-muted-foreground">
                Within 30 days
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks for managing your fleet
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => setLocation("/vehicles/new")}
          >
            <Plus className="h-6 w-6" />
            <span>Add Vehicle</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => setLocation("/drivers/new")}
          >
            <Users className="h-6 w-6" />
            <span>Add Driver</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => setLocation("/import")}
          >
            <Upload className="h-6 w-6" />
            <span>Import Data</span>
          </Button>
          <Button
            variant="outline"
            className="h-24 flex-col gap-2"
            onClick={() => setLocation("/vehicles")}
          >
            <List className="h-6 w-6" />
            <span>Browse Fleet</span>
          </Button>
        </CardContent>
      </Card>

      {/* Getting Started Guide */}
      {vehicleStats?.total === 0 && driverStats?.total === 0 && !isLoading && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Your fleet is empty. Here's how to get started:
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-primary">1</span>
              </div>
              <div>
                <h4 className="font-medium">Add vehicles and drivers</h4>
                <p className="text-sm text-muted-foreground">
                  Click "Add Vehicle" or "Add Driver" to enter information one by one.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-primary">2</span>
              </div>
              <div>
                <h4 className="font-medium">Import from Google Sheets</h4>
                <p className="text-sm text-muted-foreground">
                  Have existing data? Use the import feature to bulk add vehicles and drivers from a spreadsheet.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <span className="text-sm font-medium text-primary">3</span>
              </div>
              <div>
                <h4 className="font-medium">Assign drivers to vehicles</h4>
                <p className="text-sm text-muted-foreground">
                  Link drivers to their assigned vehicles and track maintenance history.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
