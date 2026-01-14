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


// ============ OC-PAY-3: FUEL + TOLL IMPORT FUNCTIONS ============

import { 
  fuelTransactions, 
  tollTransactions, 
  payrollAllocations, 
  importBatches,
  driverFuelCards,
  vehicleTransponders,
  InsertFuelTransaction,
  InsertTollTransaction,
  InsertPayrollAllocation,
  InsertImportBatch,
  FuelTransaction,
  TollTransaction,
  PayrollAllocation,
  ImportBatch
} from "../drizzle/schema";

// ============ IMPORT BATCH FUNCTIONS ============

export async function createImportBatch(data: InsertImportBatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(importBatches).values(data);
  return { id: Number(result[0].insertId), batchId: data.batchId };
}

export async function updateImportBatch(batchId: string, data: Partial<InsertImportBatch>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(importBatches)
    .set({ ...data, completedAt: new Date() })
    .where(eq(importBatches.batchId, batchId));
}

export async function getImportBatches(type?: "fuel" | "toll") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const query = db.select().from(importBatches);
  if (type) {
    return query.where(eq(importBatches.importType, type)).orderBy(desc(importBatches.createdAt));
  }
  return query.orderBy(desc(importBatches.createdAt));
}

// ============ FUEL TRANSACTION FUNCTIONS ============

export async function createFuelTransaction(data: InsertFuelTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(fuelTransactions).values(data);
  return { id: Number(result[0].insertId) };
}

export async function bulkCreateFuelTransactions(transactions: InsertFuelTransaction[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (transactions.length === 0) return { count: 0, ids: [] };
  
  const result = await db.insert(fuelTransactions).values(transactions);
  return { count: transactions.length, insertId: Number(result[0].insertId) };
}

export async function getFuelTransactions(filters?: { 
  batchId?: string; 
  startDate?: Date; 
  endDate?: Date;
  cardId?: string;
  unitNumber?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(fuelTransactions);
  
  const conditions = [];
  if (filters?.batchId) {
    conditions.push(eq(fuelTransactions.importBatchId, filters.batchId));
  }
  if (filters?.startDate) {
    conditions.push(sql`${fuelTransactions.transactionDate} >= ${filters.startDate}`);
  }
  if (filters?.endDate) {
    conditions.push(sql`${fuelTransactions.transactionDate} <= ${filters.endDate}`);
  }
  if (filters?.cardId) {
    conditions.push(eq(fuelTransactions.cardId, filters.cardId));
  }
  if (filters?.unitNumber) {
    conditions.push(eq(fuelTransactions.unitNumber, filters.unitNumber));
  }
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(fuelTransactions.transactionDate));
  }
  return query.orderBy(desc(fuelTransactions.transactionDate));
}

export async function checkDuplicateFuelTransaction(vendor: string, vendorTxnId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select({ id: fuelTransactions.id })
    .from(fuelTransactions)
    .where(and(
      eq(fuelTransactions.vendor, vendor as any),
      eq(fuelTransactions.vendorTxnId, vendorTxnId)
    ))
    .limit(1);
  
  return existing.length > 0;
}

// ============ TOLL TRANSACTION FUNCTIONS ============

export async function createTollTransaction(data: InsertTollTransaction) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(tollTransactions).values(data);
  return { id: Number(result[0].insertId) };
}

export async function bulkCreateTollTransactions(transactions: InsertTollTransaction[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (transactions.length === 0) return { count: 0, ids: [] };
  
  const result = await db.insert(tollTransactions).values(transactions);
  return { count: transactions.length, insertId: Number(result[0].insertId) };
}

export async function getTollTransactions(filters?: { 
  batchId?: string; 
  startDate?: Date; 
  endDate?: Date;
  transponderNumber?: string;
  licensePlate?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(tollTransactions);
  
  const conditions = [];
  if (filters?.batchId) {
    conditions.push(eq(tollTransactions.importBatchId, filters.batchId));
  }
  if (filters?.startDate) {
    conditions.push(sql`${tollTransactions.transactionDate} >= ${filters.startDate}`);
  }
  if (filters?.endDate) {
    conditions.push(sql`${tollTransactions.transactionDate} <= ${filters.endDate}`);
  }
  if (filters?.transponderNumber) {
    conditions.push(eq(tollTransactions.transponderNumber, filters.transponderNumber));
  }
  if (filters?.licensePlate) {
    conditions.push(eq(tollTransactions.licensePlate, filters.licensePlate));
  }
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(tollTransactions.transactionDate));
  }
  return query.orderBy(desc(tollTransactions.transactionDate));
}

export async function checkDuplicateTollTransaction(vendor: string, vendorTxnId: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const existing = await db.select({ id: tollTransactions.id })
    .from(tollTransactions)
    .where(and(
      eq(tollTransactions.vendor, vendor as any),
      eq(tollTransactions.vendorTxnId, vendorTxnId)
    ))
    .limit(1);
  
  return existing.length > 0;
}

// ============ PAYROLL ALLOCATION FUNCTIONS ============

