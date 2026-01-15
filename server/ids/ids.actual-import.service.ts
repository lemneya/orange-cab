/**
 * IDS Actual Import Service
 * Handles import of completed trips from MediRoute CSV exports
 * 
 * CRITICAL: PHI Protection via ALLOWLIST
 * - ONLY fields in ALLOWED_COLUMNS are extracted
 * - All other fields are ignored (never read, never stored)
 * - This protects against new PHI columns added by vendors
 */

import { createHash } from "crypto";

// ============================================================================
// ALLOWLIST: Only these columns are extracted (PHI-safe by design)
// ============================================================================

/**
 * ALLOWED_COLUMNS defines the ONLY fields we extract from CSV.
 * Any column not in this list is completely ignored.
 * This is the ALLOWLIST pattern - safer than blocklist because:
 * - New PHI columns added by vendors are automatically ignored
 * - We explicitly define what we need, not what we don't want
 */
const ALLOWED_COLUMNS = {
  // Trip identification (required)
  tripId: ["tripid", "trip_id", "id"],
  serviceDate: ["date", "servicedate", "tripdate"],
  driverName: ["driver", "drivername", "driver_name"],
  
  // Vehicle and mobility (optional)
  vehicleUnit: ["vehicle", "vehicleunit", "unit"],
  mobilityType: ["type", "mobilitytype", "space"],
  tripType: ["type", "triptype"],
  
  // Scheduled times (optional)
  schedPickupTime: ["reqpickup", "req_pickup", "scheduledpickup", "pickuptime"],
  appointmentTime: ["appointment", "appointmenttime", "appt"],
  
  // Actual times (optional)
  actualPickupArrive: ["pickuparrive", "pickup_arrive", "actualpickuparrive"],
  actualPickupPerform: ["pickupperform", "pickup_perform", "actualpickupperform"],
  actualDropoffArrive: ["dropoffarrive", "dropoff_arrive", "actualdropoffarrive"],
  actualDropoffPerform: ["dropoffperform", "dropoff_perform", "actualdropoffperform"],
  
  // Miles (optional) - SSOT: Routed Distance preferred
  routedDistance: ["routeddistance", "routed_distance"],
  distance: ["distance", "miles", "importdistance"],
  
  // GPS coordinates (optional) - for template mining
  pickupLat: ["pickuplat", "pickup_lat", "pickuplatitude"],
  pickupLon: ["pickuplon", "pickup_lon", "pickuplongitude"],
  dropoffLat: ["dropofflat", "dropoff_lat", "dropofflatitude"],
  dropoffLon: ["dropofflon", "dropoff_lon", "dropofflongitude"],
  
  // Status flags (optional)
  status: ["status", "tripstatus"],
  standing: ["standing"],
  willCall: ["willcall", "will_call"],
} as const;

// Flatten all allowed column names for quick lookup
const ALL_ALLOWED_COLUMNS = new Set(
  Object.values(ALLOWED_COLUMNS).flat()
);

// ============================================================================
// Types
// ============================================================================

export interface ActualTripRow {
  tripId: string;
  serviceDate: string;
  driverName: string;
  vehicleUnit: string | null;
  mobilityType: string;
  tripType: string | null;
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
  expectedRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  accountedRows: number;
  missingRows: number[];
  isComplete: boolean;
  serviceDateFrom: string | null;
  serviceDateTo: string | null;
  errors: { row: number; message: string }[];
  warnings: string[];
  ignoredColumns: string[];
  extractedColumns: string[];
}

export interface ImportPreview {
  fileHash: string;
  totalRows: number;
  columns: string[];
  allowedColumns: string[];
  ignoredColumns: string[];
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
  expectedRows: number;
  importedRows: number;
  skippedRows: number;
  errorRows: number;
  accountedRows: number;
  missingRows: number[];
  serviceDateFrom: string | null;
  serviceDateTo: string | null;
  isComplete: boolean;
  ignoredColumns: string[];
  extractedColumns: string[];
  importedAt: string;
}

interface StoredActualTrip extends ActualTripRow {
  id: number;
  importId: number;
  createdAt: string;
}

// Driver alias mapping for Compare join robustness
interface DriverAlias {
  canonical: string;
  aliases: string[];
}

