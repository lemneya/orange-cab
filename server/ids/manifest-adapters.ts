/**
 * Manifest Format Adapters
 * 
 * Each adapter knows how to parse a specific broker manifest format
 * and extract PHI-safe trip data.
 */

import crypto from "crypto";
import type { ManifestFormat } from "../../drizzle/ids.schema";

// ============================================================================
// Types
// ============================================================================

export interface ParsedManifestTrip {
  externalTripId: string;
  serviceDate: string; // YYYY-MM-DD
  fundingSource?: string;
  mobilityType: string; // AMB, WC, STR
  levelOfService?: string;
  spaceType?: string;
  appointmentTime?: string; // HH:MM
  requestedPickupTime?: string; // HH:MM
  pickupWindowStart?: string; // HH:MM
  pickupWindowEnd?: string; // HH:MM
  pickupLat?: number;
  pickupLon?: number;
  dropoffLat?: number;
  dropoffLon?: number;
  pickupCity?: string;
  dropoffCity?: string;
  pickupZip?: string;
  dropoffZip?: string;
  estimatedMiles?: number;
  isCancelled?: boolean;
  isWillCall?: boolean;
  isStanding?: boolean;
  specialRequirements?: string[];
}

export interface ManifestPreviewResult {
  format: ManifestFormat;
  totalRows: number;
  validRows: number;
  cancelledRows: number;
  skippedRows: number;
  errorRows: number;
  serviceDateRange: { from: string; to: string };
  losCounts: Record<string, number>;
  fundingSources: string[];
  missingFields: string[];
  sampleTrips: ParsedManifestTrip[];
  errors: string[];
}

export interface ManifestImportResult {
  importId: number;
  format: ManifestFormat;
  fileHash: string;
  expectedRows: number;
  accountedRows: number;
  importedRows: number;
  cancelledRows: number;
  skippedRows: number;
  errorRows: number;
  losCounts: Record<string, number>;
  isComplete: boolean;
  errors: string[];
}

// ============================================================================
// ManifestFormatAdapter Interface
// ============================================================================

export interface ManifestFormatAdapter {
  format: ManifestFormat;
  name: string;
  description: string;
  fileTypes: string[]; // e.g., ["pdf"], ["csv"]
  
  /**
   * Parse the file content and return preview data
   */
  preview(content: string | Buffer, fileName: string): Promise<ManifestPreviewResult>;
  
  /**
   * Parse the file content and return trips ready for import
   */
  parse(content: string | Buffer, fileName: string): Promise<ParsedManifestTrip[]>;
}

// ============================================================================
// Utility Functions
// ============================================================================

