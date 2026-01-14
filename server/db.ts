import { eq, like, or, and, desc, asc, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, 
  users, 
  vehicles, 
  vehicleDocuments, 
  maintenanceRecords, 
  drivers, 
  driverVehicleHistory, 
  InsertVehicle, 
  InsertVehicleDocument, 
  InsertMaintenanceRecord, 
  InsertDriver, 
  InsertDriverVehicleHistory, 
  Vehicle, 
  MaintenanceRecord, 
  Driver,
  payrollPeriods,
  driverPayments,
  driverContracts,
  payrollAdjustments,
  payrollImportErrors,
  payrollImportBatches,
  ticketsAndTolls,
  trips,
  InsertPayrollPeriod,
  InsertDriverPayment,
  InsertDriverContract,
  InsertPayrollAdjustment,
  InsertPayrollImportError,
  InsertPayrollImportBatch,
} from "../drizzle/schema";
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


// ============ OC-PAY-2: PAYROLL QUERIES ============

// ============ PAYROLL PERIODS ============

export async function getPayrollPeriods(status?: "open" | "processing" | "completed") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  if (status) {
    conditions.push(eq(payrollPeriods.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(payrollPeriods)
    .where(whereClause)
    .orderBy(desc(payrollPeriods.periodEnd));
}

export async function getPayrollPeriodById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.select().from(payrollPeriods).where(eq(payrollPeriods.id, id)).limit(1);
  return result[0] || null;
}

export async function createPayrollPeriod(data: InsertPayrollPeriod) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payrollPeriods).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updatePayrollPeriod(id: number, data: Partial<InsertPayrollPeriod>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(payrollPeriods).set(data).where(eq(payrollPeriods.id, id));
  return { success: true };
}

// ============ DRIVER PAYMENTS ============

export async function getDriverPaymentsByPeriod(payrollPeriodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      payment: driverPayments,
      driver: {
        id: drivers.id,
        firstName: drivers.firstName,
        lastName: drivers.lastName,
        phone: drivers.phone,
        email: drivers.email,
      },
    })
    .from(driverPayments)
    .leftJoin(drivers, eq(driverPayments.driverId, drivers.id))
    .where(eq(driverPayments.payrollPeriodId, payrollPeriodId))
    .orderBy(asc(drivers.lastName), asc(drivers.firstName));
}

export async function getDriverPaymentById(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db
    .select({
      payment: driverPayments,
      driver: {
        id: drivers.id,
        firstName: drivers.firstName,
        lastName: drivers.lastName,
        phone: drivers.phone,
        email: drivers.email,
      },
    })
    .from(driverPayments)
    .leftJoin(drivers, eq(driverPayments.driverId, drivers.id))
    .where(eq(driverPayments.id, id))
    .limit(1);
  
  return result[0] || null;
}

