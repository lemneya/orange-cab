/**
 * IDS Actual Import Service
 * Handles import of completed trips from MediRoute CSV exports
 * 
 * CRITICAL: PHI Stripping
 * - NO patient names, phones, DOB, or full addresses stored
 * - Only trip IDs, driver names, vehicle units, GPS coords, and timestamps
 */

import { createHash } from "crypto";

// ============================================================================
// PHI Fields to Strip (never store these)
// ============================================================================

const PHI_FIELDS = [
  "patient", "member", "membername", "patientname", "name",
  "phone", "memberphone", "patientphone", "telephone",
  "dob", "dateofbirth", "birthdate", "birthday",
  "address", "pickupaddress", "dropoffaddress", "pickup_address", "dropoff_address",
  "street", "pickupstreet", "dropoffstreet",
  "ssn", "socialsecurity", "medicaid", "medicare",
  "email", "memberemail",
];

// ============================================================================
// Types
// ============================================================================

export interface ActualTripRow {
  tripId: string;
  serviceDate: string;
  driverName: string;
  vehicleUnit: string | null;
  mobilityType: string;
  tripType: string | null; // A (appointment) or W (will-call)
  schedPickupTime: string | null;
  appointmentTime: string | null;
  actualPickupArrive: string | null;
  actualPickupPerform: string | null;
  actualDropoffArrive: string | null;
  actualDropoffPerform: string | null;
  milesActual: number | null;
  pickupLat: number | null;
  pickupLon: number | null;
  dropoffLat: number | null;
  dropoffLon: number | null;
  status: "completed" | "cancelled" | "no_show";
  isCancelled: boolean;
  isNoShow: boolean;
  isStanding: boolean;
  isWillCall: boolean;
  wasOnTime: boolean | null;
}

export interface ImportResult {
  success: boolean;
  importId: number;
  fileHash: string;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  accountedRows: number;
  isComplete: boolean;
  serviceDateFrom: string | null;
  serviceDateTo: string | null;
  errors: { row: number; message: string }[];
  warnings: string[];
  phiFieldsStripped: string[];
}

export interface ImportPreview {
  fileHash: string;
  totalRows: number;
  columns: string[];
  phiFieldsDetected: string[];
  safeFieldsDetected: string[];
  sampleRows: Record<string, string>[];
  serviceDateRange: { from: string; to: string } | null;
  driverNames: string[];
  vehicleUnits: string[];
  mobilityTypes: string[];
}

// ============================================================================
// In-Memory Storage (will be replaced with DB)
// ============================================================================

interface StoredImport {
  id: number;
  fileHash: string;
  fileName: string | null;
  fileSize: number;
  totalRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  serviceDateFrom: string | null;
  serviceDateTo: string | null;
  accountedRows: number;
  isComplete: boolean;
  importedAt: string;
}

interface StoredActualTrip extends ActualTripRow {
  id: number;
  importId: number;
  createdAt: string;
}

let importCounter = 0;
let tripCounter = 0;
const importStorage: Map<number, StoredImport> = new Map();
const importHashIndex: Map<string, number> = new Map(); // fileHash -> importId
const actualTripStorage: Map<number, StoredActualTrip> = new Map();

// ============================================================================
// CSV Parsing Helpers
// ============================================================================

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());

  return result;
}

function normalizeColumnName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function computeFileHash(content: string): string {
  return createHash("sha256").update(content).digest("hex");
}

function parseTime(timeStr: string | undefined | null): string | null {
  if (!timeStr || timeStr.trim() === "") return null;
  
  // Handle various time formats
  const cleaned = timeStr.trim();
  
  // Already in HH:MM:SS format
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleaned)) {
    const parts = cleaned.split(":");
    const hours = parts[0].padStart(2, "0");
    const mins = parts[1].padStart(2, "0");
    const secs = parts[2]?.padStart(2, "0") || "00";
    return `${hours}:${mins}:${secs}`;
  }
  
  // Handle AM/PM format
  const ampmMatch = cleaned.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = ampmMatch[2];
    const secs = ampmMatch[3] || "00";
    const ampm = ampmMatch[4].toUpperCase();
    
    if (ampm === "PM" && hours < 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
    
    return `${hours.toString().padStart(2, "0")}:${mins}:${secs}`;
  }
  
  return null;
}