let importCounter = 0;
let tripCounter = 0;
const importStorage: Map<number, StoredImport> = new Map();
const importHashIndex: Map<string, number> = new Map();
const actualTripStorage: Map<number, StoredActualTrip> = new Map();
const driverAliasStorage: Map<string, DriverAlias> = new Map();

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
  
  const cleaned = timeStr.trim();
  
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(cleaned)) {
    const parts = cleaned.split(":");
    const hours = parts[0].padStart(2, "0");
    const mins = parts[1].padStart(2, "0");
    const secs = parts[2]?.padStart(2, "0") || "00";
    return `${hours}:${mins}:${secs}`;
  }
  
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
  
  const slashMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1].padStart(2, "0");
    const day = slashMatch[2].padStart(2, "0");
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }
  
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
  
  return actualMinutes <= schedMinutes + windowMinutes;
}

// Normalize driver name for matching
function normalizeDriverName(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, " ");
}

// ============================================================================
// Import Service
// ============================================================================

export class ActualImportService {
  /**
   * Preview CSV before import - shows what will be imported
   * Uses ALLOWLIST pattern: only shows allowed columns, marks others as ignored
   */
  async previewCSV(csvContent: string): Promise<ImportPreview> {
    const fileHash = computeFileHash(csvContent);
    const lines = csvContent.trim().split("\n");
    
    if (lines.length < 2) {
      throw new Error("CSV must have header row and at least one data row");
    }
    
    const headers = parseCSVLine(lines[0]);
    const normalizedHeaders = headers.map(normalizeColumnName);
    
    // Categorize columns using ALLOWLIST
    const allowedColumns: string[] = [];
    const ignoredColumns: string[] = [];
    
    for (let i = 0; i < headers.length; i++) {
      const normalized = normalizedHeaders[i];
      if (ALL_ALLOWED_COLUMNS.has(normalized)) {
        allowedColumns.push(headers[i]);
      } else {
        ignoredColumns.push(headers[i]);
      }
    }
    
    // Parse sample rows (first 5) - only show allowed columns
    const sampleRows: Record<string, string>[] = [];
    const dates: string[] = [];
    const drivers = new Set<string>();
    const vehicles = new Set<string>();
    const mobilities = new Set<string>();
    
    // Build column index for allowed columns only
    const colIndex: Record<string, number> = {};
    normalizedHeaders.forEach((h, i) => {
      if (ALL_ALLOWED_COLUMNS.has(h)) {
        colIndex[h] = i;
      }
    });
    
    const getCol = (values: string[], ...names: string[]): string | null => {
      for (const name of names) {
        const idx = colIndex[name];
        if (idx !== undefined && values[idx]) {
          return values[idx];
        }
      }
      return null;
    };
    
    for (let i = 1; i < Math.min(lines.length, 6); i++) {
      const values = parseCSVLine(lines[i]);
      const row: Record<string, string> = {};
      
      // Only include allowed columns in preview
      for (let j = 0; j < headers.length; j++) {
        const normalized = normalizedHeaders[j];
        if (ALL_ALLOWED_COLUMNS.has(normalized)) {
          row[headers[j]] = values[j] || "";
        } else {
          row[headers[j]] = "[IGNORED - not in allowlist]";
        }
      }
      
      sampleRows.push(row);
    }
    
    // Scan all rows for metadata (only from allowed columns)
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      const dateVal = getCol(values, ...ALLOWED_COLUMNS.serviceDate);
      const parsedDate = parseDate(dateVal);
      if (parsedDate) dates.push(parsedDate);
      
      const driverVal = getCol(values, ...ALLOWED_COLUMNS.driverName);
      if (driverVal) drivers.add(driverVal);
      
      const vehicleVal = getCol(values, ...ALLOWED_COLUMNS.vehicleUnit);
      if (vehicleVal) vehicles.add(vehicleVal);
      
      const mobVal = getCol(values, ...ALLOWED_COLUMNS.mobilityType);
      if (mobVal) mobilities.add(mobVal);
    }
    
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
      allowedColumns,
      ignoredColumns,
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
   * Import CSV using ALLOWLIST pattern
   * ONLY extracts fields defined in ALLOWED_COLUMNS
   * All other columns are completely ignored (never read into memory)
   */
  async importCSV(
    csvContent: string,
    fileName?: string
  ): Promise<ImportResult> {
    const fileHash = computeFileHash(csvContent);
    
    // Check for duplicate (idempotency)
    const duplicate = await this.checkDuplicate(fileHash);
    if (duplicate.isDuplicate) {
      const existing = importStorage.get(duplicate.importId!);
      return {
        success: false,
        importId: duplicate.importId!,
        fileHash,
        totalRows: existing?.totalRows || 0,
        expectedRows: existing?.expectedRows || 0,
        importedRows: 0,
        skippedRows: existing?.totalRows || 0,
        errorRows: 0,
        accountedRows: existing?.totalRows || 0,
        missingRows: [],
        isComplete: false,
        serviceDateFrom: existing?.serviceDateFrom || null,
        serviceDateTo: existing?.serviceDateTo || null,
        errors: [{ row: 0, message: "File already imported (duplicate hash)" }],
        warnings: ["This file was previously imported. Skipping to prevent duplicates."],
        ignoredColumns: existing?.ignoredColumns || [],
        extractedColumns: existing?.extractedColumns || [],
      };
    }
    
    const lines = csvContent.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have header row and at least one data row");
    }
    