export async function createPayrollAllocation(data: InsertPayrollAllocation) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(payrollAllocations).values(data);
  return { id: Number(result[0].insertId) };
}

export async function bulkCreatePayrollAllocations(allocations: InsertPayrollAllocation[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  if (allocations.length === 0) return { count: 0 };
  
  await db.insert(payrollAllocations).values(allocations);
  return { count: allocations.length };
}

export async function getPayrollAllocations(filters?: {
  payPeriodId?: number;
  driverId?: number;
  sourceType?: "fuel" | "toll";
  status?: "matched" | "unmatched" | "disputed" | "excluded";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let query = db.select().from(payrollAllocations);
  
  const conditions = [];
  if (filters?.payPeriodId) {
    conditions.push(eq(payrollAllocations.payPeriodId, filters.payPeriodId));
  }
  if (filters?.driverId) {
    conditions.push(eq(payrollAllocations.driverId, filters.driverId));
  }
  if (filters?.sourceType) {
    conditions.push(eq(payrollAllocations.sourceType, filters.sourceType));
  }
  if (filters?.status) {
    conditions.push(eq(payrollAllocations.status, filters.status));
  }
  
  if (conditions.length > 0) {
    return query.where(and(...conditions)).orderBy(desc(payrollAllocations.createdAt));
  }
  return query.orderBy(desc(payrollAllocations.createdAt));
}

export async function getUnmatchedAllocations(payPeriodId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [eq(payrollAllocations.status, "unmatched")];
  if (payPeriodId) {
    conditions.push(eq(payrollAllocations.payPeriodId, payPeriodId));
  }
  
  return db.select().from(payrollAllocations)
    .where(and(...conditions))
    .orderBy(desc(payrollAllocations.createdAt));
}

export async function updatePayrollAllocation(id: number, data: Partial<InsertPayrollAllocation> & { 
  assignedBy?: number; 
  assignedAt?: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(payrollAllocations)
    .set(data)
    .where(eq(payrollAllocations.id, id));
}

export async function assignAllocationToDriver(
  allocationId: number, 
  driverId: number, 
  userId: number,
  confidence: "direct" | "vehicle_time" | "manual" = "manual"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(payrollAllocations)
    .set({
      driverId,
      status: "matched",
      confidence,
      assignedBy: userId,
      assignedAt: new Date(),
    })
    .where(eq(payrollAllocations.id, allocationId));
}

export async function getDriverAllocationTotals(driverId: number, payPeriodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const results = await db.select({
    sourceType: payrollAllocations.sourceType,
    totalAmount: sql<number>`SUM(${payrollAllocations.amount})`,
    count: sql<number>`COUNT(*)`,
  })
    .from(payrollAllocations)
    .where(and(
      eq(payrollAllocations.driverId, driverId),
      eq(payrollAllocations.payPeriodId, payPeriodId),
      eq(payrollAllocations.status, "matched")
    ))
    .groupBy(payrollAllocations.sourceType);
  
  return {
    fuel: results.find(r => r.sourceType === "fuel") || { totalAmount: 0, count: 0 },
    toll: results.find(r => r.sourceType === "toll") || { totalAmount: 0, count: 0 },
  };
}

// ============ DRIVER FUEL CARD FUNCTIONS ============

export async function getDriverFuelCards(driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(driverFuelCards)
    .where(eq(driverFuelCards.driverId, driverId))
    .orderBy(desc(driverFuelCards.createdAt));
}

export async function findDriverByFuelCard(cardId: string, vendor?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    eq(driverFuelCards.cardId, cardId),
    eq(driverFuelCards.isActive, true)
  ];
  if (vendor) {
    conditions.push(eq(driverFuelCards.vendor, vendor as any));
  }
  
  const result = await db.select({
    driverId: driverFuelCards.driverId,
    driverFirstName: drivers.firstName,
    driverLastName: drivers.lastName,
  })
    .from(driverFuelCards)
    .leftJoin(drivers, eq(driverFuelCards.driverId, drivers.id))
    .where(and(...conditions))
    .limit(1);
  
  return result[0] || null;
}

// ============ VEHICLE TRANSPONDER FUNCTIONS ============

export async function getVehicleTransponders(vehicleId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db.select().from(vehicleTransponders)
    .where(eq(vehicleTransponders.vehicleId, vehicleId))
    .orderBy(desc(vehicleTransponders.createdAt));
}

export async function findVehicleByTransponder(transponderNumber: string, vendor?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const conditions = [
    eq(vehicleTransponders.transponderNumber, transponderNumber),
    eq(vehicleTransponders.isActive, true)
  ];
  if (vendor) {
    conditions.push(eq(vehicleTransponders.vendor, vendor as any));
  }
  
  const result = await db.select({
    vehicleId: vehicleTransponders.vehicleId,
    vehicleNumber: vehicles.vehicleNumber,
    tagNumber: vehicles.tagNumber,
  })
    .from(vehicleTransponders)
    .leftJoin(vehicles, eq(vehicleTransponders.vehicleId, vehicles.id))
    .where(and(...conditions))
    .limit(1);
  
  return result[0] || null;
}

// ============ ALLOCATION MATCHING LOGIC ============

export async function autoMatchFuelTransaction(
  txn: FuelTransaction, 
  payPeriodId: number
): Promise<{ matched: boolean; driverId?: number; confidence?: string; reason?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Strategy 1: Direct match via fuel card
  if (txn.cardId) {
    const driverMatch = await findDriverByFuelCard(txn.cardId, txn.vendor);
    if (driverMatch) {
      return {
        matched: true,
        driverId: driverMatch.driverId,
        confidence: "direct",
        reason: `Matched via fuel card ${txn.cardId} assigned to ${driverMatch.driverFirstName} ${driverMatch.driverLastName}`
      };
    }
  }
  
  // Strategy 2: Match via vehicle unit number + driver assignment
  if (txn.unitNumber) {
    const vehicleMatch = await db.select({
      vehicleId: vehicles.id,
      driverId: drivers.id,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
    })
      .from(vehicles)
      .leftJoin(drivers, eq(vehicles.id, drivers.assignedVehicleId))
      .where(eq(vehicles.vehicleNumber, txn.unitNumber))
      .limit(1);
    
    if (vehicleMatch[0]?.driverId) {
      return {
        matched: true,
        driverId: vehicleMatch[0].driverId,
        confidence: "vehicle_time",
        reason: `Matched via vehicle ${txn.unitNumber} assigned to ${vehicleMatch[0].driverFirstName} ${vehicleMatch[0].driverLastName}`
      };
    }
  }
  
  // Strategy 3: Match via license plate
  if (txn.licensePlate) {
    const plateMatch = await db.select({
      vehicleId: vehicles.id,
      driverId: drivers.id,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
    })
      .from(vehicles)
      .leftJoin(drivers, eq(vehicles.id, drivers.assignedVehicleId))
      .where(eq(vehicles.tagNumber, txn.licensePlate))
      .limit(1);
    
    if (plateMatch[0]?.driverId) {
      return {
        matched: true,
        driverId: plateMatch[0].driverId,
        confidence: "vehicle_time",
        reason: `Matched via license plate ${txn.licensePlate} assigned to ${plateMatch[0].driverFirstName} ${plateMatch[0].driverLastName}`
      };
    }
  }
  
  return { matched: false, reason: "No matching driver found" };
}

export async function autoMatchTollTransaction(
  txn: TollTransaction, 
  payPeriodId: number
): Promise<{ matched: boolean; driverId?: number; vehicleId?: number; confidence?: string; reason?: string }> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Strategy 1: Direct match via transponder
  if (txn.transponderNumber) {
    const vehicleMatch = await findVehicleByTransponder(txn.transponderNumber, txn.vendor);
    if (vehicleMatch) {
      // Find driver assigned to this vehicle
      const driverMatch = await db.select({
        driverId: drivers.id,
        driverFirstName: drivers.firstName,
        driverLastName: drivers.lastName,
      })
        .from(drivers)
        .where(eq(drivers.assignedVehicleId, vehicleMatch.vehicleId))
        .limit(1);
      
      if (driverMatch[0]) {
        return {
          matched: true,
          driverId: driverMatch[0].driverId,
          vehicleId: vehicleMatch.vehicleId,
          confidence: "direct",
          reason: `Matched via transponder ${txn.transponderNumber} on vehicle ${vehicleMatch.vehicleNumber} assigned to ${driverMatch[0].driverFirstName} ${driverMatch[0].driverLastName}`
        };
      }
      
      return {
        matched: false,
        vehicleId: vehicleMatch.vehicleId,
        reason: `Vehicle ${vehicleMatch.vehicleNumber} found but no driver currently assigned`
      };
    }
  }
  
  // Strategy 2: Match via license plate
  if (txn.licensePlate) {
    const plateMatch = await db.select({
      vehicleId: vehicles.id,
      vehicleNumber: vehicles.vehicleNumber,
      driverId: drivers.id,
      driverFirstName: drivers.firstName,
      driverLastName: drivers.lastName,
    })
      .from(vehicles)
      .leftJoin(drivers, eq(vehicles.id, drivers.assignedVehicleId))
      .where(eq(vehicles.tagNumber, txn.licensePlate))
      .limit(1);
    
    if (plateMatch[0]?.driverId) {
      return {
        matched: true,
        driverId: plateMatch[0].driverId,
        vehicleId: plateMatch[0].vehicleId,
        confidence: "vehicle_time",
        reason: `Matched via license plate ${txn.licensePlate} assigned to ${plateMatch[0].driverFirstName} ${plateMatch[0].driverLastName}`
      };
    }
    
    if (plateMatch[0]?.vehicleId) {
      return {
        matched: false,
        vehicleId: plateMatch[0].vehicleId,
        reason: `Vehicle ${plateMatch[0].vehicleNumber} found but no driver currently assigned`
      };
    }
  }
  
  return { matched: false, reason: "No matching vehicle or driver found" };
}
