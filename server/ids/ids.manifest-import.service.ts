/**
 * IDS Manifest Import Service
 * 
 * Handles importing broker manifests (pre-dispatch trips) from various formats.
 * PHI-safe: no patient names, phones, DOB, or full addresses stored.
 */

import crypto from "crypto";
import type { ManifestFormat, OpcoId, BrokerId, BrokerAccountId } from "../../drizzle/ids.schema";
import { 
  getAdapter, 
  detectFormat,
  type ParsedManifestTrip,
  type ManifestPreviewResult,
  type ManifestImportResult,
} from "./manifest-adapters";

// ============================================================================
// Types
// ============================================================================

export interface StoredManifestTrip extends ParsedManifestTrip {
  id: number;
  opcoId: OpcoId;
  brokerId: BrokerId;
  brokerAccountId: BrokerAccountId;
  importId: number;
  createdAt: Date;
}

export interface StoredManifestImport {
  id: number;
  opcoId: OpcoId;
  brokerId: BrokerId;
  brokerAccountId: BrokerAccountId;
  format: ManifestFormat;
  fileHash: string;
  fileName: string;
  fileSize: number;
  serviceDateFrom: string;
  serviceDateTo: string;
  totalRows: number;
  importedRows: number;
  cancelledRows: number;
  skippedRows: number;
  errorRows: number;
  losCounts: Record<string, number>;
  accountedRows: number;
  isComplete: boolean;
  importedAt: Date;
}

export interface PartitionOptions {
  opcoId: OpcoId;
  brokerId: BrokerId;
  brokerAccountId: BrokerAccountId;
}

// ============================================================================
// In-Memory Storage (for demo - replace with DB in production)
// ============================================================================

const manifestImports: StoredManifestImport[] = [];
const manifestTrips: StoredManifestTrip[] = [];
let importIdCounter = 0;
let tripIdCounter = 0;

// ============================================================================
// Service Functions
// ============================================================================

/**
 * Generate SHA-256 hash of file content
 */
function hashContent(content: string | Buffer): string {
  const data = typeof content === "string" ? content : content.toString("utf-8");
  return crypto.createHash("sha256").update(data).digest("hex");
}

/**
 * Check if a file has already been imported under this partition
 */
export function checkDuplicateImport(
  fileHash: string,
  partition: PartitionOptions
): StoredManifestImport | null {
  return manifestImports.find(
    (imp) =>
      imp.fileHash === fileHash &&
      imp.opcoId === partition.opcoId &&
      imp.brokerAccountId === partition.brokerAccountId
  ) || null;
}

/**
 * Preview a manifest file without importing
 */
export async function previewManifest(
  content: string | Buffer,
  fileName: string,
  partition: PartitionOptions
): Promise<ManifestPreviewResult & { fileHash: string; isDuplicate: boolean }> {
  const fileHash = hashContent(content);
  const existingImport = checkDuplicateImport(fileHash, partition);
  
  // Detect format based on file extension and broker account
  const format = detectFormat(fileName, partition.brokerAccountId);
  if (!format) {
    return {
      format: "mtm_csv", // Default
      totalRows: 0,
      validRows: 0,
      cancelledRows: 0,
      skippedRows: 0,
      errorRows: 0,
      serviceDateRange: { from: "", to: "" },
      losCounts: {},
      fundingSources: [],
      missingFields: [],
      sampleTrips: [],
      errors: [`Unable to detect format for file: ${fileName}`],
      fileHash,
      isDuplicate: !!existingImport,
    };
  }
  
  const adapter = getAdapter(format);
  const preview = await adapter.preview(content, fileName);
  
  return {
    ...preview,
    fileHash,
    isDuplicate: !!existingImport,
  };
}

/**
 * Import a manifest file
 */
