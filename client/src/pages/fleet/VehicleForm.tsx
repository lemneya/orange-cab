import { useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

interface VehicleFormData {
  vehicleNumber: string;
  tagNumber: string;
  vin: string;
  city: string;
  make: string;
  model: string;
  year: string;
  tireSize: string;
  registrationExp: string;
  stateInspectionExp: string;
  cityInspectionDate: string;
  insurance: string;
  isActive: "active" | "inactive";
  notes: string;
}

export default function VehicleForm() {
  const params = useParams<{ id: string }>();
  const vehicleId = params.id ? parseInt(params.id) : null;
  const isEditing = !!vehicleId;
  const [, setLocation] = useLocation();

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm<VehicleFormData>({
    defaultValues: {
      vehicleNumber: "",
      tagNumber: "",
      vin: "",
      city: "",
      make: "",
      model: "",
      year: "",
      tireSize: "",
      registrationExp: "",
      stateInspectionExp: "",
      cityInspectionDate: "",
      insurance: "",
      isActive: "active",
      notes: "",
    },
  });

  const { data: vehicle, isLoading } = trpc.vehicles.getById.useQuery(
    { id: vehicleId! },
    { enabled: isEditing }
  );

  const createMutation = trpc.vehicles.create.useMutation({
    onSuccess: (result) => {
      toast.success("Vehicle created successfully");
      setLocation(`/vehicles/${result.id}`);
    },
    onError: (error) => {
      toast.error("Failed to create vehicle: " + error.message);
    },
  });

  const updateMutation = trpc.vehicles.update.useMutation({
    onSuccess: () => {
      toast.success("Vehicle updated successfully");
      setLocation(`/vehicles/${vehicleId}`);
    },
    onError: (error) => {
      toast.error("Failed to update vehicle: " + error.message);
    },
  });

  useEffect(() => {
    if (vehicle) {
      reset({
        vehicleNumber: vehicle.vehicleNumber || "",
        tagNumber: vehicle.tagNumber || "",
        vin: vehicle.vin || "",
        city: vehicle.city || "",
        make: vehicle.make || "",
        model: vehicle.model || "",
        year: vehicle.year?.toString() || "",
        tireSize: vehicle.tireSize || "",
        registrationExp: vehicle.registrationExp ? new Date(vehicle.registrationExp).toISOString().split("T")[0] : "",
        stateInspectionExp: vehicle.stateInspectionExp ? new Date(vehicle.stateInspectionExp).toISOString().split("T")[0] : "",
        cityInspectionDate: vehicle.cityInspectionDate ? new Date(vehicle.cityInspectionDate).toISOString().split("T")[0] : "",
        insurance: vehicle.insurance || "",
        isActive: vehicle.isActive || "active",
        notes: vehicle.notes || "",
      });
    }
  }, [vehicle, reset]);

  const onSubmit = (data: VehicleFormData) => {
    const payload = {
      vehicleNumber: data.vehicleNumber,
      tagNumber: data.tagNumber,
      vin: data.vin || null,
      city: data.city || null,
      make: data.make || null,
      model: data.model || null,
      year: data.year ? parseInt(data.year) : null,
      tireSize: data.tireSize || null,
      registrationExp: data.registrationExp || null,
      stateInspectionExp: data.stateInspectionExp || null,
      cityInspectionDate: data.cityInspectionDate || null,
      insurance: data.insurance || null,
      isActive: data.isActive,
      notes: data.notes || null,
    };

    if (isEditing) {
      updateMutation.mutate({ id: vehicleId!, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditing && isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation(isEditing ? `/vehicles/${vehicleId}` : "/vehicles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {isEditing ? "Edit Vehicle" : "Add New Vehicle"}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? `Update vehicle #${vehicle?.vehicleNumber}` : "Enter the vehicle information below"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
              <CardDescription>Vehicle identification details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicleNumber">Vehicle Number *</Label>
                  <Input
                    id="vehicleNumber"
                    placeholder="e.g., 1001"
                    {...register("vehicleNumber", { required: "Vehicle number is required" })}
                  />
                  {errors.vehicleNumber && (
                    <p className="text-xs text-destructive">{errors.vehicleNumber.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tagNumber">TAG # *</Label>
                  <Input
                    id="tagNumber"
                    placeholder="e.g., H135941"
                    {...register("tagNumber", { required: "TAG number is required" })}
                  />
                  {errors.tagNumber && (
                    <p className="text-xs text-destructive">{errors.tagNumber.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vin">VIN</Label>
                <Input
                  id="vin"
                  placeholder="Vehicle Identification Number"
                  {...register("vin")}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="e.g., IW, NN, HPT"
                  {...register("city")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="isActive">Status</Label>
                <Select
                  value={watch("isActive")}
                  onValueChange={(v) => setValue("isActive", v as "active" | "inactive")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vehicle Details</CardTitle>
              <CardDescription>Make, model, and specifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    placeholder="e.g., Honda"
                    {...register("make")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    placeholder="e.g., Odyssey"
                    {...register("model")}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    placeholder="e.g., 2018"
                    {...register("year")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tireSize">Tire Size</Label>
                  <Input
                    id="tireSize"
                    placeholder="e.g., 235/65/R17"
                    {...register("tireSize")}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">Insurance Provider</Label>
                <Input
                  id="insurance"
                  placeholder="e.g., SAHRAWI"
                  {...register("insurance")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Compliance Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Compliance Dates</CardTitle>
              <CardDescription>Registration and inspection dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="registrationExp">Registration Expiration</Label>
                <Input
                  id="registrationExp"
                  type="date"
                  {...register("registrationExp")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stateInspectionExp">State Inspection Expiration</Label>
                <Input
                  id="stateInspectionExp"
                  type="date"
                  {...register("stateInspectionExp")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cityInspectionDate">City Inspection Date</Label>
                <Input
                  id="cityInspectionDate"
                  type="date"
                  {...register("cityInspectionDate")}
                />
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notes</CardTitle>
              <CardDescription>Additional information</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Any additional notes about this vehicle..."
                rows={6}
                {...register("notes")}
              />
            </CardContent>
          </Card>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end gap-4 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => setLocation(isEditing ? `/vehicles/${vehicleId}` : "/vehicles")}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditing ? "Updating..." : "Creating..."}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {isEditing ? "Update Vehicle" : "Create Vehicle"}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
