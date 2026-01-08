import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type CookieCall = {
  name: string;
  options: Record<string, unknown>;
};

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: CookieCall[] } {
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
  it("drivers.list returns an array", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.drivers.list({});

    expect(Array.isArray(result)).toBe(true);
  });

  it("drivers.stats returns driver statistics", async () => {
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