export async function createDriverPayment(data: InsertDriverPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(driverPayments).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateDriverPayment(id: number, data: Partial<InsertDriverPayment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(driverPayments).set(data).where(eq(driverPayments.id, id));
  return { success: true };
}

export async function upsertDriverPayment(data: InsertDriverPayment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if payment exists for this driver and period
  const existing = await db
    .select()
    .from(driverPayments)
    .where(
      and(
        eq(driverPayments.driverId, data.driverId),
        eq(driverPayments.payrollPeriodId, data.payrollPeriodId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    await db.update(driverPayments).set(data).where(eq(driverPayments.id, existing[0].id));
    return { id: existing[0].id, updated: true };
  } else {
    const result = await db.insert(driverPayments).values(data);
    return { id: Number(result[0].insertId), updated: false };
  }
}

// ============ DRIVER CONTRACTS ============

export async function getActiveContractForDriver(driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const today = new Date().toISOString().split('T')[0];
  
  const result = await db
    .select()
    .from(driverContracts)
    .where(
      and(
        eq(driverContracts.driverId, driverId),
        eq(driverContracts.isActive, true),
        sql`${driverContracts.effectiveDate} <= ${today}`,
        or(
          sql`${driverContracts.endDate} IS NULL`,
          sql`${driverContracts.endDate} >= ${today}`
        )
      )
    )
    .orderBy(desc(driverContracts.effectiveDate))
    .limit(1);

  return result[0] || null;
}

export async function getDriverContracts(driverId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(driverContracts)
    .where(eq(driverContracts.driverId, driverId))
    .orderBy(desc(driverContracts.effectiveDate));
}

export async function createDriverContract(data: InsertDriverContract) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(driverContracts).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateDriverContract(id: number, data: Partial<InsertDriverContract>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(driverContracts).set(data).where(eq(driverContracts.id, id));
  return { success: true };
}

// ============ PAYROLL ADJUSTMENTS ============

export async function getAdjustmentsForPayment(driverPaymentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(payrollAdjustments)
    .where(eq(payrollAdjustments.driverPaymentId, driverPaymentId))
    .orderBy(desc(payrollAdjustments.createdAt));
}

export async function getAdjustmentsForDriverPeriod(driverId: number, payrollPeriodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(payrollAdjustments)
    .where(
      and(
        eq(payrollAdjustments.driverId, driverId),
        eq(payrollAdjustments.payrollPeriodId, payrollPeriodId)
      )
    )
    .orderBy(desc(payrollAdjustments.createdAt));
}

export async function createPayrollAdjustment(data: InsertPayrollAdjustment) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payrollAdjustments).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updatePayrollAdjustment(id: number, data: Partial<InsertPayrollAdjustment>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(payrollAdjustments).set(data).where(eq(payrollAdjustments.id, id));
  return { success: true };
}

export async function deletePayrollAdjustment(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(payrollAdjustments).where(eq(payrollAdjustments.id, id));
  return { success: true };
}

// ============ AUTO-SUGGEST DEDUCTIONS FROM TICKETS/TOLLS ============

export async function getUnpaidTicketsForDriver(driverId: number, periodStart: Date, periodEnd: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(ticketsAndTolls)
    .where(
      and(
        eq(ticketsAndTolls.driverId, driverId),
        eq(ticketsAndTolls.status, "pending"),
        sql`${ticketsAndTolls.issueDate} >= ${periodStart.toISOString().split('T')[0]}`,
        sql`${ticketsAndTolls.issueDate} <= ${periodEnd.toISOString().split('T')[0]}`
      )
    )
    .orderBy(desc(ticketsAndTolls.issueDate));
}

export async function getSuggestedDeductions(driverId: number, payrollPeriodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get the payroll period dates
  const period = await getPayrollPeriodById(payrollPeriodId);
  if (!period) return [];

  // Get unpaid tickets/tolls for this driver in the period
  const tickets = await getUnpaidTicketsForDriver(
    driverId,
    new Date(period.periodStart),
    new Date(period.periodEnd)
  );

  // Check which ones are not already added as adjustments
  const existingAdjustments = await db
    .select()
    .from(payrollAdjustments)
    .where(
      and(
        eq(payrollAdjustments.driverId, driverId),
        eq(payrollAdjustments.payrollPeriodId, payrollPeriodId),
        eq(payrollAdjustments.sourceType, "ticket")
      )
    );

  const existingSourceIds = new Set(existingAdjustments.map(a => a.sourceId));

  return tickets
    .filter(t => !existingSourceIds.has(t.id))
    .map(t => ({
      ticketId: t.id,
      ticketType: t.ticketType,
      ticketNumber: t.ticketNumber,
      amount: t.amount,
      issueDate: t.issueDate,
      suggestedAdjustment: {
        adjustmentType: "deduction" as const,
        amount: t.amount,
        memo: `${t.ticketType.toUpperCase()} - ${t.ticketNumber || 'No number'}`,
        sourceRef: t.ticketNumber || `TICKET-${t.id}`,
        sourceType: "ticket",
        sourceId: t.id,
      },
    }));
}

// ============ PAYROLL IMPORT ERRORS ============

export async function getImportErrors(batchId?: string, includeResolved: boolean = false) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  if (batchId) {
    conditions.push(eq(payrollImportErrors.importBatchId, batchId));
  }
  if (!includeResolved) {
    conditions.push(eq(payrollImportErrors.isResolved, false));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(payrollImportErrors)
    .where(whereClause)
    .orderBy(desc(payrollImportErrors.importDate), asc(payrollImportErrors.rowNumber));
}

export async function createImportError(data: InsertPayrollImportError) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payrollImportErrors).values(data);
  return { id: Number(result[0].insertId) };
}

export async function resolveImportError(id: number, userId: number, notes?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(payrollImportErrors).set({
    isResolved: true,
    resolvedBy: userId,
    resolvedDate: new Date(),
    resolutionNotes: notes,
  }).where(eq(payrollImportErrors.id, id));

  return { success: true };
}

// ============ PAYROLL IMPORT BATCHES ============