function parseDate(dateStr: string | undefined | null): string | null {
  if (!dateStr || dateStr.trim() === "") return null;
  
  const cleaned = dateStr.trim();
  
  // Handle MM/DD/YYYY format
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0");
    const day = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }
  
  // Handle YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }
  
  return null;
}

function parseNumber(numStr: string | undefined | null): number | null {
  if (!numStr || numStr.trim() === "") return null;
  const parsed = parseFloat(numStr.trim());
  return isNaN(parsed) ? null : parsed;
}

function computeOnTime(
  schedTime: string | null,
  actualTime: string | null,
  windowMinutes: number = 15
): boolean | null {
  if (!schedTime || !actualTime) return null;
  
  const [schedH, schedM] = schedTime.split(":").map(Number);
  const [actualH, actualM] = actualTime.split(":").map(Number);
  
  const schedMinutes = schedH * 60 + schedM;
  const actualMinutes = actualH * 60 + actualM;
  
  // On-time if within window (early is OK, late by > windowMinutes is not)
  return actualMinutes <= schedMinutes + windowMinutes;
}

// ============================================================================
// Import Service
// ============================================================================

export class ActualImportService {
  /**
   * Preview CSV before import - shows what will be imported and PHI that will be stripped
   */
  async previewCSV(csvContent: string): Promise<ImportPreview> {
    const fileHash = computeFileHash(csvContent);
    const lines = csvContent.trim().split("\n");
    
    if (lines.length < 2) {
      throw new Error("CSV must have header row and at least one data row");
    }
    
    const headers = parseCSVLine(lines[0]);
    const normalizedHeaders = headers.map(normalizeColumnName);
    
    // Detect PHI fields
    const phiFieldsDetected: string[] = [];
    const safeFieldsDetected: string[] = [];
    
    for (let i = 0; i < headers.length; i++) {
      const normalized = normalizedHeaders[i];
      if (PHI_FIELDS.some(phi => normalized.includes(phi))) {
        phiFieldsDetected.push(headers[i]);
      } else {
        safeFieldsDetected.push(headers[i]);
      }
    }
    
    // Parse sample rows (first 5)
    const sampleRows: Record<string, string>[] = [];
    const dates: string[] = [];
    const drivers = new Set<string>();
    const vehicles = new Set<string>();
    const mobilities = new Set<string>();
    
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      
      for (let j = 0; j < headers.length; j++) {
        // Mask PHI fields in preview
        const normalized = normalizedHeaders[j];
        if (PHI_FIELDS.some(phi => normalized.includes(phi))) {
          row[headers[j]] = "[PHI STRIPPED]";
        } else {
          row[headers[j]] = values[j] || "";
        }
      }
      
      sampleRows.push(row);
    }
    
    // Scan all rows for metadata
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      normalizedHeaders.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      
      // Extract date
      const dateVal = row["date"] || row["servicedate"] || row["tripdate"];
      const parsedDate = parseDate(dateVal);
      if (parsedDate) dates.push(parsedDate);
      
      // Extract driver
      const driverVal = row["driver"] || row["drivername"];
      if (driverVal) drivers.add(driverVal);
      
      // Extract vehicle
      const vehicleVal = row["vehicle"] || row["vehicleunit"] || row["unit"];
      if (vehicleVal) vehicles.add(vehicleVal);
      
