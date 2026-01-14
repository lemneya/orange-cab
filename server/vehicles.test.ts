import { describe, expect, it, vi, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Check if database is available
const DATABASE_URL = process.env.DATABASE_URL;
const skipDbTests = !DATABASE_URL;

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

describe.skipIf(skipDbTests)("vehicles router", () => {
  describe("vehicles.list", () => {
    it("returns an array of vehicles", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.vehicles.list({});

      expect(Array.isArray(result)).toBe(true);
    });

    it("accepts filter parameters", async () => {
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
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);

      // Create a vehicle to delete
      const createResult = await caller.vehicles.create({
        vehicleNumber: "TEST003",
        tagNumber: "TEST-TAG-003",
      });

      // Delete the vehicle
      const deleteResult = await caller.vehicles.delete({ id: createResult.id });
      expect(deleteResult).toEqual({ success: true });

      // Verify deletion
      const vehicle = await caller.vehicles.getById({ id: createResult.id });
      expect(vehicle).toBeNull();
    });
  });

  describe("vehicles.bulkImport", () => {
    it("imports multiple vehicles at once", async () => {
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

      const result = await caller.vehicles.bulkImport({ vehicles: vehiclesToImport });

      expect(result).toHaveProperty("count");
      expect(result.count).toBe(2);
    });
  });
});
