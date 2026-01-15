/**
 * PHI Regression Test
 * 
 * Verifies that PHI fields are NEVER stored in the database after import.
 * Uses ALLOWLIST pattern: only approved columns are extracted.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { ActualImportService, getActualImportService } from "../ids.actual-import.service";

describe("PHI Regression Tests", () => {
  let service: ActualImportService;

  beforeEach(() => {
    // Get fresh service instance
    service = getActualImportService();
  });

  describe("ALLOWLIST Pattern", () => {
    it("should only extract columns from the allowlist", async () => {
      // CSV with PHI columns that should be IGNORED
      const csvWithPHI = `Trip Id,Date,Driver,Patient Name,Phone,DOB,Address,Vehicle,Type,Req Pickup
T001,01/15/2026,John Smith,Jane Doe,555-123-4567,01/01/1980,123 Main St Apt 4 Springfield IL 62701,V101,AMB,09:00 AM
T002,01/15/2026,John Smith,Bob Wilson,555-987-6543,05/15/1975,456 Oak Ave Chicago IL 60601,V101,WC,10:30 AM`;

      const result = await service.importCSV(csvWithPHI, "phi_test.csv");

      // Verify import succeeded
      expect(result.success).toBe(true);
      expect(result.importedRows).toBe(2);

      // Verify PHI columns were IGNORED (not in allowlist)
      expect(result.ignoredColumns).toContain("Patient Name");
      expect(result.ignoredColumns).toContain("Phone");
      expect(result.ignoredColumns).toContain("DOB");
      expect(result.ignoredColumns).toContain("Address");

      // Verify only allowed columns were extracted
      expect(result.extractedColumns).toContain("Trip Id");
      expect(result.extractedColumns).toContain("Date");
      expect(result.extractedColumns).toContain("Driver");
      expect(result.extractedColumns).toContain("Vehicle");
      expect(result.extractedColumns).toContain("Type");
      expect(result.extractedColumns).toContain("Req Pickup");
    });

    it("should NOT store any PHI fields in the database", async () => {
      // CSV with ALL common PHI fields
      const csvWithAllPHI = `Trip Id,Date,Driver,Vehicle,Type,Patient,Member Name,Phone,Member Phone,DOB,Date of Birth,Address,Pickup Address,Dropoff Address,SSN,Email,Medicaid,Medicare
T003,01/15/2026,Jane Doe,V102,AMB,John Patient,John Patient,555-111-2222,555-333-4444,02/14/1990,02/14/1990,789 Elm St,100 Hospital Dr,200 Clinic Rd,123-45-6789,john@email.com,12345678,87654321`;

      const result = await service.importCSV(csvWithAllPHI, "all_phi_test.csv");

      // Verify import succeeded
      expect(result.success).toBe(true);
      expect(result.importedRows).toBe(1);

      // Get the imported trip
      const trips = await service.getActualTripsByDate("2026-01-15");
      const trip = trips.find(t => t.tripId === "T003");

      expect(trip).toBeDefined();

      // Verify trip object does NOT contain any PHI fields
      const tripKeys = Object.keys(trip!);
      
      // PHI fields that should NEVER exist
      const phiFieldNames = [
        "patient", "patientName", "memberName",
        "phone", "memberPhone", "telephone",
        "dob", "dateOfBirth", "birthDate",
        "address", "pickupAddress", "dropoffAddress", "street",
        "ssn", "socialSecurity",
        "email", "memberEmail",
        "medicaid", "medicare"
      ];

      for (const phiField of phiFieldNames) {
        expect(tripKeys).not.toContain(phiField);
        expect((trip as any)[phiField]).toBeUndefined();
      }

      // Verify only allowed fields are present
      expect(trip!.tripId).toBe("T003");
      expect(trip!.serviceDate).toBe("2026-01-15");
      expect(trip!.driverName).toBe("Jane Doe");
      expect(trip!.vehicleUnit).toBe("V102");
      expect(trip!.mobilityType).toBe("AMB");
    });

    it("should ignore new/unknown columns by default (vendor protection)", async () => {
      // CSV with columns that might be added by vendors in the future
      const csvWithNewColumns = `Trip Id,Date,Driver,Vehicle,New Vendor Field,Another PHI Column,Patient SSN Last 4,Emergency Contact
T004,01/15/2026,Bob Driver,V103,some_value,sensitive_data,1234,Mom 555-555-5555`;

      const result = await service.importCSV(csvWithNewColumns, "new_columns_test.csv");

      // Verify import succeeded
      expect(result.success).toBe(true);

      // Verify unknown columns were IGNORED
      expect(result.ignoredColumns).toContain("New Vendor Field");
      expect(result.ignoredColumns).toContain("Another PHI Column");
      expect(result.ignoredColumns).toContain("Patient SSN Last 4");
      expect(result.ignoredColumns).toContain("Emergency Contact");

      // Get the imported trip
      const trips = await service.getActualTripsByDate("2026-01-15");
      const trip = trips.find(t => t.tripId === "T004");

      expect(trip).toBeDefined();

      // Verify none of the new columns are stored
      expect((trip as any)["New Vendor Field"]).toBeUndefined();
      expect((trip as any)["newVendorField"]).toBeUndefined();
      expect((trip as any)["Another PHI Column"]).toBeUndefined();
      expect((trip as any)["Patient SSN Last 4"]).toBeUndefined();
      expect((trip as any)["Emergency Contact"]).toBeUndefined();
    });
  });

  describe("Nothing Dropped Proof", () => {
    it("should account for all rows (imported + skipped + errors = expected)", async () => {
      const csv = `Trip Id,Date,Driver,Vehicle,Type
T005,01/15/2026,Driver A,V104,AMB
T006,01/15/2026,Driver B,V105,WC
,,,
T007,invalid-date,Driver C,V106,STR
T008,01/15/2026,Driver D,V107,AMB`;

      const result = await service.importCSV(csv, "nothing_dropped_test.csv");

      // Verify accounting
      expect(result.expectedRows).toBe(5);
      expect(result.accountedRows).toBe(result.importedRows + result.skippedRows + result.errorRows);
      expect(result.accountedRows).toBe(result.expectedRows);
      expect(result.missingRows).toEqual([]);
      expect(result.isComplete).toBe(true);
    });
  });

  describe("Idempotency", () => {
    it("should detect duplicate file imports via hash", async () => {
      const csv = `Trip Id,Date,Driver,Vehicle,Type
T009,01/15/2026,Driver E,V108,AMB`;

      // First import
      const result1 = await service.importCSV(csv, "idempotency_test.csv");
      expect(result1.success).toBe(true);
      expect(result1.importedRows).toBe(1);

      // Second import of same file
      const result2 = await service.importCSV(csv, "idempotency_test.csv");
      expect(result2.success).toBe(false);
      expect(result2.importedRows).toBe(0);
      expect(result2.errors[0].message).toContain("already imported");
      expect(result2.fileHash).toBe(result1.fileHash);
    });
  });

  describe("Driver Alias Mapping", () => {
    it("should match drivers by normalized name", async () => {
      const csv = `Trip Id,Date,Driver,Vehicle,Type
T010,01/16/2026,John Smith,V109,AMB
T011,01/16/2026,john smith,V110,WC
T012,01/16/2026,JOHN SMITH,V111,STR`;

      await service.importCSV(csv, "driver_alias_test.csv");

      // Query by any variation should return all trips
      const trips1 = await service.getActualTripsByDriverAndDate("John Smith", "2026-01-16");
      const trips2 = await service.getActualTripsByDriverAndDate("john smith", "2026-01-16");
      const trips3 = await service.getActualTripsByDriverAndDate("JOHN SMITH", "2026-01-16");

      expect(trips1.length).toBe(3);
      expect(trips2.length).toBe(3);
      expect(trips3.length).toBe(3);
    });

    it("should support manual alias mapping", async () => {
      // Add manual alias
      service.addDriverAlias("John Smith", "J. Smith");
      service.addDriverAlias("John Smith", "Johnny Smith");

      const aliases = service.getDriverAliases("John Smith");
      expect(aliases).toContain("John Smith");
      expect(aliases).toContain("J. Smith");
      expect(aliases).toContain("Johnny Smith");

      // Canonical lookup
      expect(service.getCanonicalDriverName("J. Smith")).toBe("John Smith");
      expect(service.getCanonicalDriverName("Johnny Smith")).toBe("John Smith");
    });
  });
});