export async function importManifest(
  content: string | Buffer,
  fileName: string,
  partition: PartitionOptions,
  formatOverride?: ManifestFormat
): Promise<ManifestImportResult> {
  const fileHash = hashContent(content);
  const existingImport = checkDuplicateImport(fileHash, partition);
  
  if (existingImport) {
    return {
      importId: existingImport.id,
      format: existingImport.format,
      fileHash,
      expectedRows: existingImport.totalRows,
      accountedRows: existingImport.accountedRows,
      importedRows: 0, // No new rows
      cancelledRows: 0,
      skippedRows: existingImport.totalRows, // All skipped as duplicates
      errorRows: 0,
      losCounts: existingImport.losCounts,
      isComplete: true,
      errors: ["File already imported under this partition (duplicate detected by file hash)"],
    };
  }
  
  // Detect or use override format
  const format = formatOverride || detectFormat(fileName, partition.brokerAccountId);
  if (!format) {
    return {
      importId: 0,
      format: "mtm_csv",
      fileHash,
      expectedRows: 0,
      accountedRows: 0,
      importedRows: 0,
      cancelledRows: 0,
      skippedRows: 0,
      errorRows: 0,
      losCounts: {},
      isComplete: false,
      errors: [`Unable to detect format for file: ${fileName}`],
    };
  }
  
  const adapter = getAdapter(format);
  const trips = await adapter.parse(content, fileName);
  
  // Create import record
  const importId = ++importIdCounter;
  const losCounts: Record<string, number> = {};
  let cancelledCount = 0;
  let minDate = "";
  let maxDate = "";
  
  // Store trips
  for (const trip of trips) {
    tripIdCounter++;
    
    losCounts[trip.mobilityType] = (losCounts[trip.mobilityType] || 0) + 1;
    if (trip.isCancelled) cancelledCount++;
    if (!minDate || trip.serviceDate < minDate) minDate = trip.serviceDate;
    if (!maxDate || trip.serviceDate > maxDate) maxDate = trip.serviceDate;
    
    manifestTrips.push({
      ...trip,
      id: tripIdCounter,
      opcoId: partition.opcoId,
      brokerId: partition.brokerId,
      brokerAccountId: partition.brokerAccountId,
      importId,
      createdAt: new Date(),
    });
  }
  
  const importRecord: StoredManifestImport = {
    id: importId,
    opcoId: partition.opcoId,
    brokerId: partition.brokerId,
    brokerAccountId: partition.brokerAccountId,
    format,
    fileHash,
    fileName,
    fileSize: typeof content === "string" ? content.length : content.length,
    serviceDateFrom: minDate,
    serviceDateTo: maxDate,
    totalRows: trips.length,
    importedRows: trips.length - cancelledCount,
    cancelledRows: cancelledCount,
    skippedRows: 0,
    errorRows: 0,
    losCounts,
    accountedRows: trips.length,
    isComplete: true,
    importedAt: new Date(),
  };
  
  manifestImports.push(importRecord);
  
  console.log("[IDS Manifest Import] Import completed:", {
    importId,
    format,
    fileHash: fileHash.substring(0, 16) + "...",
    expectedRows: trips.length,
    accountedRows: trips.length,
    importedRows: trips.length - cancelledCount,
    cancelledRows: cancelledCount,
    losCounts,
  });
  
  return {
    importId,
    format,
    fileHash,
    expectedRows: trips.length,
    accountedRows: trips.length,
    importedRows: trips.length - cancelledCount,
    cancelledRows: cancelledCount,
    skippedRows: 0,
    errorRows: 0,
    losCounts,
    isComplete: true,
    errors: [],
  };
}

/**
 * Get all manifest imports, optionally filtered by partition
 */
export function getManifestImports(
  filter?: Partial<PartitionOptions>
): StoredManifestImport[] {
  let results = [...manifestImports];
  
  if (filter?.opcoId) {
    results = results.filter((imp) => imp.opcoId === filter.opcoId);
  }
  if (filter?.brokerId) {
    results = results.filter((imp) => imp.brokerId === filter.brokerId);
  }
  if (filter?.brokerAccountId) {
    results = results.filter((imp) => imp.brokerAccountId === filter.brokerAccountId);
  }
  
  return results.sort((a, b) => b.importedAt.getTime() - a.importedAt.getTime());
}

/**
 * Get manifest trips by service date, optionally filtered by partition and funding source
 */
export function getManifestTripsByDate(
  serviceDate: string,
  filter?: Partial<PartitionOptions> & { fundingSource?: string }
): StoredManifestTrip[] {
  let results = manifestTrips.filter((trip) => trip.serviceDate === serviceDate);
  
  if (filter?.opcoId) {
    results = results.filter((trip) => trip.opcoId === filter.opcoId);
  }
  if (filter?.brokerId) {
    results = results.filter((trip) => trip.brokerId === filter.brokerId);
  }
  if (filter?.brokerAccountId) {
    results = results.filter((trip) => trip.brokerAccountId === filter.brokerAccountId);
  }
  if (filter?.fundingSource) {
    results = results.filter((trip) => trip.fundingSource === filter.fundingSource);
  }
  
  return results;
}

/**
 * Get unique funding sources for a partition
 */
export function getFundingSources(
  filter?: Partial<PartitionOptions>
): string[] {
  let results = [...manifestTrips];
  
  if (filter?.opcoId) {
    results = results.filter((trip) => trip.opcoId === filter.opcoId);
  }
  if (filter?.brokerAccountId) {
    results = results.filter((trip) => trip.brokerAccountId === filter.brokerAccountId);
  }
  
  const sources = new Set<string>();
  for (const trip of results) {
    if (trip.fundingSource) sources.add(trip.fundingSource);
  }
  
  return Array.from(sources).sort();
}

/**
 * Get manifest trip counts by date for a partition
 */
export function getManifestTripCountsByDate(
  filter?: Partial<PartitionOptions>
): { date: string; count: number; losCounts: Record<string, number> }[] {
  let results = [...manifestTrips];
  
  if (filter?.opcoId) {
    results = results.filter((trip) => trip.opcoId === filter.opcoId);
  }
  if (filter?.brokerAccountId) {
    results = results.filter((trip) => trip.brokerAccountId === filter.brokerAccountId);
  }
  
  const byDate: Record<string, { count: number; losCounts: Record<string, number> }> = {};
  
  for (const trip of results) {
    if (!byDate[trip.serviceDate]) {
      byDate[trip.serviceDate] = { count: 0, losCounts: {} };
    }
    byDate[trip.serviceDate].count++;
    byDate[trip.serviceDate].losCounts[trip.mobilityType] = 
      (byDate[trip.serviceDate].losCounts[trip.mobilityType] || 0) + 1;
  }
  
  return Object.entries(byDate)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