      // Extract mobility type
      const mobVal = row["type"] || row["mobilitytype"] || row["space"];
      if (mobVal) mobilities.add(mobVal);
    }
    
    // Compute date range
    let serviceDateRange: { from: string; to: string } | null = null;
    if (dates.length > 0) {
      dates.sort();
      serviceDateRange = {
        from: dates[0],
        to: dates[dates.length - 1],
      };
    }
    
    return {
      fileHash,
      totalRows: lines.length - 1,
      columns: headers,
      phiFieldsDetected,
      safeFieldsDetected,
      sampleRows,
      serviceDateRange,
      driverNames: Array.from(drivers).slice(0, 20),
      vehicleUnits: Array.from(vehicles).slice(0, 20),
      mobilityTypes: Array.from(mobilities),
    };
  }
  
  /**
   * Check if file was already imported (idempotency)
   */
  async checkDuplicate(fileHash: string): Promise<{ isDuplicate: boolean; importId?: number }> {
    const existingId = importHashIndex.get(fileHash);
    if (existingId) {
      return { isDuplicate: true, importId: existingId };
    }
    return { isDuplicate: false };
  }
  
  /**
   * Import CSV with PHI stripping
   */
  async importCSV(
    csvContent: string,
    fileName?: string
  ): Promise<ImportResult> {
    const fileHash = computeFileHash(csvContent);
    
    // Check for duplicate
    const duplicate = await this.checkDuplicate(fileHash);
    if (duplicate.isDuplicate) {
      const existing = importStorage.get(duplicate.importId!);
      return {
        success: false,
        importId: duplicate.importId!,
        fileHash,
        totalRows: existing?.totalRows || 0,
        importedRows: 0,
        skippedRows: existing?.totalRows || 0,
        errorRows: 0,
        accountedRows: existing?.totalRows || 0,
        isComplete: false,
        serviceDateFrom: existing?.serviceDateFrom || null,
        serviceDateTo: existing?.serviceDateTo || null,
        errors: [{ row: 0, message: "File already imported (duplicate hash)" }],
        warnings: ["This file was previously imported. Skipping to prevent duplicates."],
        phiFieldsStripped: [],
      };
    }
    
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have header row and at least one data row");
    }
    
    const headers = parseCSVLine(lines[0]);
    const normalizedHeaders = headers.map(normalizeColumnName);
    
    // Build column index map
    const colIndex: Record<string, number> = {};
    normalizedHeaders.forEach((h, i) => {
      colIndex[h] = i;
    });
    
    // Track PHI fields stripped
    const phiFieldsStripped = new Set<string>();
    for (let i = 0; i < headers.length; i++) {
      const normalized = normalizedHeaders[i];
      if (PHI_FIELDS.some(phi => normalized.includes(phi))) {
        phiFieldsStripped.add(headers[i]);
      }
    }
    
    // Helper to get column value
    const getCol = (values: string[], ...names: string[]): string | null => {
      for (const name of names) {
        const idx = colIndex[name];
        if (idx !== undefined && values[idx]) {
          return values[idx];
        }
      }
      return null;
    };
    
    // Parse rows
    const errors: { row: number; message: string }[] = [];
    const warnings: string[] = [];
    const trips: ActualTripRow[] = [];
    const dates: string[] = [];
    
    let importedRows = 0;
    let skippedRows = 0;
    let errorRows = 0;
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      // Skip empty rows
      if (values.every(v => !v.trim())) {
        skippedRows++;
        continue;
      }
      
      try {
        // Required fields
        const tripId = getCol(values, "tripid", "trip_id", "id");
        const dateStr = getCol(values, "date", "servicedate", "tripdate");
        const driverName = getCol(values, "driver", "drivername", "driver_name");
        
        if (!tripId || !dateStr || !driverName) {
          errors.push({ row: i + 1, message: "Missing required field: Trip ID, Date, or Driver" });
          errorRows++;
          continue;
        }
        
        const serviceDate = parseDate(dateStr);
        if (!serviceDate) {
          errors.push({ row: i + 1, message: `Invalid date format: ${dateStr}` });
          errorRows++;
          continue;
        }
        
        dates.push(serviceDate);
        
        // Parse mobility type
        const typeRaw = getCol(values, "type", "mobilitytype", "space") || "AMB";
        let mobilityType = "AMB";
        if (typeRaw.toUpperCase().includes("WC") || typeRaw.toUpperCase().includes("WHEEL")) {
          mobilityType = "WC";
        } else if (typeRaw.toUpperCase().includes("STR")) {
          mobilityType = "STR";
        }
        
        // Parse trip type (A = appointment, W = will-call)
        const tripTypeRaw = getCol(values, "type", "triptype");
        let tripType: string | null = null;
        if (tripTypeRaw?.toUpperCase().startsWith("A")) tripType = "A";
        if (tripTypeRaw?.toUpperCase().startsWith("W")) tripType = "W";
        
        // Parse times
        const schedPickupTime = parseTime(getCol(values, "reqpickup", "req_pickup", "scheduledpickup", "pickuptime"));
        const appointmentTime = parseTime(getCol(values, "appointment", "appointmenttime", "appt"));
        const actualPickupArrive = parseTime(getCol(values, "pickuparrive", "pickup_arrive", "actualpickuparrive"));
        const actualPickupPerform = parseTime(getCol(values, "pickupperform", "pickup_perform", "actualpickupperform"));
        const actualDropoffArrive = parseTime(getCol(values, "dropoffarrive", "dropoff_arrive", "actualdropoffarrive"));
        const actualDropoffPerform = parseTime(getCol(values, "dropoffperform", "dropoff_perform", "actualdropoffperform"));
        
        // Parse miles (SSOT: Routed Distance preferred, else Distance)
        const routedDistance = parseNumber(getCol(values, "routeddistance", "routed_distance"));
        const distance = parseNumber(getCol(values, "distance", "miles", "importdistance"));
        const milesActual = routedDistance ?? distance;
        
        // Parse GPS coordinates
        const pickupLat = parseNumber(getCol(values, "pickuplat", "pickup_lat", "pickuplatitude"));
        const pickupLon = parseNumber(getCol(values, "pickuplon", "pickup_lon", "pickuplongitude"));
        const dropoffLat = parseNumber(getCol(values, "dropofflat", "dropoff_lat", "dropofflatitude"));
        const dropoffLon = parseNumber(getCol(values, "dropofflon", "dropoff_lon", "dropofflongitude"));
        
        // Parse status flags
        const statusRaw = getCol(values, "status", "tripstatus") || "completed";
        const isCancelled = statusRaw.toLowerCase().includes("cancel");
        const isNoShow = statusRaw.toLowerCase().includes("no") && statusRaw.toLowerCase().includes("show");
        const isStanding = getCol(values, "standing")?.toLowerCase() === "yes" || 
                          getCol(values, "standing")?.toLowerCase() === "true" ||
                          getCol(values, "standing") === "1";
        const isWillCall = getCol(values, "willcall", "will_call")?.toLowerCase() === "yes" ||
                          getCol(values, "willcall", "will_call")?.toLowerCase() === "true" ||
                          getCol(values, "willcall", "will_call") === "1" ||
                          tripType === "W";
        
        let status: "completed" | "cancelled" | "no_show" = "completed";
        if (isCancelled) status = "cancelled";
        if (isNoShow) status = "no_show";
        
        // Compute on-time
        const schedTime = schedPickupTime || appointmentTime;
        const actualTime = actualPickupArrive || actualPickupPerform;
        const wasOnTime = computeOnTime(schedTime, actualTime);
        
        const trip: ActualTripRow = {
          tripId,
          serviceDate,
          driverName,
          vehicleUnit: getCol(values, "vehicle", "vehicleunit", "unit"),
          mobilityType,
          tripType,
          schedPickupTime,
          appointmentTime,
          actualPickupArrive,
          actualPickupPerform,
          actualDropoffArrive,
          actualDropoffPerform,
          milesActual,
          pickupLat,
          pickupLon,
          dropoffLat,
          dropoffLon,
          status,
          isCancelled,
          isNoShow,
          isStanding,
          isWillCall,
          wasOnTime,
        };
        
        trips.push(trip);
        importedRows++;
        
      } catch (err) {
        errors.push({ row: i + 1, message: `Parse error: ${err}` });
        errorRows++;
      }
    }
    
    // Store import audit
    const importId = ++importCounter;
    const totalRows = lines.length - 1;
    const accountedRows = importedRows + skippedRows + errorRows;
    const isComplete = accountedRows === totalRows;
    
    dates.sort();
    const serviceDateFrom = dates.length > 0 ? dates[0] : null;
    const serviceDateTo = dates.length > 0 ? dates[dates.length - 1] : null;
    
    const importRecord: StoredImport = {
      id: importId,
      fileHash,
      fileName: fileName || null,
      fileSize: csvContent.length,
      totalRows,
      importedRows,
      skippedRows,
      errorRows,
      serviceDateFrom,
      serviceDateTo,
      accountedRows,
      isComplete,
      importedAt: new Date().toISOString(),
    };
    
    importStorage.set(importId, importRecord);
    importHashIndex.set(fileHash, importId);
    
    // Store trips
    for (const trip of trips) {
      const id = ++tripCounter;
      const storedTrip: StoredActualTrip = {
        ...trip,
        id,
        importId,
        createdAt: new Date().toISOString(),
      };
      actualTripStorage.set(id, storedTrip);
    }
    
    // "Nothing dropped" check
    if (!isComplete) {
      warnings.push(`WARNING: accountedRows (${accountedRows}) != totalRows (${totalRows}). Some rows may have been lost.`);
    }
    
    console.log("[IDS Actual Import] Import completed:", {
      importId,
      fileHash: fileHash.substring(0, 16) + "...",
      totalRows,
      importedRows,
      skippedRows,
      errorRows,
      accountedRows,
      isComplete,
      phiFieldsStripped: Array.from(phiFieldsStripped),
    });
    
    return {
      success: true,
      importId,
      fileHash,
      totalRows,
      importedRows,
      skippedRows,
      errorRows,
      accountedRows,
      isComplete,
      serviceDateFrom,
      serviceDateTo,
      errors,
      warnings,
      phiFieldsStripped: Array.from(phiFieldsStripped),
    };
  }
  
  /**
   * Get import audit by ID
   */
  async getImportById(importId: number): Promise<StoredImport | null> {
    return importStorage.get(importId) || null;
  }
  
  /**
   * Get all imports
   */
  async getImports(): Promise<StoredImport[]> {
    return Array.from(importStorage.values())
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  }
  
  /**
   * Get actual trips for a service date
   */
  async getActualTripsByDate(serviceDate: string): Promise<StoredActualTrip[]> {
    return Array.from(actualTripStorage.values())
      .filter(t => t.serviceDate === serviceDate);
  }
  
  /**
   * Get actual trips by driver for a service date
   */
  async getActualTripsByDriverAndDate(
    driverName: string,
    serviceDate: string
  ): Promise<StoredActualTrip[]> {
    return Array.from(actualTripStorage.values())
      .filter(t => 
        t.serviceDate === serviceDate && 
        t.driverName.toLowerCase() === driverName.toLowerCase()
      );
  }
  
  /**
   * Get driver summary for a service date
   */
  async getDriverSummaryByDate(serviceDate: string): Promise<{
    driverName: string;
    totalTrips: number;
    completedTrips: number;
    cancelledTrips: number;
    noShowTrips: number;
    totalMiles: number;
    onTimeCount: number;
    onTimePercent: number;
  }[]> {
    const trips = await this.getActualTripsByDate(serviceDate);
    
    const driverMap = new Map<string, {
      totalTrips: number;
      completedTrips: number;
      cancelledTrips: number;
      noShowTrips: number;
      totalMiles: number;
      onTimeCount: number;
      tripsWithOnTimeData: number;
    }>();
    
    for (const trip of trips) {
      let data = driverMap.get(trip.driverName);
      if (!data) {
        data = {
          totalTrips: 0,
          completedTrips: 0,
          cancelledTrips: 0,
          noShowTrips: 0,
          totalMiles: 0,
          onTimeCount: 0,
          tripsWithOnTimeData: 0,
        };
        driverMap.set(trip.driverName, data);
      }
      
      data.totalTrips++;
      if (trip.status === "completed") data.completedTrips++;
      if (trip.isCancelled) data.cancelledTrips++;
      if (trip.isNoShow) data.noShowTrips++;
      if (trip.milesActual) data.totalMiles += trip.milesActual;
      if (trip.wasOnTime !== null) {
        data.tripsWithOnTimeData++;
        if (trip.wasOnTime) data.onTimeCount++;
      }
    }
    
    return Array.from(driverMap.entries()).map(([driverName, data]) => ({
      driverName,
      totalTrips: data.totalTrips,
      completedTrips: data.completedTrips,
      cancelledTrips: data.cancelledTrips,
      noShowTrips: data.noShowTrips,
      totalMiles: Math.round(data.totalMiles * 10) / 10,
      onTimeCount: data.onTimeCount,
      onTimePercent: data.tripsWithOnTimeData > 0 
        ? Math.round((data.onTimeCount / data.tripsWithOnTimeData) * 100)
        : 0,
    }));
  }
}

// ============================================================================
// Singleton
// ============================================================================

let actualImportServiceInstance: ActualImportService | null = null;

export function getActualImportService(): ActualImportService {
  if (!actualImportServiceInstance) {
    actualImportServiceInstance = new ActualImportService();
  }
  return actualImportServiceInstance;
}

export function resetActualImportService(): void {
  actualImportServiceInstance = null;
  importStorage.clear();
  importHashIndex.clear();
  actualTripStorage.clear();
  importCounter = 0;
  tripCounter = 0;
}