function parseTime(timeStr: string | undefined): string | undefined {
  if (!timeStr) return undefined;
  
  // Handle various time formats
  const cleaned = timeStr.trim().toUpperCase();
  
  // Try HH:MM format
  const match1 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match1) {
    const h = parseInt(match1[1], 10);
    const m = parseInt(match1[2], 10);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  
  // Try HH:MM AM/PM format
  const match2 = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (match2) {
    let h = parseInt(match2[1], 10);
    const m = parseInt(match2[2], 10);
    const ampm = match2[3];
    if (ampm === "PM" && h < 12) h += 12;
    if (ampm === "AM" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  
  // Try HHMM format
  const match3 = cleaned.match(/^(\d{4})$/);
  if (match3) {
    const h = parseInt(cleaned.substring(0, 2), 10);
    const m = parseInt(cleaned.substring(2, 4), 10);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }
  
  return undefined;
}

function parseDate(dateStr: string | undefined): string | undefined {
  if (!dateStr) return undefined;
  
  const cleaned = dateStr.trim();
  
  // Try YYYY-MM-DD format
  const match1 = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (match1) return cleaned;
  
  // Try MM/DD/YYYY format
  const match2 = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (match2) {
    const m = parseInt(match2[1], 10);
    const d = parseInt(match2[2], 10);
    const y = match2[3];
    return `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  }
  
  // Try MM-DD-YYYY format
  const match3 = cleaned.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
  if (match3) {
    const m = parseInt(match3[1], 10);
    const d = parseInt(match3[2], 10);
    const y = match3[3];
    return `${y}-${m.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}`;
  }
  
  return undefined;
}

function normalizeMobilityType(type: string | undefined): string {
  if (!type) return "AMB";
  const upper = type.toUpperCase().trim();
  if (upper.includes("WHEEL") || upper === "WC" || upper === "W") return "WC";
  if (upper.includes("STRETCH") || upper === "STR" || upper === "S") return "STR";
  return "AMB";
}

function parseCSV(content: string): { headers: string[]; rows: string[][] } {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  
  const parseRow = (line: string): string[] => {
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
  };
  
  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(parseRow);
  
  return { headers, rows };
}

function findColumn(headers: string[], ...candidates: string[]): number {
  for (const candidate of candidates) {
    const idx = headers.findIndex(h => 
      h.toLowerCase().replace(/[^a-z0-9]/g, "") === candidate.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    if (idx >= 0) return idx;
  }
  return -1;
}

// ============================================================================
// Modivcare PDF Adapter (Sahrawi)
// ============================================================================

export const modivcarePdfSahrawiAdapter: ManifestFormatAdapter = {
  format: "modivcare_pdf_sahrawi",
  name: "Modivcare PDF (Sahrawi)",
  description: "Modivcare manifest PDF for Sahrawi Transportation",
  fileTypes: ["pdf"],
  
  async preview(content: string | Buffer, fileName: string): Promise<ManifestPreviewResult> {
    // For PDF, we expect text content extracted from PDF
    const textContent = typeof content === "string" ? content : content.toString("utf-8");
    const trips = await this.parse(content, fileName);
    
    const losCounts: Record<string, number> = {};
    const fundingSources = new Set<string>();
    let cancelledCount = 0;
    let minDate = "";
    let maxDate = "";
    
    for (const trip of trips) {
      losCounts[trip.mobilityType] = (losCounts[trip.mobilityType] || 0) + 1;
      if (trip.fundingSource) fundingSources.add(trip.fundingSource);
      if (trip.isCancelled) cancelledCount++;
      if (!minDate || trip.serviceDate < minDate) minDate = trip.serviceDate;
      if (!maxDate || trip.serviceDate > maxDate) maxDate = trip.serviceDate;
    }
    
    return {
      format: this.format,
      totalRows: trips.length,
      validRows: trips.length - cancelledCount,
      cancelledRows: cancelledCount,
      skippedRows: 0,
      errorRows: 0,
      serviceDateRange: { from: minDate, to: maxDate },
      losCounts,
      fundingSources: Array.from(fundingSources),
      missingFields: [],
      sampleTrips: trips.slice(0, 5),
      errors: [],
    };
  },
  
  async parse(content: string | Buffer, fileName: string): Promise<ParsedManifestTrip[]> {
    // For PDF parsing, we simulate extracting structured data
    // In production, this would use pdf-parse or similar library
    const textContent = typeof content === "string" ? content : content.toString("utf-8");
    
    // Try to parse as CSV-like format (common in PDF text extraction)
    const { headers, rows } = parseCSV(textContent);
    
    if (headers.length === 0 || rows.length === 0) {
      // Return mock data for demo if no parseable content
      return [];
    }
    
    const tripIdIdx = findColumn(headers, "tripid", "trip_id", "id", "tripnumber");
    const dateIdx = findColumn(headers, "date", "servicedate", "tripdate", "pickupdate");
    const typeIdx = findColumn(headers, "type", "los", "levelofservice", "mobilitytype", "space");
    const apptIdx = findColumn(headers, "appointment", "appttime", "appointmenttime");
    const pickupIdx = findColumn(headers, "pickup", "pickuptime", "reqpickup", "requestedpickup");
    const fundingIdx = findColumn(headers, "funding", "fundingsource", "payer", "payersource");
    const cityPuIdx = findColumn(headers, "pickupcity", "pucity", "origincity");
    const cityDoIdx = findColumn(headers, "dropoffcity", "docity", "destcity", "destinationcity");
    const milesIdx = findColumn(headers, "miles", "distance", "routedmiles", "estimatedmiles");
    const statusIdx = findColumn(headers, "status", "tripstatus");
    
    const trips: ParsedManifestTrip[] = [];
    
    for (const row of rows) {
      if (row.length < 3) continue;
      
      const tripId = tripIdIdx >= 0 ? row[tripIdIdx] : `TRIP-${trips.length + 1}`;
      const dateStr = dateIdx >= 0 ? row[dateIdx] : undefined;
      const serviceDate = parseDate(dateStr) || new Date().toISOString().split("T")[0];
      
      const typeStr = typeIdx >= 0 ? row[typeIdx] : "AMB";
      const mobilityType = normalizeMobilityType(typeStr);
      
      const status = statusIdx >= 0 ? row[statusIdx]?.toLowerCase() : "";
      const isCancelled = status.includes("cancel") || status.includes("void");
      
      trips.push({
        externalTripId: tripId,
        serviceDate,
        fundingSource: fundingIdx >= 0 ? row[fundingIdx] : "MODIVCARE",
        mobilityType,
        appointmentTime: parseTime(apptIdx >= 0 ? row[apptIdx] : undefined),
        requestedPickupTime: parseTime(pickupIdx >= 0 ? row[pickupIdx] : undefined),
        pickupCity: cityPuIdx >= 0 ? row[cityPuIdx] : undefined,
        dropoffCity: cityDoIdx >= 0 ? row[cityDoIdx] : undefined,
        estimatedMiles: milesIdx >= 0 ? parseFloat(row[milesIdx]) || undefined : undefined,
        isCancelled,
      });
    }
    
    return trips;
  },
};

// ============================================================================
// Modivcare PDF Adapter (Metrix)
// ============================================================================

export const modivcarePdfMetrixAdapter: ManifestFormatAdapter = {
  format: "modivcare_pdf_metrix",
  name: "Modivcare PDF (Metrix)",
  description: "Modivcare manifest PDF for Metrix Medical Transport",
  fileTypes: ["pdf"],
  
  async preview(content: string | Buffer, fileName: string): Promise<ManifestPreviewResult> {
    // Same logic as Sahrawi, just different partition
    return modivcarePdfSahrawiAdapter.preview(content, fileName).then(result => ({
      ...result,
      format: this.format,
    }));
  },
  
  async parse(content: string | Buffer, fileName: string): Promise<ParsedManifestTrip[]> {
    // Same parsing logic, just different partition
    return modivcarePdfSahrawiAdapter.parse(content, fileName);
  },
};

// ============================================================================
// MTM CSV Adapter
// ============================================================================

export const mtmCsvAdapter: ManifestFormatAdapter = {
  format: "mtm_csv",
  name: "MTM CSV",
  description: "MTM manifest CSV export",
  fileTypes: ["csv"],
  
  async preview(content: string | Buffer, fileName: string): Promise<ManifestPreviewResult> {
    const textContent = typeof content === "string" ? content : content.toString("utf-8");
    const trips = await this.parse(content, fileName);
    
    const losCounts: Record<string, number> = {};
    const fundingSources = new Set<string>();
    let cancelledCount = 0;
    let minDate = "";
    let maxDate = "";
    
    for (const trip of trips) {
      losCounts[trip.mobilityType] = (losCounts[trip.mobilityType] || 0) + 1;
      if (trip.fundingSource) fundingSources.add(trip.fundingSource);
      if (trip.isCancelled) cancelledCount++;
      if (!minDate || trip.serviceDate < minDate) minDate = trip.serviceDate;
      if (!maxDate || trip.serviceDate > maxDate) maxDate = trip.serviceDate;
    }
    
    return {
      format: this.format,
      totalRows: trips.length,
      validRows: trips.length - cancelledCount,
      cancelledRows: cancelledCount,
      skippedRows: 0,
      errorRows: 0,
      serviceDateRange: { from: minDate, to: maxDate },
      losCounts,
      fundingSources: Array.from(fundingSources),
      missingFields: [],
      sampleTrips: trips.slice(0, 5),
      errors: [],
    };
  },
  
  async parse(content: string | Buffer, fileName: string): Promise<ParsedManifestTrip[]> {
    const textContent = typeof content === "string" ? content : content.toString("utf-8");
    const { headers, rows } = parseCSV(textContent);
    
    if (headers.length === 0) return [];
    
    // MTM-specific column mappings
    const tripIdIdx = findColumn(headers, "tripid", "trip_id", "id", "confirmation", "confirmationnumber");
    const dateIdx = findColumn(headers, "date", "servicedate", "tripdate", "dos");
    const typeIdx = findColumn(headers, "type", "los", "levelofservice", "servicetype");
    const apptIdx = findColumn(headers, "appointment", "appttime", "appointmenttime", "appt");
    const pickupIdx = findColumn(headers, "pickup", "pickuptime", "scheduledpickup");
    const fundingIdx = findColumn(headers, "funding", "fundingsource", "payer", "plan");
    const cityPuIdx = findColumn(headers, "pickupcity", "origincity", "fromcity");
    const cityDoIdx = findColumn(headers, "dropoffcity", "destcity", "tocity");
    const zipPuIdx = findColumn(headers, "pickupzip", "originzip", "fromzip");
    const zipDoIdx = findColumn(headers, "dropoffzip", "destzip", "tozip");
    const milesIdx = findColumn(headers, "miles", "distance", "estimatedmiles");
    const statusIdx = findColumn(headers, "status", "tripstatus");
    const standingIdx = findColumn(headers, "standing", "recurring");
    const willcallIdx = findColumn(headers, "willcall", "wc");
    
    const trips: ParsedManifestTrip[] = [];
    
    for (const row of rows) {
      if (row.length < 3) continue;
      
      const tripId = tripIdIdx >= 0 ? row[tripIdIdx] : `MTM-${trips.length + 1}`;
      const dateStr = dateIdx >= 0 ? row[dateIdx] : undefined;
      const serviceDate = parseDate(dateStr) || new Date().toISOString().split("T")[0];
      
      const typeStr = typeIdx >= 0 ? row[typeIdx] : "AMB";
      const mobilityType = normalizeMobilityType(typeStr);
      
      const status = statusIdx >= 0 ? row[statusIdx]?.toLowerCase() : "";
      const isCancelled = status.includes("cancel") || status.includes("void");
      
      const standingVal = standingIdx >= 0 ? row[standingIdx]?.toLowerCase() : "";
      const isStanding = standingVal === "y" || standingVal === "yes" || standingVal === "true" || standingVal === "1";
      
      const willcallVal = willcallIdx >= 0 ? row[willcallIdx]?.toLowerCase() : "";
      const isWillCall = willcallVal === "y" || willcallVal === "yes" || willcallVal === "true" || willcallVal === "1";
      
      trips.push({
        externalTripId: tripId,
        serviceDate,
        fundingSource: fundingIdx >= 0 ? row[fundingIdx] : "MTM",
        mobilityType,
        appointmentTime: parseTime(apptIdx >= 0 ? row[apptIdx] : undefined),
        requestedPickupTime: parseTime(pickupIdx >= 0 ? row[pickupIdx] : undefined),
        pickupCity: cityPuIdx >= 0 ? row[cityPuIdx] : undefined,
        dropoffCity: cityDoIdx >= 0 ? row[cityDoIdx] : undefined,
        pickupZip: zipPuIdx >= 0 ? row[zipPuIdx] : undefined,
        dropoffZip: zipDoIdx >= 0 ? row[zipDoIdx] : undefined,
        estimatedMiles: milesIdx >= 0 ? parseFloat(row[milesIdx]) || undefined : undefined,
        isCancelled,
        isStanding,
        isWillCall,
      });
    }
    
    return trips;
  },
};

// ============================================================================
// Access2Care CSV Adapter
// ============================================================================

export const a2cCsvAdapter: ManifestFormatAdapter = {
  format: "a2c_csv",
  name: "Access2Care CSV",
  description: "Access2Care manifest CSV export",
  fileTypes: ["csv"],
  
  async preview(content: string | Buffer, fileName: string): Promise<ManifestPreviewResult> {
    const textContent = typeof content === "string" ? content : content.toString("utf-8");
    const trips = await this.parse(content, fileName);
    
    const losCounts: Record<string, number> = {};
    const fundingSources = new Set<string>();
    let cancelledCount = 0;
    let minDate = "";
    let maxDate = "";
    
    for (const trip of trips) {
      losCounts[trip.mobilityType] = (losCounts[trip.mobilityType] || 0) + 1;
      if (trip.fundingSource) fundingSources.add(trip.fundingSource);
      if (trip.isCancelled) cancelledCount++;
      if (!minDate || trip.serviceDate < minDate) minDate = trip.serviceDate;
      if (!maxDate || trip.serviceDate > maxDate) maxDate = trip.serviceDate;
    }
    
    return {
      format: this.format,
      totalRows: trips.length,
      validRows: trips.length - cancelledCount,
      cancelledRows: cancelledCount,
      skippedRows: 0,
      errorRows: 0,
      serviceDateRange: { from: minDate, to: maxDate },
      losCounts,
      fundingSources: Array.from(fundingSources),
      missingFields: [],
      sampleTrips: trips.slice(0, 5),
      errors: [],
    };
  },
  
  async parse(content: string | Buffer, fileName: string): Promise<ParsedManifestTrip[]> {
    const textContent = typeof content === "string" ? content : content.toString("utf-8");
    const { headers, rows } = parseCSV(textContent);
    
    if (headers.length === 0) return [];
    
    // A2C-specific column mappings
    const tripIdIdx = findColumn(headers, "tripid", "trip_id", "id", "a2cid", "tripnumber");
    const dateIdx = findColumn(headers, "date", "servicedate", "tripdate");
    const typeIdx = findColumn(headers, "type", "los", "levelofservice", "modetype");
    const apptIdx = findColumn(headers, "appointment", "appttime", "appointmenttime");
    const pickupIdx = findColumn(headers, "pickup", "pickuptime", "scheduledpickup");
    const fundingIdx = findColumn(headers, "funding", "fundingsource", "payer", "healthplan");
    const cityPuIdx = findColumn(headers, "pickupcity", "origincity");
    const cityDoIdx = findColumn(headers, "dropoffcity", "destcity");
    const zipPuIdx = findColumn(headers, "pickupzip", "originzip");
    const zipDoIdx = findColumn(headers, "dropoffzip", "destzip");
    const milesIdx = findColumn(headers, "miles", "distance");
    const statusIdx = findColumn(headers, "status", "tripstatus");
    
    const trips: ParsedManifestTrip[] = [];
    
    for (const row of rows) {
      if (row.length < 3) continue;
      
      const tripId = tripIdIdx >= 0 ? row[tripIdIdx] : `A2C-${trips.length + 1}`;
      const dateStr = dateIdx >= 0 ? row[dateIdx] : undefined;
      const serviceDate = parseDate(dateStr) || new Date().toISOString().split("T")[0];
      
      const typeStr = typeIdx >= 0 ? row[typeIdx] : "AMB";
      const mobilityType = normalizeMobilityType(typeStr);
      
      const status = statusIdx >= 0 ? row[statusIdx]?.toLowerCase() : "";
      const isCancelled = status.includes("cancel") || status.includes("void");
      
      trips.push({
        externalTripId: tripId,
        serviceDate,
        fundingSource: fundingIdx >= 0 ? row[fundingIdx] : "ACCESS2CARE",
        mobilityType,
        appointmentTime: parseTime(apptIdx >= 0 ? row[apptIdx] : undefined),
        requestedPickupTime: parseTime(pickupIdx >= 0 ? row[pickupIdx] : undefined),
        pickupCity: cityPuIdx >= 0 ? row[cityPuIdx] : undefined,
        dropoffCity: cityDoIdx >= 0 ? row[cityDoIdx] : undefined,
        pickupZip: zipPuIdx >= 0 ? row[zipPuIdx] : undefined,
        dropoffZip: zipDoIdx >= 0 ? row[zipDoIdx] : undefined,
        estimatedMiles: milesIdx >= 0 ? parseFloat(row[milesIdx]) || undefined : undefined,
        isCancelled,
      });
    }
    
    return trips;
  },
};

// ============================================================================
// Adapter Registry
// ============================================================================

export const MANIFEST_ADAPTERS: Record<ManifestFormat, ManifestFormatAdapter> = {
  modivcare_pdf_sahrawi: modivcarePdfSahrawiAdapter,
  modivcare_pdf_metrix: modivcarePdfMetrixAdapter,
  mtm_csv: mtmCsvAdapter,
  a2c_csv: a2cCsvAdapter,
};

export function getAdapter(format: ManifestFormat): ManifestFormatAdapter {
  const adapter = MANIFEST_ADAPTERS[format];
  if (!adapter) {
    throw new Error(`Unknown manifest format: ${format}`);
  }
  return adapter;
}

export function detectFormat(fileName: string, brokerAccountId: string): ManifestFormat | null {
  const ext = fileName.split(".").pop()?.toLowerCase();
  
  if (ext === "pdf") {
    if (brokerAccountId === "MODIVCARE_SAHRAWI") return "modivcare_pdf_sahrawi";
    if (brokerAccountId === "MODIVCARE_METRIX") return "modivcare_pdf_metrix";
  }
  
  if (ext === "csv") {
    if (brokerAccountId === "MTM_MAIN") return "mtm_csv";
    if (brokerAccountId === "A2C_MAIN") return "a2c_csv";
    // Default to MTM for CSV
    return "mtm_csv";
  }
  
  return null;
}