    const headers = parseCSVLine(lines[0]);
    const normalizedHeaders = headers.map(normalizeColumnName);
    
    // Build column index for ALLOWED columns only
    const colIndex: Record<string, number> = {};
    const ignoredColumns: string[] = [];
    const extractedColumns: string[] = [];
    
    normalizedHeaders.forEach((h, i) => {
      if (ALL_ALLOWED_COLUMNS.has(h)) {
        colIndex[h] = i;
        extractedColumns.push(headers[i]);
      } else {
        ignoredColumns.push(headers[i]);
      }
    });
    
    // Helper to get column value (only from allowed columns)
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
    const processedRows = new Set<number>();
    
    let importedRows = 0;
    let skippedRows = 0;
    let errorRows = 0;
    const expectedRows = lines.length - 1;
    
    for (let i = 1; i < lines.length; i++) {
      const rowNum = i;
      processedRows.add(rowNum);
      
      const values = parseCSVLine(lines[i]);
      
      // Skip empty rows
      if (values.every(v => !v.trim())) {
        skippedRows++;
        continue;
      }
      
      try {
        // Required fields (from ALLOWLIST only)
        const tripId = getCol(values, ...ALLOWED_COLUMNS.tripId);
        const dateStr = getCol(values, ...ALLOWED_COLUMNS.serviceDate);
        const driverName = getCol(values, ...ALLOWED_COLUMNS.driverName);
        
        if (!tripId || !dateStr || !driverName) {
          errors.push({ row: rowNum + 1, message: "Missing required field: Trip ID, Date, or Driver" });
          errorRows++;
          continue;
        }
        
        const serviceDate = parseDate(dateStr);
        if (!serviceDate) {
          errors.push({ row: rowNum + 1, message: `Invalid date format: ${dateStr}` });
          errorRows++;
          continue;
        }
        
        dates.push(serviceDate);
        
        // Parse mobility type
        const typeRaw = getCol(values, ...ALLOWED_COLUMNS.mobilityType) || "AMB";
        let mobilityType = "AMB";
        if (typeRaw.toUpperCase().includes("WC") || typeRaw.toUpperCase().includes("WHEEL")) {
          mobilityType = "WC";
        } else if (typeRaw.toUpperCase().includes("STR")) {
          mobilityType = "STR";
        }
        
        // Parse trip type
        const tripTypeRaw = getCol(values, ...ALLOWED_COLUMNS.tripType);
        let tripType: string | null = null;
        if (tripTypeRaw?.toUpperCase().startsWith("A")) tripType = "A";
        if (tripTypeRaw?.toUpperCase().startsWith("W")) tripType = "W";
        
        // Parse times
        const schedPickupTime = parseTime(getCol(values, ...ALLOWED_COLUMNS.schedPickupTime));
        const appointmentTime = parseTime(getCol(values, ...ALLOWED_COLUMNS.appointmentTime));
        const actualPickupArrive = parseTime(getCol(values, ...ALLOWED_COLUMNS.actualPickupArrive));
        const actualPickupPerform = parseTime(getCol(values, ...ALLOWED_COLUMNS.actualPickupPerform));
        const actualDropoffArrive = parseTime(getCol(values, ...ALLOWED_COLUMNS.actualDropoffArrive));
        const actualDropoffPerform = parseTime(getCol(values, ...ALLOWED_COLUMNS.actualDropoffPerform));
        
        // Parse miles (SSOT: Routed Distance preferred)
        const routedDistance = parseNumber(getCol(values, ...ALLOWED_COLUMNS.routedDistance));
        const distance = parseNumber(getCol(values, ...ALLOWED_COLUMNS.distance));
        const milesActual = routedDistance ?? distance;
        
        // Parse GPS coordinates
        const pickupLat = parseNumber(getCol(values, ...ALLOWED_COLUMNS.pickupLat));
        const pickupLon = parseNumber(getCol(values, ...ALLOWED_COLUMNS.pickupLon));
        const dropoffLat = parseNumber(getCol(values, ...ALLOWED_COLUMNS.dropoffLat));
        const dropoffLon = parseNumber(getCol(values, ...ALLOWED_COLUMNS.dropoffLon));
        
        // Parse status flags
        const statusRaw = getCol(values, ...ALLOWED_COLUMNS.status) || "completed";
        const isCancelled = statusRaw.toLowerCase().includes("cancel");
        const isNoShow = statusRaw.toLowerCase().includes("no") && statusRaw.toLowerCase().includes("show");
        const isStanding = getCol(values, ...ALLOWED_COLUMNS.standing)?.toLowerCase() === "yes" || 
                          getCol(values, ...ALLOWED_COLUMNS.standing)?.toLowerCase() === "true" ||
                          getCol(values, ...ALLOWED_COLUMNS.standing) === "1";
        const isWillCall = getCol(values, ...ALLOWED_COLUMNS.willCall)?.toLowerCase() === "yes" ||
                          getCol(values, ...ALLOWED_COLUMNS.willCall)?.toLowerCase() === "true" ||
                          getCol(values, ...ALLOWED_COLUMNS.willCall) === "1" ||
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
          vehicleUnit: getCol(values, ...ALLOWED_COLUMNS.vehicleUnit),
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
        errors.push({ row: rowNum + 1, message: `Parse error: ${err}` });
        errorRows++;
      }
    }
    
