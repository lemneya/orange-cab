import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowLeft, FileText, Database, ArrowRight, CheckCircle, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";

// IDS Schema definitions - mirrors server/ids/ids.types.ts
const schemas = {
  trip: {
    name: "Trip",
    description: "Represents a single NEMT trip request from MediRoute",
    fields: [
      { name: "id", type: "number", required: true, description: "Internal trip ID" },
      { name: "externalId", type: "string", required: false, description: "Broker/external system ID (MediRoute trip ID)" },
      { name: "patientName", type: "string", required: true, description: "Patient name (used for matching, not stored in IDS)" },
      { name: "patientPhone", type: "string", required: false, description: "Patient phone number" },
      { name: "mobilityType", type: "enum", required: true, description: "AMB (ambulatory), WC (wheelchair), STR (stretcher)" },
      { name: "pickup", type: "Location", required: true, description: "Pickup location object" },
      { name: "dropoff", type: "Location", required: true, description: "Dropoff location object" },
      { name: "pickupWindow", type: "TimeWindow", required: true, description: "Pickup time constraints" },
      { name: "dropoffWindow", type: "TimeWindow", required: false, description: "Dropoff time constraints" },
      { name: "pickupServiceTime", type: "number", required: false, description: "Minutes to load patient (default: 5)" },
      { name: "dropoffServiceTime", type: "number", required: false, description: "Minutes to unload patient (default: 5)" },
      { name: "maxRideTime", type: "number", required: false, description: "Maximum minutes patient can be in vehicle" },
      { name: "status", type: "enum", required: false, description: "pending, assigned, en_route, picked_up, completed, cancelled, no_show" },
      { name: "isTemplateLocked", type: "boolean", required: false, description: "Whether trip is locked to a template route" },
      { name: "templateLockType", type: "enum", required: false, description: "hard (cannot move) or soft (can move with penalty)" },
      { name: "tripDate", type: "string", required: true, description: "Service date (YYYY-MM-DD)" },
    ],
  },
  driver: {
    name: "Driver Score",
    description: "Reliability and performance metrics for drivers",
    fields: [
      { name: "driverId", type: "number", required: true, description: "Driver ID from HR system" },
      { name: "onTimeScore", type: "number", required: false, description: "On-time reliability (0-100, default: 80)" },
      { name: "earlyBirdScore", type: "number", required: false, description: "Preference for early shifts (0-100, default: 50)" },
      { name: "latenessRisk", type: "number", required: false, description: "Risk of being late (0-100, default: 20)" },
      { name: "cancellationRisk", type: "number", required: false, description: "Risk of cancellation (0-100, default: 10)" },
      { name: "isTrainee", type: "boolean", required: false, description: "Whether driver is in training" },
      { name: "traineeLevel", type: "number", required: false, description: "Training level (1-5)" },
      { name: "preferredZones", type: "string[]", required: false, description: "Preferred city/zone codes" },
      { name: "maxTripsPerDay", type: "number", required: false, description: "Maximum trips driver can handle" },
    ],
  },
  vehicle: {
    name: "Vehicle",
    description: "Vehicle information from Fleet Management",
    fields: [
      { name: "id", type: "number", required: true, description: "Vehicle ID from Fleet system" },
      { name: "unitNumber", type: "string", required: true, description: "Vehicle unit number" },
      { name: "isWheelchairAccessible", type: "boolean", required: true, description: "Can transport wheelchair patients" },
      { name: "isStretcherCapable", type: "boolean", required: false, description: "Can transport stretcher patients" },
      { name: "capacity", type: "number", required: false, description: "Passenger capacity" },
      { name: "isActive", type: "boolean", required: true, description: "Vehicle is on the road" },
    ],
  },
  templateLock: {
    name: "Template Lock",
    description: "Locks trips to specific drivers (veteran routes)",
    fields: [
      { name: "tripId", type: "number", required: true, description: "Trip to lock" },
      { name: "driverId", type: "number", required: true, description: "Driver who owns this trip" },
      { name: "lockType", type: "enum", required: true, description: "hard (cannot move) or soft (can move with penalty)" },
      { name: "effectiveFrom", type: "string", required: true, description: "Start date (YYYY-MM-DD)" },
      { name: "effectiveTo", type: "string", required: false, description: "End date (YYYY-MM-DD)" },
      { name: "reason", type: "string", required: false, description: "Why this lock exists" },
    ],
  },
  payRule: {
    name: "Pay Rule",
    description: "Rules for calculating driver earnings",
    fields: [
      { name: "id", type: "number", required: true, description: "Pay rule ID" },
      { name: "name", type: "string", required: true, description: "Rule name (e.g., 'Standard 1099')" },
      { name: "baseRatePerTrip", type: "number", required: false, description: "Flat rate per trip" },
      { name: "baseRatePerMile", type: "number", required: false, description: "Rate per mile" },
      { name: "baseRatePerHour", type: "number", required: false, description: "Rate per hour" },
      { name: "wheelchairBonus", type: "number", required: false, description: "Extra pay for wheelchair trips" },
      { name: "stretcherBonus", type: "number", required: false, description: "Extra pay for stretcher trips" },
      { name: "lateNightBonus", type: "number", required: false, description: "Extra pay after 8pm" },
      { name: "weekendBonus", type: "number", required: false, description: "Extra pay on weekends" },
      { name: "fuelDeductionPerMile", type: "number", required: false, description: "Fuel cost deduction per mile" },
      { name: "tollPassthrough", type: "boolean", required: false, description: "Whether tolls are passed to driver" },
    ],
  },
};

