import { eq, like, or, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, vehicles, vehicleDocuments, maintenanceRecords, drivers, driverVehicleHistory, InsertVehicle, InsertVehicleDocument, InsertMaintenanceRecord, InsertDriver, InsertDriverVehicleHistory, Vehicle, MaintenanceRecord, Driver } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER QUERIES ============

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ VEHICLE QUERIES ============

export interface VehicleFilters {
  search?: string;
  city?: string;
  make?: string;
  model?: string;
  year?: number;
  isActive?: "active" | "inactive";
}

export async function getVehicles(filters: VehicleFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(vehicles.vehicleNumber, searchTerm),
        like(vehicles.tagNumber, searchTerm),
        like(vehicles.vin, searchTerm),
        like(vehicles.make, searchTerm),
        like(vehicles.model, searchTerm)
      )
    );
  }

  if (filters.city) {
    conditions.push(eq(vehicles.city, filters.city));
  }

  if (filters.make) {
    conditions.push(eq(vehicles.make, filters.make));
  }

  if (filters.model) {
    conditions.push(eq(vehicles.model, filters.model));
  }

  if (filters.year) {
    conditions.push(eq(vehicles.year, filters.year));
  }

  if (filters.isActive) {
    conditions.push(eq(vehicles.isActive, filters.isActive));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(vehicles)
    .where(whereClause)
    .orderBy(asc(vehicles.vehicleNumber));
}

export async function getVehicleById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(vehicles).where(eq(vehicles.id, id)).limit(1);
  return result[0] || null;
}

export async function createVehicle(data: InsertVehicle) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vehicles).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateVehicle(id: number, data: Partial<InsertVehicle>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(vehicles).set(data).where(eq(vehicles.id, id));
  return { success: true };
}

export async function deleteVehicle(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(vehicles).where(eq(vehicles.id, id));
  return { success: true };
}

export async function getVehicleFilterOptions() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [cities, makes, models, years] = await Promise.all([
    db.selectDistinct({ city: vehicles.city }).from(vehicles).where(sql`${vehicles.city} IS NOT NULL`),
    db.selectDistinct({ make: vehicles.make }).from(vehicles).where(sql`${vehicles.make} IS NOT NULL`),
    db.selectDistinct({ model: vehicles.model }).from(vehicles).where(sql`${vehicles.model} IS NOT NULL`),
    db.selectDistinct({ year: vehicles.year }).from(vehicles).where(sql`${vehicles.year} IS NOT NULL`).orderBy(desc(vehicles.year)),
  ]);

  return {
    cities: cities.map(c => c.city).filter(Boolean) as string[],
    makes: makes.map(m => m.make).filter(Boolean) as string[],
    models: models.map(m => m.model).filter(Boolean) as string[],
    years: years.map(y => y.year).filter(Boolean) as number[],
  };
}

export async function bulkCreateVehicles(vehicleList: InsertVehicle[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (vehicleList.length === 0) return { count: 0 };

  await db.insert(vehicles).values(vehicleList);
  return { count: vehicleList.length };
}

// ============ DOCUMENT QUERIES ============

export async function getVehicleDocuments(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(vehicleDocuments)
    .where(eq(vehicleDocuments.vehicleId, vehicleId))
    .orderBy(desc(vehicleDocuments.createdAt));
}

export async function createVehicleDocument(data: InsertVehicleDocument) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vehicleDocuments).values(data);
  return { id: Number(result[0].insertId) };
}

export async function deleteVehicleDocument(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(vehicleDocuments).where(eq(vehicleDocuments.id, id));
  return { success: true };
}

export async function getDocumentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(vehicleDocuments).where(eq(vehicleDocuments.id, id)).limit(1);
  return result[0] || null;
}

// ============ STATS QUERIES ============

export async function getVehicleStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [totalResult, activeResult, expiringSoonResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(vehicles),
    db.select({ count: sql<number>`count(*)` }).from(vehicles).where(eq(vehicles.isActive, "active")),
    db.select({ count: sql<number>`count(*)` }).from(vehicles).where(
      and(
        eq(vehicles.isActive, "active"),
        or(
          and(
            sql`${vehicles.registrationExp} IS NOT NULL`,
            sql`${vehicles.registrationExp} <= ${thirtyDaysFromNow.toISOString().split('T')[0]}`
          ),
          and(
            sql`${vehicles.stateInspectionExp} IS NOT NULL`,
            sql`${vehicles.stateInspectionExp} <= ${thirtyDaysFromNow.toISOString().split('T')[0]}`
          )
        )
      )
    ),
  ]);

  return {
    total: totalResult[0]?.count || 0,
    active: activeResult[0]?.count || 0,
    expiringSoon: expiringSoonResult[0]?.count || 0,
  };
}


// ============ MAINTENANCE RECORD QUERIES ============

export async function getMaintenanceRecords(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.vehicleId, vehicleId))
    .orderBy(desc(maintenanceRecords.serviceDate));
}

export async function getMaintenanceRecordById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(maintenanceRecords).where(eq(maintenanceRecords.id, id)).limit(1);
  return result[0] || null;
}

export async function createMaintenanceRecord(data: InsertMaintenanceRecord) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(maintenanceRecords).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateMaintenanceRecord(id: number, data: Partial<InsertMaintenanceRecord>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(maintenanceRecords).set(data).where(eq(maintenanceRecords.id, id));
  return { success: true };
}