    // "Nothing dropped" proof
    const accountedRows = importedRows + skippedRows + errorRows;
    const missingRows: number[] = [];
    for (let i = 1; i <= expectedRows; i++) {
      if (!processedRows.has(i)) {
        missingRows.push(i);
      }
    }
    const isComplete = accountedRows === expectedRows && missingRows.length === 0;
    
    dates.sort();
    const serviceDateFrom = dates.length > 0 ? dates[0] : null;
    const serviceDateTo = dates.length > 0 ? dates[dates.length - 1] : null;
    
    // Store import audit
    const importId = ++importCounter;
    
    const importRecord: StoredImport = {
      id: importId,
      fileHash,
      fileName: fileName || null,
      fileSize: csvContent.length,
      totalRows: lines.length - 1,
      expectedRows,
      importedRows,
      skippedRows,
      errorRows,
      accountedRows,
      missingRows,
      serviceDateFrom,
      serviceDateTo,
      isComplete,
      ignoredColumns,
      extractedColumns,
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
      
      // Auto-register driver alias
      this.registerDriverAlias(trip.driverName);
    }
    
    // "Nothing dropped" warning
    if (!isComplete) {
      warnings.push(`WARNING: accountedRows (${accountedRows}) != expectedRows (${expectedRows}). Missing rows: ${missingRows.join(", ")}`);
    }
    
    // Log ignored columns warning
    if (ignoredColumns.length > 0) {
      warnings.push(`SECURITY: ${ignoredColumns.length} columns ignored (not in allowlist): ${ignoredColumns.join(", ")}`);
    }
    
    console.log("[IDS Actual Import] Import completed:", {
      importId,
      fileHash: fileHash.substring(0, 16) + "...",
      expectedRows,
      accountedRows,
      importedRows,
      skippedRows,
      errorRows,
      missingRows,
      isComplete,
      ignoredColumns,
      extractedColumns,
    });
    
