import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Info } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

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

function parseDate(dateStr: string | undefined): string | undefined {
  if (!dateStr || dateStr === "NA" || dateStr === "-") return undefined;
  
  // Try to parse various date formats
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split("T")[0];
  }
  
  // Try MM/DD/YYYY format
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

function parseSpreadsheetData(text: string): ParsedVehicle[] {
  const lines = text.trim().split("\n");
  const vehicles: ParsedVehicle[] = [];
  
  // Skip header row if present
  const startIndex = lines[0]?.toLowerCase().includes("tag") || lines[0]?.toLowerCase().includes("vehicle") ? 1 : 0;
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Split by tab (from spreadsheet copy) or comma (CSV)
    const cells = line.includes("\t") ? line.split("\t") : line.split(",");
    
    // Expected format based on the Google Sheets structure:
    // vehicleNumber, tagNumber, city, vin, registrationExp, stateInspectionExp, cityInspectionDate, insurance, make, model, year, tireSize
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
      
      // Only add if we have at least vehicle number and tag
      if (vehicle.vehicleNumber && vehicle.tagNumber) {
        vehicles.push(vehicle);
      }
    }
  }
  
  return vehicles;
}

export default function ImportVehicles() {
  const [, setLocation] = useLocation();
  const [rawData, setRawData] = useState("");
  const [parsedVehicles, setParsedVehicles] = useState<ParsedVehicle[]>([]);
  const [isParsed, setIsParsed] = useState(false);

  const importMutation = trpc.vehicles.bulkImport.useMutation({
    onSuccess: (result) => {
      toast.success(`Successfully imported ${result.count} vehicles`);
      setLocation("/vehicles");
    },
    onError: (error) => {
      toast.error("Failed to import vehicles: " + error.message);
    },
  });

  const handleParse = () => {
    const vehicles = parseSpreadsheetData(rawData);
    setParsedVehicles(vehicles);
    setIsParsed(true);
    
    if (vehicles.length === 0) {
      toast.error("No valid vehicles found in the data. Please check the format.");
    } else {
      toast.success(`Parsed ${vehicles.length} vehicles. Review and confirm import.`);
    }
  };

  const handleImport = () => {
    if (parsedVehicles.length === 0) return;
    
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
    
    importMutation.mutate({ vehicles: vehiclesToImport });
  };

  const handleReset = () => {
    setRawData("");
    setParsedVehicles([]);
    setIsParsed(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/vehicles")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import Vehicles</h1>
          <p className="text-muted-foreground">
            Import vehicle data from a spreadsheet
          </p>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>How to import from Google Sheets</AlertTitle>
        <AlertDescription className="mt-2 space-y-2">
          <p>1. Open your Google Sheets spreadsheet</p>
          <p>2. Select the rows you want to import (including data columns)</p>
          <p>3. Copy the selection (Ctrl+C or Cmd+C)</p>
          <p>4. Paste the data into the text area below</p>
          <p className="text-xs text-muted-foreground mt-2">
            Expected columns: Vehicle#, TAG#, City, VIN, Registration Exp, State Inspection Exp, City Inspection, Insurance, Make, Model, Year, Tire Size
          </p>
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
              placeholder="Paste your spreadsheet data here...

Example format:
1001	TYE9504	IW	5FNRL6H7XJB094488	4/30/2027	9/30/2026		SAHRAWI	HONDA	odyssey	2018	
1008	H135941	NN	5FNRL5H95DB051712	10/31/2026	11/30/2026	04/03/2024	SAHRAWI	Honda	Odyssey	2013	235/60/R18"
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleParse}
                disabled={!rawData.trim()}
              >
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
              {parsedVehicles.length} vehicles ready to import
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {parsedVehicles.length > 0 ? (
              <div className="border rounded-lg overflow-x-auto max-h-96">
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
                        <TableCell>
                          <Badge variant="outline">{vehicle.city || "-"}</Badge>
                        </TableCell>
                        <TableCell>{vehicle.make} {vehicle.model}</TableCell>
                        <TableCell>{vehicle.year || "-"}</TableCell>
                        <TableCell>{vehicle.insurance || "-"}</TableCell>
                        <TableCell>{vehicle.registrationExp || "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
              <Button
                onClick={handleImport}
                disabled={parsedVehicles.length === 0 || importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Import {parsedVehicles.length} Vehicles
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sample Data Format */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Expected Data Format</CardTitle>
          <CardDescription>
            Your spreadsheet should have columns in this order
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Column</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Required</TableHead>
                  <TableHead>Example</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">1. Vehicle #</TableCell>
                  <TableCell>Unique vehicle identifier</TableCell>
                  <TableCell><Badge>Required</Badge></TableCell>
                  <TableCell className="font-mono text-sm">1001</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">2. TAG #</TableCell>
                  <TableCell>License plate number</TableCell>
                  <TableCell><Badge>Required</Badge></TableCell>
                  <TableCell className="font-mono text-sm">H135941</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">3. City</TableCell>
                  <TableCell>Location code</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">IW, NN, HPT</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">4. VIN</TableCell>
                  <TableCell>Vehicle Identification Number</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">5FNRL6H7XJB094488</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">5. Registration Exp</TableCell>
                  <TableCell>Registration expiration date</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">4/30/2027</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">6. State Inspection Exp</TableCell>
                  <TableCell>State inspection expiration</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">9/30/2026</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">7. City Inspection</TableCell>
                  <TableCell>City inspection date</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">04/03/2024</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">8. Insurance</TableCell>
                  <TableCell>Insurance provider</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">SAHRAWI</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">9. Make</TableCell>
                  <TableCell>Vehicle manufacturer</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">Honda</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">10. Model</TableCell>
                  <TableCell>Vehicle model</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">Odyssey</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">11. Year</TableCell>
                  <TableCell>Model year</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">2018</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">12. Tire Size</TableCell>
                  <TableCell>Tire specifications</TableCell>
                  <TableCell><Badge variant="outline">Optional</Badge></TableCell>
                  <TableCell className="font-mono text-sm">235/60/R18</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
