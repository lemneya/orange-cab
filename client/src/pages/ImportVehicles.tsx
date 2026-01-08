import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Info, Car, Users } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

type ImportType = "vehicles" | "drivers" | "maintenance";

interface ParsedVehicle {
  vehicleNumber: string;
  tagNumber: string;
  vin?: string;
  city?: string;
  make?: string;
  model?: string;
  year?: number;
  tireSize?: string;
  registrationExp?: string;
  stateInspectionExp?: string;
  cityInspectionDate?: string;
  insurance?: string;
}

interface ParsedDriver {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  licenseNumber?: string;
  licenseExpiration?: string;
  licenseState?: string;
  city?: string;
  hireDate?: string;
}

interface ParsedMaintenance {
  vehicleNumber: string;
  maintenanceType: string;
  serviceDate: string;
  description?: string;
  mileage?: number;
  cost?: number;
  serviceProvider?: string;
}

function parseDate(dateStr: string | undefined): string | undefined {
  if (!dateStr || dateStr === "NA" || dateStr === "-" || dateStr === "") return undefined;
  
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }
  
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const [month, day, year] = parts;
    const parsed = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
  }
  
  return undefined;
}

function parseVehicleData(text: string): ParsedVehicle[] {
  const lines = text.trim().split("\n");
  const vehicles: ParsedVehicle[] = [];
  
  const startIndex = lines[0]?.toLowerCase().includes("tag") || lines[0]?.toLowerCase().includes("vehicle") ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = line.includes("\t") ? line.split("\t") : line.split(",");
    
    if (cells.length >= 2) {
      const vehicle: ParsedVehicle = {
        vehicleNumber: cells[0]?.trim() || "",
        tagNumber: cells[1]?.trim() || "",
        city: cells[2]?.trim() || undefined,
        vin: cells[3]?.trim() || undefined,
        registrationExp: parseDate(cells[4]?.trim()),
        stateInspectionExp: parseDate(cells[5]?.trim()),
        cityInspectionDate: parseDate(cells[6]?.trim()),
        insurance: cells[7]?.trim() || undefined,
        make: cells[8]?.trim() || undefined,
        model: cells[9]?.trim() || undefined,
        year: cells[10]?.trim() ? parseInt(cells[10].trim()) : undefined,
        tireSize: cells[11]?.trim() || undefined,
      };
      
      if (vehicle.vehicleNumber && vehicle.tagNumber) {
        vehicles.push(vehicle);
      }
    }
  }
  
  return vehicles;
}

function parseDriverData(text: string): ParsedDriver[] {
  const lines = text.trim().split("\n");
  const drivers: ParsedDriver[] = [];
  
  const startIndex = lines[0]?.toLowerCase().includes("name") || lines[0]?.toLowerCase().includes("driver") ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = line.includes("\t") ? line.split("\t") : line.split(",");
    
    if (cells.length >= 1) {
      // Try to parse name - could be "First Last" or separate columns
      let firstName = "";
      let lastName = "";
      
      const firstCell = cells[0]?.trim() || "";
      if (firstCell.includes(" ")) {
        const nameParts = firstCell.split(" ");
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(" ") || "";
      } else {
        firstName = firstCell;
        lastName = cells[1]?.trim() || "";
      }
      
      if (!firstName) continue;
      
      const driver: ParsedDriver = {
        firstName,
        lastName,
        phone: cells[2]?.trim() || undefined,
        email: cells[3]?.trim() || undefined,
        licenseNumber: cells[4]?.trim() || undefined,
        licenseExpiration: parseDate(cells[5]?.trim()),
        licenseState: cells[6]?.trim() || undefined,
        city: cells[7]?.trim() || undefined,
        hireDate: parseDate(cells[8]?.trim()),
      };
      
      drivers.push(driver);
    }
  }
  
  return drivers;
}

function parseMaintenanceData(text: string): ParsedMaintenance[] {
  const lines = text.trim().split("\n");
  const records: ParsedMaintenance[] = [];
  
  const startIndex = lines[0]?.toLowerCase().includes("vehicle") || lines[0]?.toLowerCase().includes("date") ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const cells = line.includes("\t") ? line.split("\t") : line.split(",");
    
    if (cells.length >= 2) {
      const record: ParsedMaintenance = {
        vehicleNumber: cells[0]?.trim() || "",
        maintenanceType: cells[1]?.trim()?.toLowerCase().replace(/\s+/g, "_") || "oil_change",
        serviceDate: parseDate(cells[2]?.trim()) || new Date().toISOString().split("T")[0],
        description: cells[3]?.trim() || undefined,
        mileage: cells[4]?.trim() ? parseInt(cells[4].trim()) : undefined,
        cost: cells[5]?.trim() ? parseFloat(cells[5].trim().replace(/[$,]/g, "")) * 100 : undefined,
        serviceProvider: cells[6]?.trim() || undefined,
      };
      
      if (record.vehicleNumber) {
        records.push(record);
      }
    }
  }
  
  return records;
}