export async function deleteMaintenanceRecord(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(maintenanceRecords).where(eq(maintenanceRecords.id, id));
  return { success: true };
}

export async function getRecentMaintenanceForVehicle(vehicleId: number, limit: number = 5) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(maintenanceRecords)
    .where(eq(maintenanceRecords.vehicleId, vehicleId))
    .orderBy(desc(maintenanceRecords.serviceDate))
    .limit(limit);
}


// ============ DRIVER QUERIES ============

export interface DriverFilters {
  search?: string;
  city?: string;
  status?: "active" | "inactive" | "on_leave" | "terminated";
  hasVehicle?: boolean;
}

export async function getDrivers(filters: DriverFilters = {}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];

  if (filters.search) {
    const searchTerm = `%${filters.search}%`;
    conditions.push(
      or(
        like(drivers.firstName, searchTerm),
        like(drivers.lastName, searchTerm),
        like(drivers.phone, searchTerm),
        like(drivers.email, searchTerm),
        like(drivers.licenseNumber, searchTerm)
      )
    );
  }

  if (filters.city) {
    conditions.push(eq(drivers.city, filters.city));
  }

  if (filters.status) {
    conditions.push(eq(drivers.status, filters.status));
  }

  if (filters.hasVehicle === true) {
    conditions.push(sql`${drivers.assignedVehicleId} IS NOT NULL`);
  } else if (filters.hasVehicle === false) {
    conditions.push(sql`${drivers.assignedVehicleId} IS NULL`);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(drivers)
    .where(whereClause)
    .orderBy(asc(drivers.lastName), asc(drivers.firstName));
}

export async function getDriverById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
  return result[0] || null;
}

export async function getDriverByVehicleId(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(drivers).where(eq(drivers.assignedVehicleId, vehicleId)).limit(1);
  return result[0] || null;
}

export async function createDriver(data: InsertDriver) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(drivers).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateDriver(id: number, data: Partial<InsertDriver>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(drivers).set(data).where(eq(drivers.id, id));
  return { success: true };
}

export async function deleteDriver(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(drivers).where(eq(drivers.id, id));
  return { success: true };
}

export async function assignVehicleToDriver(driverId: number, vehicleId: number | null, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current driver info
  const driver = await getDriverById(driverId);
  if (!driver) throw new Error("Driver not found");

  // If driver had a previous vehicle, record the unassignment
  if (driver.assignedVehicleId) {
    await db.update(driverVehicleHistory)
      .set({ unassignedDate: new Date() })
      .where(
        and(
          eq(driverVehicleHistory.driverId, driverId),
          eq(driverVehicleHistory.vehicleId, driver.assignedVehicleId),
          sql`${driverVehicleHistory.unassignedDate} IS NULL`
        )
      );
  }

  // Update driver's assigned vehicle
  await db.update(drivers)
    .set({ assignedVehicleId: vehicleId })
    .where(eq(drivers.id, driverId));

  // If assigning a new vehicle, create history record
  if (vehicleId) {
    await db.insert(driverVehicleHistory).values({
      driverId,
      vehicleId,
      assignedDate: new Date(),
      notes,
    });
  }

  return { success: true };
}

export async function getDriverVehicleHistory(driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      id: driverVehicleHistory.id,
      vehicleId: driverVehicleHistory.vehicleId,
      assignedDate: driverVehicleHistory.assignedDate,
      unassignedDate: driverVehicleHistory.unassignedDate,
      notes: driverVehicleHistory.notes,
      vehicleNumber: vehicles.vehicleNumber,
      tagNumber: vehicles.tagNumber,
      make: vehicles.make,
      model: vehicles.model,
      year: vehicles.year,
    })
    .from(driverVehicleHistory)
    .leftJoin(vehicles, eq(driverVehicleHistory.vehicleId, vehicles.id))
    .where(eq(driverVehicleHistory.driverId, driverId))
    .orderBy(desc(driverVehicleHistory.assignedDate));
}

export async function bulkCreateDrivers(driverList: InsertDriver[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  if (driverList.length === 0) return { count: 0 };

  await db.insert(drivers).values(driverList);
  return { count: driverList.length };
}

export async function getDriverStats() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date();
  const thirtyDaysFromNow = new Date(today);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const [totalResult, activeResult, assignedResult, licenseExpiringResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(drivers),
    db.select({ count: sql<number>`count(*)` }).from(drivers).where(eq(drivers.status, "active")),
    db.select({ count: sql<number>`count(*)` }).from(drivers).where(sql`${drivers.assignedVehicleId} IS NOT NULL`),
    db.select({ count: sql<number>`count(*)` }).from(drivers).where(
      and(
        eq(drivers.status, "active"),
        sql`${drivers.licenseExpiration} IS NOT NULL`,
        sql`${drivers.licenseExpiration} <= ${thirtyDaysFromNow.toISOString().split('T')[0]}`
      )
    ),
  ]);

  return {
    total: totalResult[0]?.count || 0,
    active: activeResult[0]?.count || 0,
    assigned: assignedResult[0]?.count || 0,
    licenseExpiring: licenseExpiringResult[0]?.count || 0,
  };
}
