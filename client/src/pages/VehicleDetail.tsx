import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Edit,
  Trash2,
  Upload,
  FileText,
  Download,
  Eye,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Car,
  Wrench,
  Plus,
  DollarSign,
  Calendar,
  Gauge,
} from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

type DocumentCategory =
  | "title"
  | "purchase_bill"
  | "state_inspection"
  | "registration"
  | "insurance"
  | "city_inspection"
  | "other";
type MaintenanceType =
  | "oil_change"
  | "tire_rotation"
  | "tire_replacement"
  | "brake_service"
  | "transmission"
  | "engine_repair"
  | "battery"
  | "inspection"
  | "registration_renewal"
  | "insurance_renewal"
  | "body_work"
  | "electrical"
  | "ac_heating"
  | "general_service"
  | "other";

const DOCUMENT_CATEGORIES: { value: DocumentCategory; label: string }[] = [
  { value: "title", label: "Title" },
  { value: "purchase_bill", label: "Purchase Bill" },
  { value: "state_inspection", label: "State Inspection" },
  { value: "registration", label: "Registration" },
  { value: "insurance", label: "Insurance" },
  { value: "city_inspection", label: "City Inspection" },
  { value: "other", label: "Other" },
];

const MAINTENANCE_TYPES: { value: MaintenanceType; label: string }[] = [
  { value: "oil_change", label: "Oil Change" },
  { value: "tire_rotation", label: "Tire Rotation" },
  { value: "tire_replacement", label: "Tire Replacement" },
  { value: "brake_service", label: "Brake Service" },
  { value: "transmission", label: "Transmission" },
  { value: "engine_repair", label: "Engine Repair" },
  { value: "battery", label: "Battery" },
  { value: "inspection", label: "Inspection" },
  { value: "registration_renewal", label: "Registration Renewal" },
  { value: "insurance_renewal", label: "Insurance Renewal" },
  { value: "body_work", label: "Body Work" },
  { value: "electrical", label: "Electrical" },
  { value: "ac_heating", label: "AC/Heating" },
  { value: "general_service", label: "General Service" },
  { value: "other", label: "Other" },
];

function getExpirationStatus(
  dateStr: string | Date | null | undefined
): "valid" | "warning" | "expired" {
  if (!dateStr) return "valid";
  const date = new Date(dateStr);
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  if (date < today) return "expired";
  if (date <= thirtyDaysFromNow) return "warning";
  return "valid";
}

function StatusBadge({
  date,
  label,
}: {
  date: string | Date | null | undefined;
  label: string;
}) {
  const status = getExpirationStatus(date);

  if (!date) {
    return <span className="text-muted-foreground">Not set</span>;
  }

  const formattedDate = new Date(date).toLocaleDateString();

  if (status === "expired") {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="destructive" className="gap-1">
          <AlertCircle className="h-3 w-3" />
          Expired
        </Badge>
        <span className="text-sm">{formattedDate}</span>
      </div>
    );
  }

  if (status === "warning") {
    return (
      <div className="flex items-center gap-2">
        <Badge className="gap-1 bg-amber-500 hover:bg-amber-600">
          <AlertTriangle className="h-3 w-3" />
          Expiring Soon
        </Badge>
        <span className="text-sm">{formattedDate}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="gap-1">
        <CheckCircle className="h-3 w-3 text-green-600" />
        Valid
      </Badge>
      <span className="text-sm">{formattedDate}</span>
    </div>
  );
}

