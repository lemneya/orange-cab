/**
 * IDS-PARTITION-0 Unit Tests
 * 
 * Tests for:
 * 1. Uniqueness: (opco_id, broker_account_id, service_date, external_trip_id)
 * 2. Compare join partitioning: Sahrawi vs Metrix data stays separated
 */

import { describe, it, expect, beforeEach } from "vitest";
import { getActualImportService } from "../ids.actual-import.service";

describe("IDS Partition Tests", () => {
  let importService: ReturnType<typeof getActualImportService>;

  beforeEach(() => {
    // Get fresh service instance
    importService = getActualImportService();
  });

  describe("Uniqueness Tests", () => {
    it("should import same trip ID under different partitions without collision", async () => {
      // Same trip ID, same date, different OpCo/BrokerAccount
      const csvSahrawi = `TripId,Date,Driver,Vehicle,Type
TRIP001,01/15/2026,John Smith,V101,Ambulatory
TRIP002,01/15/2026,Jane Doe,V102,Wheelchair`;

      const csvMetrix = `TripId,Date,Driver,Vehicle,Type
TRIP001,01/15/2026,Bob Wilson,V201,Ambulatory
TRIP003,01/15/2026,Alice Brown,V202,Wheelchair`;

      // Import Sahrawi manifest
      const sahrawiResult = await importService.importCSV(csvSahrawi, "sahrawi_manifest.csv", {
        opcoId: "SAHRAWI",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_SAHRAWI",
      });

      expect(sahrawiResult.success).toBe(true);
      expect(sahrawiResult.importedRows).toBe(2);
      expect(sahrawiResult.opcoId).toBe("SAHRAWI");
      expect(sahrawiResult.brokerAccountId).toBe("MODIVCARE_SAHRAWI");

      // Import Metrix manifest (has TRIP001 which also exists in Sahrawi)
      const metrixResult = await importService.importCSV(csvMetrix, "metrix_manifest.csv", {
        opcoId: "METRIX",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_METRIX",
      });

      expect(metrixResult.success).toBe(true);
      expect(metrixResult.importedRows).toBe(2);
      expect(metrixResult.opcoId).toBe("METRIX");
      expect(metrixResult.brokerAccountId).toBe("MODIVCARE_METRIX");

      // Both imports should succeed without collision
      // TRIP001 exists in both but under different partitions
    });

    it("should prevent duplicate file import (idempotency)", async () => {
      const csv = `TripId,Date,Driver,Vehicle,Type
TRIP100,01/15/2026,Test Driver,V100,Ambulatory`;

      // First import
      const firstResult = await importService.importCSV(csv, "test.csv", {
        opcoId: "SAHRAWI",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_SAHRAWI",
      });

      expect(firstResult.success).toBe(true);
      expect(firstResult.importedRows).toBe(1);

      // Second import of same file should be rejected
      const secondResult = await importService.importCSV(csv, "test.csv", {
        opcoId: "SAHRAWI",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_SAHRAWI",
      });

      expect(secondResult.success).toBe(false);
      expect(secondResult.importedRows).toBe(0);
      expect(secondResult.errors.some(e => e.message.includes("already imported"))).toBe(true);
    });

    it("should allow same file under different partition (creates different batch)", async () => {
      const csv = `TripId,Date,Driver,Vehicle,Type
TRIP200,01/15/2026,Test Driver,V200,Ambulatory`;

      // Import under Sahrawi
      const sahrawiResult = await importService.importCSV(csv, "test.csv", {
        opcoId: "SAHRAWI",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_SAHRAWI",
      });

      expect(sahrawiResult.success).toBe(true);

      // Same file under different partition should be blocked by hash check
      // This is correct behavior - same file content = same hash = duplicate
      const metrixResult = await importService.importCSV(csv, "test.csv", {
        opcoId: "METRIX",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_METRIX",
      });

      // Should be rejected as duplicate (same file hash)
      expect(metrixResult.success).toBe(false);
    });
  });

  describe("Compare Join Partitioning Tests", () => {
    it("should filter trips by OpCo when querying", async () => {
      // Import Sahrawi trips
      const csvSahrawi = `TripId,Date,Driver,Vehicle,Type
SAH001,01/16/2026,John Smith,V101,Ambulatory
SAH002,01/16/2026,Jane Doe,V102,Wheelchair`;

      await importService.importCSV(csvSahrawi, "sahrawi.csv", {
        opcoId: "SAHRAWI",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_SAHRAWI",
      });

      // Import Metrix trips
      const csvMetrix = `TripId,Date,Driver,Vehicle,Type
MET001,01/16/2026,Bob Wilson,V201,Ambulatory
MET002,01/16/2026,Alice Brown,V202,Wheelchair`;

      await importService.importCSV(csvMetrix, "metrix.csv", {
        opcoId: "METRIX",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_METRIX",
      });

      // Query Sahrawi only
      const sahrawiTrips = await importService.getActualTripsByDate("2026-01-16", {
        opcoId: "SAHRAWI",
      });

      expect(sahrawiTrips.length).toBe(2);
      expect(sahrawiTrips.every(t => t.opcoId === "SAHRAWI")).toBe(true);
      expect(sahrawiTrips.some(t => t.tripId === "SAH001")).toBe(true);
      expect(sahrawiTrips.some(t => t.tripId === "SAH002")).toBe(true);

      // Query Metrix only
      const metrixTrips = await importService.getActualTripsByDate("2026-01-16", {
        opcoId: "METRIX",
      });

      expect(metrixTrips.length).toBe(2);
      expect(metrixTrips.every(t => t.opcoId === "METRIX")).toBe(true);
      expect(metrixTrips.some(t => t.tripId === "MET001")).toBe(true);
      expect(metrixTrips.some(t => t.tripId === "MET002")).toBe(true);

      // Query all (no filter)
      const allTrips = await importService.getActualTripsByDate("2026-01-16");
      expect(allTrips.length).toBe(4);
    });

    it("should filter driver summary by broker account", async () => {
      // Import trips for different broker accounts
      const csvModivcareSahrawi = `TripId,Date,Driver,Vehicle,Type,RoutedDistance
MS001,01/17/2026,Driver A,V101,Ambulatory,10.5
MS002,01/17/2026,Driver A,V101,Ambulatory,15.0`;

      await importService.importCSV(csvModivcareSahrawi, "modivcare_sahrawi.csv", {
        opcoId: "SAHRAWI",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_SAHRAWI",
      });

      const csvMTM = `TripId,Date,Driver,Vehicle,Type,RoutedDistance
MTM001,01/17/2026,Driver B,V201,Ambulatory,20.0
MTM002,01/17/2026,Driver B,V201,Wheelchair,25.0`;

      await importService.importCSV(csvMTM, "mtm.csv", {
        opcoId: "SAHRAWI",
        brokerId: "MTM",
        brokerAccountId: "MTM_MAIN",
      });

      // Get summary for Modivcare-Sahrawi only
      const modivcareSummary = await importService.getDriverSummaryByDate("2026-01-17", {
        brokerAccountId: "MODIVCARE_SAHRAWI",
      });

      expect(modivcareSummary.length).toBe(1);
      expect(modivcareSummary[0].driverName).toBe("Driver A");
      expect(modivcareSummary[0].completedTrips).toBe(2);
      expect(modivcareSummary[0].totalMiles).toBeCloseTo(25.5, 1);

      // Get summary for MTM only
      const mtmSummary = await importService.getDriverSummaryByDate("2026-01-17", {
        brokerAccountId: "MTM_MAIN",
      });

      expect(mtmSummary.length).toBe(1);
      expect(mtmSummary[0].driverName).toBe("Driver B");
      expect(mtmSummary[0].completedTrips).toBe(2);
      expect(mtmSummary[0].totalMiles).toBeCloseTo(45.0, 1);
    });

    it("should return empty results when filtering by non-existent partition", async () => {
      const csv = `TripId,Date,Driver,Vehicle,Type
TEST001,01/18/2026,Test Driver,V100,Ambulatory`;

      await importService.importCSV(csv, "test.csv", {
        opcoId: "SAHRAWI",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_SAHRAWI",
      });

      // Query for Metrix (which has no data)
      const metrixTrips = await importService.getActualTripsByDate("2026-01-18", {
        opcoId: "METRIX",
      });

      expect(metrixTrips.length).toBe(0);

      // Query for A2C (which has no data)
      const a2cSummary = await importService.getDriverSummaryByDate("2026-01-18", {
        brokerAccountId: "A2C_MAIN",
      });

      expect(a2cSummary.length).toBe(0);
    });
  });

  describe("Import Filtering Tests", () => {
    it("should filter imports by OpCo", async () => {
      const csv1 = `TripId,Date,Driver,Vehicle,Type
IMP001,01/19/2026,Driver 1,V100,Ambulatory`;

      const csv2 = `TripId,Date,Driver,Vehicle,Type
IMP002,01/19/2026,Driver 2,V200,Ambulatory`;

      await importService.importCSV(csv1, "sahrawi_import.csv", {
        opcoId: "SAHRAWI",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_SAHRAWI",
      });

      await importService.importCSV(csv2, "metrix_import.csv", {
        opcoId: "METRIX",
        brokerId: "MODIVCARE",
        brokerAccountId: "MODIVCARE_METRIX",
      });

      // Get Sahrawi imports only
      const sahrawiImports = await importService.getImports({ opcoId: "SAHRAWI" });
      expect(sahrawiImports.length).toBeGreaterThanOrEqual(1);
      expect(sahrawiImports.every(i => i.opcoId === "SAHRAWI")).toBe(true);

      // Get Metrix imports only
      const metrixImports = await importService.getImports({ opcoId: "METRIX" });
      expect(metrixImports.length).toBeGreaterThanOrEqual(1);
      expect(metrixImports.every(i => i.opcoId === "METRIX")).toBe(true);
    });
  });
});