    return {
      success: true,
      importId,
      fileHash,
      totalRows: lines.length - 1,
      expectedRows,
      importedRows,
      skippedRows,
      errorRows,
      accountedRows,
      missingRows,
      isComplete,
      serviceDateFrom,
      serviceDateTo,
      errors,
      warnings,
      ignoredColumns,
      extractedColumns,
    };
  }
  
  // ============================================================================
  // Driver Alias Management (for Compare join robustness)
  // ============================================================================
  
  /**
   * Register a driver name as an alias
   */
  registerDriverAlias(driverName: string): void {
    const normalized = normalizeDriverName(driverName);
    
    if (!driverAliasStorage.has(normalized)) {
      driverAliasStorage.set(normalized, {
        canonical: driverName,
        aliases: [driverName],
      });
    } else {
      const existing = driverAliasStorage.get(normalized)!;
      if (!existing.aliases.includes(driverName)) {
        existing.aliases.push(driverName);
      }
    }
  }
  
  /**
   * Add a manual alias mapping
   */
  addDriverAlias(canonical: string, alias: string): void {
    const normalizedCanonical = normalizeDriverName(canonical);
    const normalizedAlias = normalizeDriverName(alias);
    
    // Get or create canonical entry
    let entry = driverAliasStorage.get(normalizedCanonical);
    if (!entry) {
      entry = { canonical, aliases: [canonical] };
      driverAliasStorage.set(normalizedCanonical, entry);
    }
    
    // Add alias
    if (!entry.aliases.includes(alias)) {
      entry.aliases.push(alias);
    }
    
    // Also map the alias to the canonical
    driverAliasStorage.set(normalizedAlias, entry);
  }
  
  /**
   * Get canonical driver name from any alias
   */
  getCanonicalDriverName(name: string): string {
    const normalized = normalizeDriverName(name);
    const entry = driverAliasStorage.get(normalized);
    return entry?.canonical || name;
  }
  
  /**
   * Get all aliases for a driver
   */
  getDriverAliases(name: string): string[] {
    const normalized = normalizeDriverName(name);
    const entry = driverAliasStorage.get(normalized);
    return entry?.aliases || [name];
  }
  
  /**
   * Get all driver alias mappings
   */
  getAllDriverAliases(): DriverAlias[] {
    const seen = new Set<string>();
    const result: DriverAlias[] = [];
    
    for (const entry of driverAliasStorage.values()) {
      if (!seen.has(entry.canonical)) {
        seen.add(entry.canonical);
        result.push(entry);
      }
    }
    
    return result;
  }
  
  // ============================================================================
  // Query Methods
  // ============================================================================
  
  async getImportById(importId: number): Promise<StoredImport | null> {
    return importStorage.get(importId) || null;
  }
  
  async getImports(): Promise<StoredImport[]> {
    return Array.from(importStorage.values())
      .sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  }
  
  async getActualTripsByDate(serviceDate: string): Promise<StoredActualTrip[]> {
    return Array.from(actualTripStorage.values())
      .filter(t => t.serviceDate === serviceDate);
  }
  
  /**
   * Get actual trips by driver for a service date
   * Uses driver alias mapping for robust matching
   */
  async getActualTripsByDriverAndDate(
    driverName: string,
    serviceDate: string
  ): Promise<StoredActualTrip[]> {
    const aliases = this.getDriverAliases(driverName);
    const normalizedAliases = aliases.map(normalizeDriverName);
    
    return Array.from(actualTripStorage.values())
      .filter(t => 
        t.serviceDate === serviceDate && 
        normalizedAliases.includes(normalizeDriverName(t.driverName))
      );
  }
  
  /**
   * Get driver summary for a service date
   * Uses driver alias mapping for robust aggregation
   */
  async getDriverSummaryByDate(serviceDate: string): Promise<{
    driverName: string;
    completedTrips: number;
    cancelledTrips: number;
    noShowTrips: number;
    totalMiles: number;
    onTimeCount: number;
    lateCount: number;
    onTimePercent: number;
  }[]> {
    const trips = await this.getActualTripsByDate(serviceDate);
    
    // Group by canonical driver name
    const driverMap = new Map<string, {
      driverName: string;
      completedTrips: number;
      cancelledTrips: number;
      noShowTrips: number;
      totalMiles: number;
      onTimeCount: number;
      lateCount: number;
    }>();
    
    for (const trip of trips) {
      const canonical = this.getCanonicalDriverName(trip.driverName);
      
      if (!driverMap.has(canonical)) {
        driverMap.set(canonical, {
          driverName: canonical,
          completedTrips: 0,
          cancelledTrips: 0,
          noShowTrips: 0,
          totalMiles: 0,
          onTimeCount: 0,
          lateCount: 0,
        });
      }
      
      const summary = driverMap.get(canonical)!;
      
      if (trip.status === "completed") {
        summary.completedTrips++;
        summary.totalMiles += trip.milesActual || 0;
        
        if (trip.wasOnTime === true) {
          summary.onTimeCount++;
        } else if (trip.wasOnTime === false) {
          summary.lateCount++;
        }
      } else if (trip.status === "cancelled") {
        summary.cancelledTrips++;
      } else if (trip.status === "no_show") {
        summary.noShowTrips++;
      }
    }
    
    return Array.from(driverMap.values()).map(d => ({
      ...d,
      onTimePercent: d.onTimeCount + d.lateCount > 0
        ? Math.round((d.onTimeCount / (d.onTimeCount + d.lateCount)) * 100)
        : 100,
    }));
  }
}

// Singleton instance
let instance: ActualImportService | null = null;

export function getActualImportService(): ActualImportService {
  if (!instance) {
    instance = new ActualImportService();
  }
  return instance;
}
