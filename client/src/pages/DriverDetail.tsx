import { useState } from "react";
import { useLocation, useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
import { toast } from "sonner";
import {
  ArrowLeft,
  Edit,
  Trash2,
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  Calendar,
  Car,
  History,
  AlertTriangle,
  UserCog,
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

export default function DriverDetail() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const driverId = parseInt(params.id || "0");
  const [activeTab, setActiveTab] = useState<"details" | "vehicle" | "history">(
    "details"
  );

  const { data: driver, isLoading } = trpc.drivers.getById.useQuery(
    { id: driverId },
    { enabled: driverId > 0 }
  );

  const { data: vehicles } = trpc.vehicles.list.useQuery({
    isActive: "active",
  });
  const { data: vehicleHistory } = trpc.drivers.vehicleHistory.useQuery(
    { driverId },
    { enabled: driverId > 0 }
  );

  const utils = trpc.useUtils();

  const deleteMutation = trpc.drivers.delete.useMutation({
    onSuccess: () => {
      toast.success("Driver deleted successfully");
      setLocation("/drivers");
    },
    onError: error => {
      toast.error(`Failed to delete driver: ${error.message}`);
    },
  });

  const assignVehicleMutation = trpc.drivers.assignVehicle.useMutation({
    onSuccess: () => {
      toast.success("Vehicle assignment updated");
      utils.drivers.getById.invalidate({ id: driverId });
      utils.drivers.vehicleHistory.invalidate({ driverId });
    },
    onError: error => {
      toast.error(`Failed to assign vehicle: ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (!driver) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Driver Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The driver you're looking for doesn't exist.
          </p>
          <Button onClick={() => setLocation("/drivers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Drivers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const assignedVehicle = vehicles?.find(
    v => v.id === driver.assignedVehicleId
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/drivers")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold tracking-tight">
                  {driver.firstName} {driver.lastName}
                </h1>
                <Badge
                  variant="outline"
                  className={statusColors[driver.status] || ""}
                >
                  {statusLabels[driver.status] || driver.status}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                {driver.city ? `${driver.city} • ` : ""}
                Driver ID: {driver.id}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setLocation(`/drivers/${driver.id}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Driver</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete {driver.firstName}{" "}
                    {driver.lastName}? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => deleteMutation.mutate({ id: driver.id })}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Custom Tabs */}
        <div className="border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab("details")}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "details"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="inline-block mr-2 h-4 w-4" />
              Details
            </button>
            <button
              onClick={() => setActiveTab("vehicle")}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "vehicle"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Car className="inline-block mr-2 h-4 w-4" />
              Vehicle Assignment
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "history"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <History className="inline-block mr-2 h-4 w-4" />
              Vehicle History
            </button>
          </div>
        </div>

        {/* Details Tab */}
        {activeTab === "details" && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Contact Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCog className="h-5 w-5" />
                  Contact Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{driver.phone || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{driver.email || "-"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">City</p>
                    <p className="font-medium">{driver.city || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* License Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  License Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    License Number
                  </p>
                  <p className="font-medium">{driver.licenseNumber || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">License State</p>
                  <p className="font-medium">{driver.licenseState || "-"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    License Expiration
                  </p>
                  {driver.licenseExpiration ? (
                    <LicenseExpirationDisplay
                      date={new Date(driver.licenseExpiration)}
                    />
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Employment Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Employment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Hire Date</p>
                  <p className="font-medium">
                    {driver.hireDate
                      ? new Date(driver.hireDate).toLocaleDateString()
                      : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge
                    variant="outline"
                    className={statusColors[driver.status] || ""}
                  >
                    {statusLabels[driver.status] || driver.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">
                    {driver.emergencyContactName || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium">
                    {driver.emergencyContactPhone || "-"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            {driver.notes && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{driver.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Vehicle Assignment Tab */}
        {activeTab === "vehicle" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Car className="h-5 w-5" />
                Current Vehicle Assignment
              </CardTitle>
              <CardDescription>
                Assign or change the vehicle for this driver
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {assignedVehicle ? (
                <div className="p-4 border rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        {assignedVehicle.vehicleNumber} -{" "}
                        {assignedVehicle.tagNumber}
                      </p>
                      <p className="text-muted-foreground">
                        {assignedVehicle.year} {assignedVehicle.make}{" "}
                        {assignedVehicle.model}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() =>
                        setLocation(`/vehicles/${assignedVehicle.id}`)
                      }
                    >
                      View Vehicle
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4 border rounded-lg border-dashed text-center">
                  <Car className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No vehicle assigned</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">Change Assignment</label>
                <Select
                  value={driver.assignedVehicleId?.toString() || "none"}
                  onValueChange={value => {
                    assignVehicleMutation.mutate({
                      driverId: driver.id,
                      vehicleId: value === "none" ? null : parseInt(value),
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a vehicle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Vehicle</SelectItem>
                    {vehicles?.map(vehicle => (
                      <SelectItem
                        key={vehicle.id}
                        value={vehicle.id.toString()}
                      >
                        {vehicle.vehicleNumber} - {vehicle.tagNumber} (
                        {vehicle.make} {vehicle.model})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vehicle History Tab */}
        {activeTab === "history" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Vehicle Assignment History
              </CardTitle>
              <CardDescription>
                Past vehicles assigned to this driver
              </CardDescription>
            </CardHeader>
            <CardContent>
              {vehicleHistory && vehicleHistory.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Make/Model</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Unassigned Date</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vehicleHistory.map(record => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {record.vehicleNumber} - {record.tagNumber}
                        </TableCell>
                        <TableCell>
                          {record.year} {record.make} {record.model}
                        </TableCell>
                        <TableCell>
                          {record.assignedDate
                            ? new Date(record.assignedDate).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {record.unassignedDate ? (
                            new Date(record.unassignedDate).toLocaleDateString()
                          ) : (
                            <Badge variant="secondary">Current</Badge>
                          )}
                        </TableCell>
                        <TableCell>{record.notes || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8">
                  <History className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">
                    No vehicle history found
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function LicenseExpirationDisplay({ date }: { date: Date }) {
  const today = new Date();
  const daysUntilExpiration = Math.ceil(
    (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let colorClass = "text-green-600";
  let message = "";
  if (daysUntilExpiration < 0) {
    colorClass = "text-red-600";
    message = ` (Expired ${Math.abs(daysUntilExpiration)} days ago)`;
  } else if (daysUntilExpiration <= 30) {
    colorClass = "text-amber-600";
    message = ` (Expires in ${daysUntilExpiration} days)`;
  } else if (daysUntilExpiration <= 60) {
    colorClass = "text-yellow-600";
    message = ` (Expires in ${daysUntilExpiration} days)`;
  }

  return (
    <p className={`font-medium ${colorClass}`}>
      {date.toLocaleDateString()}
      {message && <span className="text-sm">{message}</span>}
    </p>
  );
}