// MediRoute CSV to IDS field mapping
const fieldMappings = [
  { csvColumn: "TripID", idsField: "externalId", notes: "Unique trip identifier from MediRoute" },
  { csvColumn: "ID", idsField: "externalId", notes: "Alternative column name for trip ID" },
  { csvColumn: "MemberName", idsField: "patientName", notes: "Patient name for matching" },
  { csvColumn: "Patient", idsField: "patientName", notes: "Alternative column name" },
  { csvColumn: "Name", idsField: "patientName", notes: "Alternative column name" },
  { csvColumn: "MobilityType", idsField: "mobilityType", notes: "AMB, WC, or STR" },
  { csvColumn: "Mobility", idsField: "mobilityType", notes: "Alternative column name" },
  { csvColumn: "PickupAddress", idsField: "pickup.address", notes: "Street address" },
  { csvColumn: "PickupCity", idsField: "pickup.city", notes: "City name" },
  { csvColumn: "PickupState", idsField: "pickup.state", notes: "2-letter state code" },
  { csvColumn: "PickupZip", idsField: "pickup.zip", notes: "ZIP code" },
  { csvColumn: "DropoffAddress", idsField: "dropoff.address", notes: "Street address" },
  { csvColumn: "DropoffCity", idsField: "dropoff.city", notes: "City name" },
  { csvColumn: "DropoffState", idsField: "dropoff.state", notes: "2-letter state code" },
  { csvColumn: "DropoffZip", idsField: "dropoff.zip", notes: "ZIP code" },
  { csvColumn: "PickupTime", idsField: "pickupWindow.earliest", notes: "Earliest pickup time" },
  { csvColumn: "PickupEarliest", idsField: "pickupWindow.earliest", notes: "Alternative column name" },
  { csvColumn: "PickupLatest", idsField: "pickupWindow.latest", notes: "Latest pickup time" },
  { csvColumn: "AppointmentTime", idsField: "pickupWindow.appointmentTime", notes: "Actual appointment time" },
  { csvColumn: "Appointment", idsField: "pickupWindow.appointmentTime", notes: "Alternative column name" },
  { csvColumn: "ServiceDate", idsField: "tripDate", notes: "Date of service (YYYY-MM-DD)" },
  { csvColumn: "TripDate", idsField: "tripDate", notes: "Alternative column name" },
  { csvColumn: "Notes", idsField: "notes", notes: "Trip notes or special instructions" },
];

export default function Contracts() {
  const [, setLocation] = useLocation();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation("/ids")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-6 w-6" />
            IDS Data Contracts
          </h1>
          <p className="text-muted-foreground">
            Schema definitions and field mappings for IDS integration
          </p>
        </div>
      </div>

      {/* Purpose Card */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Database className="h-8 w-8 text-blue-600 shrink-0" />
            <div>
              <h3 className="font-semibold text-blue-900">Why Data Contracts Matter</h3>
              <p className="text-sm text-blue-800 mt-1">
                Data contracts ensure consistency between MediRoute exports and IDS processing. 
                When CSV columns change or new fields are added, this page shows exactly what 
                IDS expects and how to map your data. This prevents drift and makes the system 
                understandable to operations staff.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="schemas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="schemas">IDS Schemas</TabsTrigger>
          <TabsTrigger value="mapping">CSV Field Mapping</TabsTrigger>
        </TabsList>

        {/* Schemas Tab */}
        <TabsContent value="schemas" className="space-y-4">
          {Object.entries(schemas).map(([key, schema]) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  {schema.name}
                </CardTitle>
                <CardDescription>{schema.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Field</TableHead>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead className="w-[100px]">Required</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schema.fields.map((field) => (
                      <TableRow key={field.name}>
                        <TableCell className="font-mono text-sm">{field.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-mono text-xs">
                            {field.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {field.required ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <span className="text-muted-foreground text-xs">optional</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {field.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Field Mapping Tab */}
        <TabsContent value="mapping" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowRight className="h-5 w-5" />
                MediRoute CSV → IDS Field Mapping
              </CardTitle>
              <CardDescription>
                How columns from MediRoute CSV exports map to IDS internal fields. 
                Multiple CSV column names may map to the same IDS field for flexibility.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">CSV Column</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead className="w-[200px]">IDS Field</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fieldMappings.map((mapping, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-sm bg-amber-50">
                        {mapping.csvColumn}
                      </TableCell>
                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                      <TableCell className="font-mono text-sm bg-blue-50">
                        {mapping.idsField}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {mapping.notes}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Validation Rules */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Validation Rules
              </CardTitle>
              <CardDescription>
                Rules applied during CSV import to ensure data quality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[200px]">Field</TableHead>
                    <TableHead>Validation</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-mono text-sm">mobilityType</TableCell>
                    <TableCell className="text-sm">Must be one of: AMB, WC, STR (case-insensitive)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">pickup.state</TableCell>
                    <TableCell className="text-sm">Must be exactly 2 characters (e.g., VA, MD, DC)</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">pickup.zip</TableCell>
                    <TableCell className="text-sm">Must be 5 digits or 5+4 format</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">pickupWindow.earliest</TableCell>
                    <TableCell className="text-sm">Parsed as time (HH:MM or HH:MM:SS), combined with service date</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-mono text-sm">tripDate</TableCell>
                    <TableCell className="text-sm">Must be valid date in YYYY-MM-DD, MM/DD/YYYY, or M/D/YYYY format</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
