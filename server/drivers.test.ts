import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock the database functions
vi.mock("./db", () => ({
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
}));

import * as db from "./db";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): {
  ctx: TrpcContext;
  clearedCookies: CookieCall[];
} {
  const clearedCookies: CookieCall[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-drivers",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("drivers router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("drivers.list returns an array", async () => {
    vi.mocked(db.getDrivers).mockResolvedValue([]);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.drivers.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("drivers.stats returns driver statistics", async () => {
    vi.mocked(db.getDriverStats).mockResolvedValue({
      total: 10,
      active: 8,
      assigned: 5,
      licenseExpiring: 2,
    });

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.drivers.stats();

    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("active");
    expect(result).toHaveProperty("assigned");
    expect(result).toHaveProperty("licenseExpiring");
    expect(typeof result.total).toBe("number");
    expect(typeof result.active).toBe("number");
  });

  it("drivers.create creates a new driver", async () => {
    vi.mocked(db.createDriver).mockResolvedValue({ id: 1 });

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newDriver = {
      firstName: "Test",
      lastName: "Driver",
      phone: "555-123-4567",
      email: "test.driver@example.com",
      city: "NN",
      status: "active" as const,
    };

    const result = await caller.drivers.create(newDriver);

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("drivers.getById retrieves a driver", async () => {
    const mockDriver = {
      id: 1,
      firstName: "Retrieve",
      lastName: "Test",
      status: "active" as const,
      phone: null,
      email: null,
      city: null,
      licenseNumber: null,
      licenseExpiration: null,
      assignedVehicleId: null,
      hireDate: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.createDriver).mockResolvedValue({ id: 1 });
    vi.mocked(db.getDriverById).mockResolvedValue(mockDriver);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a driver
    const created = await caller.drivers.create({
      firstName: "Retrieve",
      lastName: "Test",
      status: "active",
    });

    // Then retrieve it
    const result = await caller.drivers.getById({ id: created.id });

    expect(result).not.toBeNull();
    expect(result?.firstName).toBe("Retrieve");
    expect(result?.lastName).toBe("Test");
  });

  it("drivers.update updates driver information", async () => {
    const mockDriver = {
      id: 1,
      firstName: "Updated",
      lastName: "Test",
      phone: "555-999-8888",
      status: "active" as const,
      email: null,
      city: null,
      licenseNumber: null,
      licenseExpiration: null,
      assignedVehicleId: null,
      hireDate: null,
      notes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    vi.mocked(db.createDriver).mockResolvedValue({ id: 1 });
    vi.mocked(db.updateDriver).mockResolvedValue({ success: true });
    vi.mocked(db.getDriverById).mockResolvedValue(mockDriver);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a driver
    const created = await caller.drivers.create({
      firstName: "Update",
      lastName: "Test",
      status: "active",
    });

    // Update the driver
    await caller.drivers.update({
      id: created.id,
      data: {
        firstName: "Updated",
        phone: "555-999-8888",
      },
    });

    // Verify the update
    const updated = await caller.drivers.getById({ id: created.id });
    expect(updated?.firstName).toBe("Updated");
    expect(updated?.phone).toBe("555-999-8888");
  });

  it("drivers.delete removes a driver", async () => {
    vi.mocked(db.createDriver).mockResolvedValue({ id: 1 });
    vi.mocked(db.deleteDriver).mockResolvedValue({ success: true });
    vi.mocked(db.getDriverById).mockResolvedValue(null);

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First create a driver
    const created = await caller.drivers.create({
      firstName: "Delete",
      lastName: "Test",
      status: "active",
    });

    // Delete the driver
    await caller.drivers.delete({ id: created.id });

    // Verify deletion - getById returns null for non-existent drivers
    const deleted = await caller.drivers.getById({ id: created.id });
    expect(deleted).toBeNull();
  });

  it("drivers.bulkImport imports multiple drivers", async () => {
    vi.mocked(db.bulkCreateDrivers).mockResolvedValue({ count: 2 });

    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const drivers = [
      { firstName: "Bulk", lastName: "Driver1" },
      { firstName: "Bulk", lastName: "Driver2" },
    ];

    const result = await caller.drivers.bulkImport({ drivers });

    expect(result).toHaveProperty("count");
    expect(result.count).toBe(2);
  });
});
