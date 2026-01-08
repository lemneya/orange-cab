import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the database functions
vi.mock("./db", () => ({
  getMaintenanceRecords: vi.fn(),
  getMaintenanceRecordById: vi.fn(),
  createMaintenanceRecord: vi.fn(),
  updateMaintenanceRecord: vi.fn(),
  deleteMaintenanceRecord: vi.fn(),
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
}));

import * as db from "./db";

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

describe("maintenance router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maintenance.listByVehicle returns maintenance records for a vehicle", async () => {
    const mockRecords = [
      {
        id: 1,
        vehicleId: 1,
        maintenanceType: "oil_change",
        description: "Regular oil change",
        serviceDate: new Date("2024-01-15"),
        mileage: 50000,
        cost: 5999,
        serviceProvider: "Quick Lube",
        invoiceNumber: "INV-001",
        nextServiceDate: new Date("2024-04-15"),
        nextServiceMileage: 55000,
        notes: null,
        createdBy: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(db.getMaintenanceRecords).mockResolvedValue(mockRecords);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.maintenance.listByVehicle({ vehicleId: 1 });

    expect(result).toEqual(mockRecords);
    expect(db.getMaintenanceRecords).toHaveBeenCalledWith(1);
  });

  it("maintenance.getById returns a single maintenance record", async () => {
    const mockRecord = {
      id: 1,
      vehicleId: 1,
      maintenanceType: "oil_change" as const,
      description: "Regular oil change",
      serviceDate: new Date("2024-01-15"),
      mileage: 50000,
      cost: 5999,
      serviceProvider: "Quick Lube",
      invoiceNumber: "INV-001",
      nextServiceDate: new Date("2024-04-15"),
      nextServiceMileage: 55000,
      notes: null,
      createdBy: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.getMaintenanceRecordById).mockResolvedValue(mockRecord);

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.maintenance.getById({ id: 1 });

    expect(result).toEqual(mockRecord);
    expect(db.getMaintenanceRecordById).toHaveBeenCalledWith(1);
  });

  it("maintenance.create creates a new maintenance record", async () => {
    vi.mocked(db.createMaintenanceRecord).mockResolvedValue({ id: 1 });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.maintenance.create({
      vehicleId: 1,
      maintenanceType: "oil_change",
      description: "Regular oil change",
      serviceDate: "2024-01-15",
      mileage: 50000,
      cost: 5999,
      serviceProvider: "Quick Lube",
      invoiceNumber: "INV-001",
      nextServiceDate: "2024-04-15",
      nextServiceMileage: 55000,
      notes: null,
    });

    expect(result).toEqual({ id: 1 });
    expect(db.createMaintenanceRecord).toHaveBeenCalledWith(
      expect.objectContaining({
        vehicleId: 1,
        maintenanceType: "oil_change",
        description: "Regular oil change",
        mileage: 50000,
        cost: 5999,
        serviceProvider: "Quick Lube",
        invoiceNumber: "INV-001",
        nextServiceMileage: 55000,
        createdBy: 1,
      })
    );
  });

  it("maintenance.update updates a maintenance record", async () => {
    vi.mocked(db.updateMaintenanceRecord).mockResolvedValue({ success: true });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.maintenance.update({
      id: 1,
      data: {
        description: "Updated description",
        cost: 7999,
      },
    });

    expect(result).toEqual({ success: true });
    expect(db.updateMaintenanceRecord).toHaveBeenCalledWith(1, {
      description: "Updated description",
      cost: 7999,
    });
  });

  it("maintenance.delete deletes a maintenance record", async () => {
    vi.mocked(db.deleteMaintenanceRecord).mockResolvedValue({ success: true });

    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.maintenance.delete({ id: 1 });

    expect(result).toEqual({ success: true });
    expect(db.deleteMaintenanceRecord).toHaveBeenCalledWith(1);
  });
});
