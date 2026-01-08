import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
  getVehicles: vi.fn(),
  getVehicleById: vi.fn(),
  createVehicle: vi.fn(),
  updateVehicle: vi.fn(),
  deleteVehicle: vi.fn(),
  getVehicleFilterOptions: vi.fn(),
  bulkCreateVehicles: vi.fn(),
  getVehicleDocuments: vi.fn(),
  createVehicleDocument: vi.fn(),
  deleteVehicleDocument: vi.fn(),
  getDocumentById: vi.fn(),
  getVehicleStats: vi.fn(),
  getMaintenanceRecords: vi.fn(),
  getMaintenanceRecordById: vi.fn(),
  createMaintenanceRecord: vi.fn(),
  updateMaintenanceRecord: vi.fn(),
  deleteMaintenanceRecord: vi.fn(),
  getDrivers: vi.fn(),
  getDriverById: vi.fn(),
  createDriver: vi.fn(),
  updateDriver: vi.fn(),
  deleteDriver: vi.fn(),
  bulkCreateDrivers: vi.fn(),
  getDriverStats: vi.fn(),
  assignVehicleToDriver: vi.fn(),
  getDriverVehicleHistory: vi.fn(),
  getDriverByVehicleId: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("vehicles router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("vehicles.list", () => {
    it("returns an array of vehicles", async () => {
      vi.mocked(db.getVehicles).mockResolvedValue([]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vehicles.list({});

      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts filter parameters", async () => {
      vi.mocked(db.getVehicles).mockResolvedValue([]);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vehicles.list({
        search: "Honda",
        city: "IW",
        make: "Honda",
      });

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("vehicles.filterOptions", () => {
    it("returns filter options with cities, makes, models, and years", async () => {
      vi.mocked(db.getVehicleFilterOptions).mockResolvedValue({
        cities: ["IW", "NN"],
        makes: ["Honda", "Toyota"],
        models: ["Odyssey", "Sienna"],
        years: [2020, 2021],
      });

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vehicles.filterOptions();

      expect(result).toHaveProperty("cities");
      expect(result).toHaveProperty("makes");
      expect(result).toHaveProperty("models");
      expect(result).toHaveProperty("years");
      expect(Array.isArray(result.cities)).toBe(true);
      expect(Array.isArray(result.makes)).toBe(true);
      expect(Array.isArray(result.models)).toBe(true);
      expect(Array.isArray(result.years)).toBe(true);
    });
  });

  describe("vehicles.stats", () => {
    it("returns dashboard statistics", async () => {
      vi.mocked(db.getVehicleStats).mockResolvedValue({
        total: 10,
        active: 8,
        expiringSoon: 2,
      });

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vehicles.stats();

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("active");
      expect(result).toHaveProperty("expiringSoon");
      expect(typeof result.total).toBe("number");
      expect(typeof result.active).toBe("number");
      expect(typeof result.expiringSoon).toBe("number");
    });
  });

  describe("vehicles.create and vehicles.getById", () => {
    it("creates a vehicle and retrieves it by ID", async () => {
      const mockVehicle = {
        id: 1,
        vehicleNumber: "TEST001",
        tagNumber: "TEST-TAG-001",
        vin: "1HGCM82633A123456",
        city: "IW",
        make: "Honda",
        model: "Odyssey",
        year: 2020,
        insurance: "SAHRAWI",
        isActive: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrationExp: null,
        stateInspectionExp: null,
        insuranceExp: null,
        cityInspectionExp: null,
        notes: null,
      };

      vi.mocked(db.createVehicle).mockResolvedValue({ id: 1 });
      vi.mocked(db.getVehicleById).mockResolvedValue(mockVehicle);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const vehicleData = {
        vehicleNumber: "TEST001",
        tagNumber: "TEST-TAG-001",
        vin: "1HGCM82633A123456",
        city: "IW",
        make: "Honda",
        model: "Odyssey",
        year: 2020,
        insurance: "SAHRAWI",
      };

      const createResult = await caller.vehicles.create(vehicleData);
      expect(createResult).toHaveProperty("id");
      expect(typeof createResult.id).toBe("number");

      const vehicle = await caller.vehicles.getById({ id: createResult.id });
      expect(vehicle).not.toBeNull();
      expect(vehicle?.vehicleNumber).toBe("TEST001");
      expect(vehicle?.tagNumber).toBe("TEST-TAG-001");
      expect(vehicle?.make).toBe("Honda");
      expect(vehicle?.model).toBe("Odyssey");
    });
  });

  describe("vehicles.update", () => {
    it("updates a vehicle's information", async () => {
      const mockVehicle = {
        id: 1,
        vehicleNumber: "TEST002",
        tagNumber: "TEST-TAG-002",
        make: "Honda",
        model: "Odyssey",
        year: 2021,
        vin: null,
        city: null,
        insurance: null,
        isActive: "active" as const,
        createdAt: new Date(),
        updatedAt: new Date(),
        registrationExp: null,
        stateInspectionExp: null,
        insuranceExp: null,
        cityInspectionExp: null,
        notes: null,
      };

      vi.mocked(db.createVehicle).mockResolvedValue({ id: 1 });
      vi.mocked(db.updateVehicle).mockResolvedValue({ success: true });
      vi.mocked(db.getVehicleById).mockResolvedValue(mockVehicle);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // First create a vehicle
      const createResult = await caller.vehicles.create({
        vehicleNumber: "TEST002",
        tagNumber: "TEST-TAG-002",
        make: "Toyota",
        model: "Sienna",
      });

      // Update the vehicle
      const updateResult = await caller.vehicles.update({
        id: createResult.id,
        data: {
          make: "Honda",
          model: "Odyssey",
          year: 2021,
        },
      });

      expect(updateResult).toEqual({ success: true });

      // Verify the update
      const vehicle = await caller.vehicles.getById({ id: createResult.id });
      expect(vehicle?.make).toBe("Honda");
      expect(vehicle?.model).toBe("Odyssey");
      expect(vehicle?.year).toBe(2021);
    });
  });

  describe("vehicles.delete", () => {
    it("deletes a vehicle", async () => {
      vi.mocked(db.createVehicle).mockResolvedValue({ id: 1 });
      vi.mocked(db.deleteVehicle).mockResolvedValue({ success: true });
      vi.mocked(db.getVehicleById).mockResolvedValue(null);

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a vehicle to delete
      const createResult = await caller.vehicles.create({
        vehicleNumber: "TEST003",
        tagNumber: "TEST-TAG-003",
      });

      // Delete the vehicle
      const deleteResult = await caller.vehicles.delete({
        id: createResult.id,
      });
      expect(deleteResult).toEqual({ success: true });

      // Verify deletion
      const vehicle = await caller.vehicles.getById({ id: createResult.id });
      expect(vehicle).toBeNull();
    });
  });

  describe("vehicles.bulkImport", () => {
    it("imports multiple vehicles at once", async () => {
      vi.mocked(db.bulkCreateVehicles).mockResolvedValue({ count: 2 });

      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const vehiclesToImport = [
        {
          vehicleNumber: "BULK001",
          tagNumber: "BULK-TAG-001",
          make: "Honda",
          model: "Odyssey",
          year: 2018,
        },
        {
          vehicleNumber: "BULK002",
          tagNumber: "BULK-TAG-002",
          make: "Toyota",
          model: "Sienna",
          year: 2019,
        },
      ];

      const result = await caller.vehicles.bulkImport({
        vehicles: vehiclesToImport,
      });

      expect(result).toHaveProperty("count");
      expect(result.count).toBe(2);
    });
  });
});
