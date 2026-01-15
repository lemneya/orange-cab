import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  ArrowLeft,
  Upload,
  Play,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Brain,
  Users,
  Truck
} from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ParsedTrip {
  id: number;
  externalId: string;
  patientName: string;
  mobilityType: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime: string;
}

export default function NewShadowRun() {
  const [, setLocation] = useLocation();
  
  const [csvContent, setCsvContent] = useState("");
  const [solveDate, setSolveDate] = useState(new Date().toISOString().split('T')[0]);
  const [parsedTrips, setParsedTrips] = useState<ParsedTrip[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  // Mock available drivers and vehicles (in production, fetch from API)
  const availableDriverIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const availableVehicleIds = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  
  const { data: status } = trpc.ids.getStatus.useQuery();
  const solveFromCSV = trpc.ids.solveFromCSV.useMutation();

  // Parse CSV when content changes
  const parseCSV = useCallback((content: string) => {
    setCsvContent(content);
    setParseError(null);
    
    if (!content.trim()) {
      setParsedTrips([]);
      return;
    }
    
    try {
      const lines = content.trim().split('\n');
      if (lines.length < 2) {
        setParseError("CSV must have header row and at least one data row");
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
      const trips: ParsedTrip[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;
        
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx]?.trim() || '';
        });
        
        trips.push({
          id: i,
          externalId: row['tripid'] || row['id'] || String(i),
          patientName: row['membername'] || row['patient'] || row['name'] || `Patient ${i}`,
          mobilityType: row['mobilitytype'] || row['mobility'] || 'AMB',
          pickupAddress: `${row['pickupaddress'] || ''}, ${row['pickupcity'] || ''}`,
          dropoffAddress: `${row['dropoffaddress'] || ''}, ${row['dropoffcity'] || ''}`,
          pickupTime: row['pickuptime'] || row['pickup'] || '08:00',
        });
      }
      
      setParsedTrips(trips);
    } catch (err) {
      setParseError(`Failed to parse CSV: ${err}`);
    }
  }, []);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      parseCSV(content);
    };
    reader.readAsText(file);
  };

  // Run shadow solve
  const handleRunSolve = async () => {
    if (parsedTrips.length === 0) {
      setParseError("Please upload a CSV file with trips first");
      return;
    }
    
    setIsRunning(true);
    
    try {
      const result = await solveFromCSV.mutateAsync({
        csvContent,
        solveDate,
        availableDriverIds,
        availableVehicleIds,
      });
      
      // Redirect to the shadow run detail page
      setLocation(`/ids/shadow-runs/${result.shadowRunId}`);
    } catch (err) {
      setParseError(`Solve failed: ${err}`);
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/ids")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            New Shadow Solve
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload MediRoute CSV and run IDS optimization in shadow mode
          </p>
        </div>
      </div>

      {/* Status Alert */}
      {status && (
        <Alert variant={status.shadowMode ? "default" : "destructive"}>
          {status.shadowMode ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertTitle>
            {status.shadowMode ? "Shadow Mode Active" : "Warning: Live Mode"}
          </AlertTitle>
          <AlertDescription>
            {status.shadowMode 
              ? "Results will be saved for analysis only. No changes to actual dispatch."
              : "IDS is in live mode. This solve could affect actual dispatch!"}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload MediRoute CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV export from MediRoute with trip data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="solve-date">Service Date</Label>
              <Input
                id="solve-date"
                type="date"
                value={solveDate}
                onChange={(e) => setSolveDate(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="csv-content">Or paste CSV content directly</Label>
              <Textarea
                id="csv-content"
                placeholder="TripID,MemberName,MobilityType,PickupAddress,PickupCity,DropoffAddress,DropoffCity,PickupTime..."
                value={csvContent}
                onChange={(e) => parseCSV(e.target.value)}
                rows={6}
              />
            </div>

            {parseError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{parseError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Configuration Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Solve Configuration
            </CardTitle>
            <CardDescription>
              Configure the optimization parameters
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Available Drivers</span>
                </div>
                <div className="text-2xl font-bold">{availableDriverIds.length}</div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Available Vehicles</span>
                </div>
                <div className="text-2xl font-bold">{availableVehicleIds.length}</div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-muted/50">
              <h4 className="font-medium mb-2">Expected CSV Columns</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• TripID (or ID)</p>
                <p>• MemberName (or Patient, Name)</p>
                <p>• MobilityType (AMB, WC, STR)</p>
                <p>• PickupAddress, PickupCity, PickupState, PickupZip</p>
                <p>• DropoffAddress, DropoffCity, DropoffState, DropoffZip</p>
                <p>• PickupTime, AppointmentTime</p>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg"
              onClick={handleRunSolve}
              disabled={parsedTrips.length === 0 || isRunning}
            >
              {isRunning ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Shadow Solve...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Shadow Solve ({parsedTrips.length} trips)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Preview Table */}
      {parsedTrips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              CSV Preview
            </CardTitle>
            <CardDescription>
              {parsedTrips.length} trips parsed from CSV
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip ID</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Mobility</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Dropoff</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsedTrips.slice(0, 10).map((trip) => (
                  <TableRow key={trip.id}>
                    <TableCell className="font-mono">{trip.externalId}</TableCell>
                    <TableCell>{trip.patientName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{trip.mobilityType}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {trip.pickupAddress}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {trip.dropoffAddress}
                    </TableCell>
                    <TableCell>{trip.pickupTime}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {parsedTrips.length > 10 && (
              <p className="text-sm text-muted-foreground mt-4 text-center">
                Showing 10 of {parsedTrips.length} trips
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to parse CSV line with quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result;
}
