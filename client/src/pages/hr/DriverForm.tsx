import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Save, User } from "lucide-react";
import { useForm } from "react-hook-form";

interface DriverFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  licenseNumber: string;
  licenseExpiration: string;
  licenseState: string;
  city: string;
  status: "active" | "inactive" | "on_leave" | "terminated";
  hireDate: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  notes: string;
}

export default function DriverForm() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isEdit = params.id && params.id !== "new";
  const driverId = isEdit ? parseInt(params.id) : 0;

  const { data: driver, isLoading } = trpc.drivers.getById.useQuery(
    { id: driverId },
    { enabled: Boolean(isEdit) && driverId > 0 }
  );

  const { data: filterOptions } = trpc.vehicles.filterOptions.useQuery();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      email: "",
      licenseNumber: "",
      licenseExpiration: "",
      licenseState: "",
      city: "",
      status: "active",
      hireDate: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      notes: "",
    },
  });

  const utils = trpc.useUtils();

  const createMutation = trpc.drivers.create.useMutation({
    onSuccess: (result) => {
      toast.success("Driver created successfully");
      setLocation(`/drivers/${result.id}`);
    },
    onError: (error) => {
      toast.error(`Failed to create driver: ${error.message}`);
    },
  });

  const updateMutation = trpc.drivers.update.useMutation({
    onSuccess: () => {
      toast.success("Driver updated successfully");
      utils.drivers.getById.invalidate({ id: driverId });
      setLocation(`/drivers/${driverId}`);
    },
    onError: (error) => {
      toast.error(`Failed to update driver: ${error.message}`);
    },
  });

  useEffect(() => {
    if (driver) {
      reset({
        firstName: driver.firstName || "",
        lastName: driver.lastName || "",
        phone: driver.phone || "",
        email: driver.email || "",
        licenseNumber: driver.licenseNumber || "",
        licenseExpiration: driver.licenseExpiration
          ? new Date(driver.licenseExpiration).toISOString().split("T")[0]
          : "",
        licenseState: driver.licenseState || "",
        city: driver.city || "",
        status: driver.status,
        hireDate: driver.hireDate
          ? new Date(driver.hireDate).toISOString().split("T")[0]
          : "",
        emergencyContactName: driver.emergencyContactName || "",
        emergencyContactPhone: driver.emergencyContactPhone || "",
        notes: driver.notes || "",
      });
    }
  }, [driver, reset]);

  const onSubmit = (data: DriverFormData) => {
    const submitData = {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      email: data.email || null,
      licenseNumber: data.licenseNumber || null,
      licenseExpiration: data.licenseExpiration || null,
      licenseState: data.licenseState || null,
      city: data.city || null,
      status: data.status,
      hireDate: data.hireDate || null,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      notes: data.notes || null,
    };

    if (isEdit) {
      updateMutation.mutate({ id: driverId, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  if (isEdit && isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-96 w-full" />
        </div>
      </DashboardLayout>
    );
  }

  if (isEdit && !driver) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Driver Not Found</h2>
          <p className="text-muted-foreground mb-4">
            The driver you're trying to edit doesn't exist.
          </p>
          <Button onClick={() => setLocation("/drivers")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Drivers
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const cities = filterOptions?.cities || [];

  return (
    <DashboardLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setLocation(isEdit ? `/drivers/${driverId}` : "/drivers")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? "Edit Driver" : "Add New Driver"}
            </h1>
            <p className="text-muted-foreground">
              {isEdit
                ? `Update information for ${driver?.firstName} ${driver?.lastName}`
                : "Enter the driver's information"}
            </p>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : "Save Driver"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Driver's name and contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    {...register("firstName", { required: "First name is required" })}
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="text-sm text-destructive">{errors.firstName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    {...register("lastName", { required: "Last name is required" })}
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="text-sm text-destructive">{errors.lastName.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  {...register("phone")}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  {...register("email")}
                  placeholder="john.doe@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Select
                  value={watch("city") || ""}
                  onValueChange={(value) => setValue("city", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* License Information */}
          <Card>
            <CardHeader>
              <CardTitle>License Information</CardTitle>
              <CardDescription>Driver's license details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  {...register("licenseNumber")}
                  placeholder="DL12345678"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="licenseState">License State</Label>
                  <Input
                    id="licenseState"
                    {...register("licenseState")}
                    placeholder="VA"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="licenseExpiration">License Expiration</Label>
                  <Input
                    id="licenseExpiration"
                    type="date"
                    {...register("licenseExpiration")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Employment</CardTitle>
              <CardDescription>Employment status and dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={watch("status")}
                  onValueChange={(value) =>
                    setValue("status", value as "active" | "inactive" | "on_leave" | "terminated")
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="on_leave">On Leave</SelectItem>
                    <SelectItem value="terminated">Terminated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  {...register("hireDate")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Emergency Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
              <CardDescription>Contact in case of emergency</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Contact Name</Label>
                <Input
                  id="emergencyContactName"
                  {...register("emergencyContactName")}
                  placeholder="Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactPhone">Contact Phone</Label>
                <Input
                  id="emergencyContactPhone"
                  {...register("emergencyContactPhone")}
                  placeholder="(555) 987-6543"
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Notes</CardTitle>
              <CardDescription>Additional information about the driver</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                {...register("notes")}
                placeholder="Enter any additional notes..."
                rows={4}
              />
            </CardContent>
          </Card>
        </div>
      </form>
    </DashboardLayout>
  );
}