export async function getImportBatches(payrollPeriodId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions = [];
  if (payrollPeriodId) {
    conditions.push(eq(payrollImportBatches.payrollPeriodId, payrollPeriodId));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  return db
    .select()
    .from(payrollImportBatches)
    .where(whereClause)
    .orderBy(desc(payrollImportBatches.createdAt));
}

export async function createImportBatch(data: InsertPayrollImportBatch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(payrollImportBatches).values(data);
  return { id: Number(result[0].insertId) };
}

export async function updateImportBatch(id: number, data: Partial<InsertPayrollImportBatch>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(payrollImportBatches).set(data).where(eq(payrollImportBatches.id, id));
  return { success: true };
}

// ============ TRIP DATA FOR PAYROLL ============

export async function getCompletedTripsForPayroll(periodStart: Date, periodEnd: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select({
      trip: trips,
      driver: {
        id: drivers.id,
        firstName: drivers.firstName,
        lastName: drivers.lastName,
      },
    })
    .from(trips)
    .leftJoin(drivers, eq(trips.assignedDriverId, drivers.id))
    .where(
      and(
        eq(trips.status, "completed"),
        sql`${trips.tripDate} >= ${periodStart.toISOString().split('T')[0]}`,
        sql`${trips.tripDate} <= ${periodEnd.toISOString().split('T')[0]}`
      )
    )
    .orderBy(asc(drivers.lastName), asc(trips.tripDate));
}

export async function getDriverTripsForPeriod(driverId: number, periodStart: Date, periodEnd: Date) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return db
    .select()
    .from(trips)
    .where(
      and(
        eq(trips.assignedDriverId, driverId),
        eq(trips.status, "completed"),
        sql`${trips.tripDate} >= ${periodStart.toISOString().split('T')[0]}`,
        sql`${trips.tripDate} <= ${periodEnd.toISOString().split('T')[0]}`
      )
    )
    .orderBy(asc(trips.tripDate));
}

// ============ PAYROLL CALCULATION HELPERS ============

/**
 * Calculate net pay using the spreadsheet formula:
 * net = (miles * rate) + total_dollars + credits - gas - deductions
 */
export async function calculateDriverNetPay(
  driverId: number,
  payrollPeriodId: number,
  miles: number,
  ratePerMile: number, // in cents
  totalDollars: number = 0 // additional flat amounts in cents
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all adjustments for this driver and period
  const adjustments = await getAdjustmentsForDriverPeriod(driverId, payrollPeriodId);

  // Sum up by type
  let gas = 0;
  let credits = 0;
  let deductions = 0;

  for (const adj of adjustments) {
    if (!adj.isApproved) continue;
    
    switch (adj.adjustmentType) {
      case "gas":
        gas += adj.amount;
        break;
      case "credit":
      case "advance":
        credits += adj.amount;
        break;
      case "deduction":
        deductions += adj.amount;
        break;
    }
  }

  // Calculate using spreadsheet formula
  const grossPay = Math.round(miles * ratePerMile) + totalDollars;
  const netPay = grossPay + credits - gas - deductions;

  return {
    grossPay,
    netPay,
    adjustments: {
      gas,
      credits,
      deductions,
      total: credits - gas - deductions,
    },
  };
}

// ============ PAYROLL EXCEPTIONS ============

export async function getPayrollExceptions(payrollPeriodId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all driver payments for the period
  const payments = await getDriverPaymentsByPeriod(payrollPeriodId);

  const exceptions = [];

  for (const { payment, driver } of payments) {
    const issues = [];

    // Check for negative net pay
    if (payment.netPay < 0) {
      issues.push("Negative net pay");
    }

    // Check for zero trips but has adjustments
    if (payment.tripCount === 0) {
      issues.push("No trips recorded");
    }

    // Check for large deductions (> 50% of gross)
    if (payment.deductions && payment.grossPay > 0) {
      const deductionPercent = (payment.deductions / payment.grossPay) * 100;
      if (deductionPercent > 50) {
        issues.push(`High deductions (${deductionPercent.toFixed(1)}%)`);
      }
    }

    // Check for pending status with past pay date
    const period = await getPayrollPeriodById(payrollPeriodId);
    if (period && payment.status === "pending" && new Date(period.payDate) < new Date()) {
      issues.push("Past due payment");
    }

    if (issues.length > 0) {
      exceptions.push({
        payment,
        driver,
        issues,
      });
    }
  }

  return exceptions;
}