export default function ImportVehicles() {
  const [, setLocation] = useLocation();
  const [importType, setImportType] = useState<ImportType>("vehicles");
  const [rawData, setRawData] = useState("");
  const [parsedVehicles, setParsedVehicles] = useState<ParsedVehicle[]>([]);
  const [parsedDrivers, setParsedDrivers] = useState<ParsedDriver[]>([]);
  const [parsedMaintenance, setParsedMaintenance] = useState<ParsedMaintenance[]>([]);
  const [isParsed, setIsParsed] = useState(false);

  const vehicleImportMutation = trpc.vehicles.bulkImport.useMutation({
    onSuccess: (result) => {
      toast.success(`Successfully imported ${result.count} vehicles`);
      setLocation("/vehicles");
    },
    onError: (error) => {
      toast.error("Failed to import vehicles: " + error.message);
    },
  });

  const driverImportMutation = trpc.drivers.bulkImport.useMutation({
    onSuccess: (result) => {
      toast.success(`Successfully imported ${result.count} drivers`);
      setLocation("/drivers");
    },
    onError: (error) => {
      toast.error("Failed to import drivers: " + error.message);
    },
  });

  const handleParse = () => {
    if (importType === "vehicles") {
      const vehicles = parseVehicleData(rawData);
      setParsedVehicles(vehicles);
      if (vehicles.length === 0) {
        toast.error("No valid vehicles found. Please check the format.");
      } else {
        toast.success(`Parsed ${vehicles.length} vehicles. Review and confirm.`);
      }
    } else if (importType === "drivers") {
      const drivers = parseDriverData(rawData);
      setParsedDrivers(drivers);
      if (drivers.length === 0) {
        toast.error("No valid drivers found. Please check the format.");
      } else {
        toast.success(`Parsed ${drivers.length} drivers. Review and confirm.`);
      }
    } else if (importType === "maintenance") {
      const records = parseMaintenanceData(rawData);
      setParsedMaintenance(records);
      if (records.length === 0) {
        toast.error("No valid maintenance records found. Please check the format.");
      } else {
        toast.success(`Parsed ${records.length} records. Review and confirm.`);
      }
    }
    setIsParsed(true);
  };

  const handleImport = () => {
    if (importType === "vehicles" && parsedVehicles.length > 0) {
      const vehiclesToImport = parsedVehicles.map(v => ({
        vehicleNumber: v.vehicleNumber,
        tagNumber: v.tagNumber,
        vin: v.vin || null,
        city: v.city || null,
        make: v.make || null,
        model: v.model || null,
        year: v.year || null,
        tireSize: v.tireSize || null,
        registrationExp: v.registrationExp || null,
        stateInspectionExp: v.stateInspectionExp || null,
        cityInspectionDate: v.cityInspectionDate || null,
        insurance: v.insurance || null,
      }));
      vehicleImportMutation.mutate({ vehicles: vehiclesToImport });
    } else if (importType === "drivers" && parsedDrivers.length > 0) {
      const driversToImport = parsedDrivers.map(d => ({
        firstName: d.firstName,
        lastName: d.lastName,
        phone: d.phone || null,
        email: d.email || null,
        licenseNumber: d.licenseNumber || null,
        licenseExpiration: d.licenseExpiration || null,
        licenseState: d.licenseState || null,
        city: d.city || null,
        hireDate: d.hireDate || null,
      }));
      driverImportMutation.mutate({ drivers: driversToImport });
    }
  };

  const handleReset = () => {
    setRawData("");
    setParsedVehicles([]);
    setParsedDrivers([]);
    setParsedMaintenance([]);
    setIsParsed(false);
  };

  const handleTypeChange = (type: ImportType) => {
    setImportType(type);
    handleReset();
  };

  const isPending = vehicleImportMutation.isPending || driverImportMutation.isPending;
  const parsedCount = importType === "vehicles" ? parsedVehicles.length : 
                      importType === "drivers" ? parsedDrivers.length : 
                      parsedMaintenance.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Data</h1>
          <p className="text-muted-foreground">
            Import vehicles, drivers, or service records from a spreadsheet
          </p>
        </div>
      </div>

      {/* Import Type Selection */}
      <div className="flex gap-2">
        <Button
          variant={importType === "vehicles" ? "default" : "outline"}
          onClick={() => handleTypeChange("vehicles")}
        >
          <Car className="mr-2 h-4 w-4" />
          Vehicles
        </Button>
        <Button
          variant={importType === "drivers" ? "default" : "outline"}
          onClick={() => handleTypeChange("drivers")}
        >
          <Users className="mr-2 h-4 w-4" />
          Drivers
        </Button>
        <Button
          variant={importType === "maintenance" ? "default" : "outline"}
          onClick={() => handleTypeChange("maintenance")}
        >
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Service Records
        </Button>
      </div>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How to import from Google Sheets</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>1. Open your Google Sheets spreadsheet</p>
          <p>2. Select the rows you want to import</p>
          <p>3. Copy the selection (Ctrl+C or Cmd+C)</p>
          <p>4. Paste the data into the text area below</p>
          {importType === "vehicles" && (
            <p className="text-xs text-muted-foreground mt-2">
              Expected columns: Vehicle#, TAG#, City, VIN, Registration Exp, State Inspection Exp, City Inspection, Insurance, Make, Model, Year, Tire Size
            </p>
          )}
          {importType === "drivers" && (
            <p className="text-xs text-muted-foreground mt-2">
              Expected columns: Name (or First, Last), Phone, Email, License#, License Exp, License State, City, Hire Date
            </p>
          )}
          {importType === "maintenance" && (
            <p className="text-xs text-muted-foreground mt-2">
              Expected columns: Vehicle#, Service Type, Date, Description, Mileage, Cost, Service Provider
            </p>
          )}
        </AlertDescription>
      </Alert>

      {!isParsed ? (
        /* Data Input */
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Paste Spreadsheet Data
            </CardTitle>
            <CardDescription>
              Copy and paste rows from your Google Sheets spreadsheet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder={
                importType === "vehicles" 
                  ? "Paste vehicle data here...\n\nExample:\n1001\tTYE9504\tIW\t5FNRL6H7XJB094488\t4/30/2027\t9/30/2026\t\tSAHRAWI\tHONDA\todyssey\t2018"
                  : importType === "drivers"
                  ? "Paste driver data here...\n\nExample:\nJohn Doe\t555-123-4567\tjohn@email.com\tDL12345\t12/31/2025\tVA\tNN"
                  : "Paste service records here...\n\nExample:\n1001\tOil Change\t1/15/2024\tRegular oil change\t45000\t45.99\tQuick Lube"
              }
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button onClick={handleParse} disabled={!rawData.trim()}>
                <Upload className="mr-2 h-4 w-4" />
                Parse Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Preview and Confirm */
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Review Import Data
            </CardTitle>
            <CardDescription>
              {parsedCount} {importType} ready to import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedCount > 0 ? (
              <div className="border rounded-lg overflow-x-auto max-h-96">
                {importType === "vehicles" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle #</TableHead>
                        <TableHead>TAG #</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Make/Model</TableHead>
                        <TableHead>Year</TableHead>
                        <TableHead>Insurance</TableHead>
                        <TableHead>Reg Exp</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedVehicles.map((vehicle, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{vehicle.vehicleNumber}</TableCell>
                          <TableCell>{vehicle.tagNumber}</TableCell>
                          <TableCell><Badge variant="outline">{vehicle.city || "-"}</Badge></TableCell>
                          <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                          <TableCell>{vehicle.year || "-"}</TableCell>
                          <TableCell>{vehicle.insurance || "-"}</TableCell>
                          <TableCell>{vehicle.registrationExp || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {importType === "drivers" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>License #</TableHead>
                        <TableHead>License Exp</TableHead>
                        <TableHead>City</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedDrivers.map((driver, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{driver.firstName} {driver.lastName}</TableCell>
                          <TableCell>{driver.phone || "-"}</TableCell>
                          <TableCell>{driver.email || "-"}</TableCell>
                          <TableCell>{driver.licenseNumber || "-"}</TableCell>
                          <TableCell>{driver.licenseExpiration || "-"}</TableCell>
                          <TableCell><Badge variant="outline">{driver.city || "-"}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                {importType === "maintenance" && (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle #</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedMaintenance.map((record, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{record.vehicleNumber}</TableCell>
                          <TableCell><Badge variant="outline">{record.maintenanceType}</Badge></TableCell>
                          <TableCell>{record.serviceDate}</TableCell>
                          <TableCell>{record.description || "-"}</TableCell>
                          <TableCell>{record.mileage?.toLocaleString() || "-"}</TableCell>
                          <TableCell>{record.cost ? `$${(record.cost / 100).toFixed(2)}` : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">No valid data found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Please check your data format and try again
                </p>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                Start Over
              </Button>
              <Button onClick={handleImport} disabled={parsedCount === 0 || isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {parsedCount} {importType}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