function formatCurrency(cents: number | null | undefined): string {
  if (!cents) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export default function VehicleDetail() {
  const params = useParams<{ id: string }>();
  const vehicleId = parseInt(params.id || "0");
  const [, setLocation] = useLocation();
  const [uploadCategory, setUploadCategory] =
    useState<DocumentCategory>("registration");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Maintenance form state
  const [maintenanceForm, setMaintenanceForm] = useState({
    maintenanceType: "oil_change" as MaintenanceType,
    description: "",
    serviceDate: new Date().toISOString().split("T")[0],
    mileage: "",
    cost: "",
    serviceProvider: "",
    invoiceNumber: "",
    nextServiceDate: "",
    nextServiceMileage: "",
    notes: "",
  });

  const utils = trpc.useUtils();
  const { data: vehicle, isLoading } = trpc.vehicles.getById.useQuery({
    id: vehicleId,
  });
  const { data: documents, isLoading: docsLoading } =
    trpc.documents.listByVehicle.useQuery({ vehicleId });
  const { data: maintenanceRecords, isLoading: maintenanceLoading } =
    trpc.maintenance.listByVehicle.useQuery({ vehicleId });

  const deleteMutation = trpc.vehicles.delete.useMutation({
    onSuccess: () => {
      toast.success("Vehicle deleted successfully");
      setLocation("/vehicles");
    },
    onError: error => {
      toast.error("Failed to delete vehicle: " + error.message);
    },
  });

  const uploadMutation = trpc.documents.upload.useMutation({
    onSuccess: () => {
      toast.success("Document uploaded successfully");
      utils.documents.listByVehicle.invalidate({ vehicleId });
      setUploadDialogOpen(false);
    },
    onError: error => {
      toast.error("Failed to upload document: " + error.message);
    },
  });

  const deleteDocMutation = trpc.documents.delete.useMutation({
    onSuccess: () => {
      toast.success("Document deleted");
      utils.documents.listByVehicle.invalidate({ vehicleId });
    },
    onError: error => {
      toast.error("Failed to delete document: " + error.message);
    },
  });

  const createMaintenanceMutation = trpc.maintenance.create.useMutation({
    onSuccess: () => {
      toast.success("Maintenance record added");
      utils.maintenance.listByVehicle.invalidate({ vehicleId });
      setMaintenanceDialogOpen(false);
      resetMaintenanceForm();
    },
    onError: error => {
      toast.error("Failed to add maintenance record: " + error.message);
    },
  });

  const deleteMaintenanceMutation = trpc.maintenance.delete.useMutation({
    onSuccess: () => {
      toast.success("Maintenance record deleted");
      utils.maintenance.listByVehicle.invalidate({ vehicleId });
    },
    onError: error => {
      toast.error("Failed to delete maintenance record: " + error.message);
    },
  });

  const resetMaintenanceForm = () => {
    setMaintenanceForm({
      maintenanceType: "oil_change",
      description: "",
      serviceDate: new Date().toISOString().split("T")[0],
      mileage: "",
      cost: "",
      serviceProvider: "",
      invoiceNumber: "",
      nextServiceDate: "",
      nextServiceMileage: "",
      notes: "",
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(",")[1];
        await uploadMutation.mutateAsync({
          vehicleId,
          category: uploadCategory,
          fileName: file.name,
          fileData: base64,
          mimeType: file.type,
          fileSize: file.size,
        });
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setIsUploading(false);
    }
  };

  const handleMaintenanceSubmit = () => {
    createMaintenanceMutation.mutate({
      vehicleId,
      maintenanceType: maintenanceForm.maintenanceType,
      description: maintenanceForm.description || null,
      serviceDate: maintenanceForm.serviceDate,
      mileage: maintenanceForm.mileage
        ? parseInt(maintenanceForm.mileage)
        : null,
      cost: maintenanceForm.cost
        ? Math.round(parseFloat(maintenanceForm.cost) * 100)
        : null,
      serviceProvider: maintenanceForm.serviceProvider || null,
      invoiceNumber: maintenanceForm.invoiceNumber || null,
      nextServiceDate: maintenanceForm.nextServiceDate || null,
      nextServiceMileage: maintenanceForm.nextServiceMileage
        ? parseInt(maintenanceForm.nextServiceMileage)
        : null,
      notes: maintenanceForm.notes || null,
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Vehicle not found</h2>
        <Button className="mt-4" onClick={() => setLocation("/vehicles")}>
          Back to Vehicles
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/vehicles")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Vehicle #{vehicle.vehicleNumber}
              </h1>
              <Badge
                variant={
                  vehicle.isActive === "active" ? "default" : "secondary"
                }
              >
                {vehicle.isActive}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {vehicle.year} {vehicle.make} {vehicle.model} • TAG:{" "}
              {vehicle.tagNumber}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setLocation(`/vehicles/${vehicleId}/edit`)}
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
                <AlertDialogTitle>Delete Vehicle?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete vehicle #{vehicle.vehicleNumber}{" "}
                  and all associated documents. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate({ id: vehicleId })}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="space-y-4">
        {/* Custom Tab Navigation */}
        <div className="bg-muted inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]">
          <button
            onClick={() => setActiveTab("details")}
            className={`inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${activeTab === "details" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${activeTab === "documents" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Documents{" "}
            {documents && documents.length > 0 && `(${documents.length})`}
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`inline-flex h-[calc(100%-1px)] items-center justify-center gap-1.5 rounded-md px-3 py-1 text-sm font-medium transition-colors ${activeTab === "maintenance" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            Maintenance{" "}
            {maintenanceRecords &&
              maintenanceRecords.length > 0 &&
              `(${maintenanceRecords.length})`}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "details" && (
          <div className="space-y-4">
            {/* Vehicle Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Vehicle Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Vehicle Number
                      </p>
                      <p className="font-medium">{vehicle.vehicleNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">TAG #</p>
                      <p className="font-medium">{vehicle.tagNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">VIN</p>
                      <p className="font-medium font-mono text-sm">
                        {vehicle.vin || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">City</p>
                      <p className="font-medium">{vehicle.city || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Make</p>
                      <p className="font-medium">{vehicle.make || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Model</p>
                      <p className="font-medium">{vehicle.model || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Year</p>
                      <p className="font-medium">{vehicle.year || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Tire Size</p>
                      <p className="font-medium">{vehicle.tireSize || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Compliance & Insurance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Registration Expiration
                    </p>
                    <StatusBadge
                      date={vehicle.registrationExp}
                      label="Registration"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      State Inspection
                    </p>
                    <StatusBadge
                      date={vehicle.stateInspectionExp}
                      label="State Inspection"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      City Inspection
                    </p>
                    {vehicle.cityInspectionDate ? (
                      <span className="text-sm">
                        {new Date(
                          vehicle.cityInspectionDate
                        ).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Not set</span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Insurance Provider
                    </p>
                    <p className="font-medium">{vehicle.insurance || "-"}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {vehicle.notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{vehicle.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "documents" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base">Documents</CardTitle>
                  <CardDescription>
                    Upload and manage vehicle documents
                  </CardDescription>
                </div>
                <Dialog
                  open={uploadDialogOpen}
                  onOpenChange={setUploadDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Document
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Upload Document</DialogTitle>
                      <DialogDescription>
                        Select a category and upload a document for this
                        vehicle.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Category</label>
                        <Select
                          value={uploadCategory}
                          onValueChange={v =>
                            setUploadCategory(v as DocumentCategory)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DOCUMENT_CATEGORIES.map(cat => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">File</label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          onChange={handleFileUpload}
                          className="block w-full text-sm text-muted-foreground
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-medium
                          file:bg-primary file:text-primary-foreground
                          hover:file:bg-primary/90
                          cursor-pointer"
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                        />
                        <p className="text-xs text-muted-foreground">
                          Accepted formats: PDF, JPG, PNG, DOC, DOCX
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setUploadDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {docsLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">
                              {doc.fileName}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {DOCUMENT_CATEGORIES.find(
                                  c => c.value === doc.category
                                )?.label || doc.category}
                              </Badge>
                              <span>•</span>
                              <span>
                                {new Date(doc.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(doc.fileUrl, "_blank")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={doc.fileUrl} download={doc.fileName}>
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Document?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete "{doc.fileName}".
                                  This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteDocMutation.mutate({ id: doc.id })
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">No documents yet</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Upload documents like title, registration, or insurance
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "maintenance" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Wrench className="h-4 w-4" />
                    Maintenance History
                  </CardTitle>
                  <CardDescription>
                    Track service records and maintenance history
                  </CardDescription>
                </div>
                <Dialog
                  open={maintenanceDialogOpen}
                  onOpenChange={setMaintenanceDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Record
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Add Maintenance Record</DialogTitle>
                      <DialogDescription>
                        Record a service or maintenance activity for this
                        vehicle.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Service Type *</Label>
                          <Select
                            value={maintenanceForm.maintenanceType}
                            onValueChange={v =>
                              setMaintenanceForm(f => ({
                                ...f,
                                maintenanceType: v as MaintenanceType,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {MAINTENANCE_TYPES.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Service Date *</Label>
                          <Input
                            type="date"
                            value={maintenanceForm.serviceDate}
                            onChange={e =>
                              setMaintenanceForm(f => ({
                                ...f,
                                serviceDate: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Description</Label>
                        <Textarea
                          placeholder="Describe the service performed..."
                          value={maintenanceForm.description}
                          onChange={e =>
                            setMaintenanceForm(f => ({
                              ...f,
                              description: e.target.value,
                            }))
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Mileage</Label>
                          <div className="relative">
                            <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              placeholder="Current mileage"
                              className="pl-10"
                              value={maintenanceForm.mileage}
                              onChange={e =>
                                setMaintenanceForm(f => ({
                                  ...f,
                                  mileage: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Cost ($)</Label>
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              className="pl-10"
                              value={maintenanceForm.cost}
                              onChange={e =>
                                setMaintenanceForm(f => ({
                                  ...f,
                                  cost: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Service Provider</Label>
                          <Input
                            placeholder="Shop or mechanic name"
                            value={maintenanceForm.serviceProvider}
                            onChange={e =>
                              setMaintenanceForm(f => ({
                                ...f,
                                serviceProvider: e.target.value,
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Invoice Number</Label>
                          <Input
                            placeholder="Invoice or receipt #"
                            value={maintenanceForm.invoiceNumber}
                            onChange={e =>
                              setMaintenanceForm(f => ({
                                ...f,
                                invoiceNumber: e.target.value,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="text-sm font-medium mb-3">
                          Next Service (Optional)
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Next Service Date</Label>
                            <div className="relative">
                              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="date"
                                className="pl-10"
                                value={maintenanceForm.nextServiceDate}
                                onChange={e =>
                                  setMaintenanceForm(f => ({
                                    ...f,
                                    nextServiceDate: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Next Service Mileage</Label>
                            <div className="relative">
                              <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="e.g., 50000"
                                className="pl-10"
                                value={maintenanceForm.nextServiceMileage}
                                onChange={e =>
                                  setMaintenanceForm(f => ({
                                    ...f,
                                    nextServiceMileage: e.target.value,
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          placeholder="Any additional notes..."
                          value={maintenanceForm.notes}
                          onChange={e =>
                            setMaintenanceForm(f => ({
                              ...f,
                              notes: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setMaintenanceDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleMaintenanceSubmit}
                        disabled={
                          !maintenanceForm.serviceDate ||
                          createMaintenanceMutation.isPending
                        }
                      >
                        {createMaintenanceMutation.isPending
                          ? "Saving..."
                          : "Save Record"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {maintenanceLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full" />
                    ))}
                  </div>
                ) : maintenanceRecords && maintenanceRecords.length > 0 ? (
                  <div className="space-y-3">
                    {maintenanceRecords.map(record => (
                      <div
                        key={record.id}
                        className="p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mt-0.5">
                              <Wrench className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-medium">
                                  {MAINTENANCE_TYPES.find(
                                    t => t.value === record.maintenanceType
                                  )?.label || record.maintenanceType}
                                </p>
                                <Badge variant="outline" className="text-xs">
                                  {new Date(
                                    record.serviceDate
                                  ).toLocaleDateString()}
                                </Badge>
                              </div>
                              {record.description && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {record.description}
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                                {record.mileage && (
                                  <span className="flex items-center gap-1">
                                    <Gauge className="h-3 w-3" />
                                    {record.mileage.toLocaleString()} mi
                                  </span>
                                )}
                                {record.cost && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="h-3 w-3" />
                                    {formatCurrency(record.cost)}
                                  </span>
                                )}
                                {record.serviceProvider && (
                                  <span>@ {record.serviceProvider}</span>
                                )}
                              </div>
                              {(record.nextServiceDate ||
                                record.nextServiceMileage) && (
                                <div className="mt-2 text-xs">
                                  <span className="text-amber-600 font-medium">
                                    Next service:{" "}
                                  </span>
                                  {record.nextServiceDate &&
                                    new Date(
                                      record.nextServiceDate
                                    ).toLocaleDateString()}
                                  {record.nextServiceDate &&
                                    record.nextServiceMileage &&
                                    " or "}
                                  {record.nextServiceMileage &&
                                    `${record.nextServiceMileage.toLocaleString()} mi`}
                                </div>
                              )}
                            </div>
                          </div>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Maintenance Record?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will permanently delete this maintenance
                                  record. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    deleteMaintenanceMutation.mutate({
                                      id: record.id,
                                    })
                                  }
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Wrench className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="font-medium">No maintenance records</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Add service records to track maintenance history
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
